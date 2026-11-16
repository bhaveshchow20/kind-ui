import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { assertCompatibilityMatrix, compatibilityMatrix } from "./compatibility-matrix.mjs";
import {
  artifactReceiptSchema,
  packageIdentitySchema,
  packageManifestSchema,
  parseJson,
} from "./tooling-schemas.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.env.npm_execpath;
assert.ok(npm, "Run npm run check:line-integrations after npm run pack:artifact");
const evidence = artifactReceiptSchema.parse(
  parseJson(await readFile(join(root, "artifacts/package/validated-artifact.json"), "utf8")),
);
const tarball = join(root, "artifacts/package", evidence.filename);
assert.equal(
  createHash("sha256")
    .update(await readFile(tarball))
    .digest("hex"),
  evidence.sha256,
);
const manifest = packageManifestSchema.parse(
  parseJson(await readFile(join(root, "packages/charts/package.json"), "utf8")),
);
assertCompatibilityMatrix(manifest.peerDependencies);
const evidenceDirectory = join(root, "artifacts/line-integrations");
await mkdir(evidenceDirectory, { recursive: true });
await rm(join(evidenceDirectory, "compatibility-evidence.json"), { force: true });
await rm(join(evidenceDirectory, "evidence.json"), { force: true });
for (const row of compatibilityMatrix) {
  await rm(join(root, row.viteOutput), { recursive: true, force: true });
  await rm(join(root, row.nextOutput), { recursive: true, force: true });
}
/** @type {Array<{ id: string, sha256: string, versions: Record<string, string>, iconModules: string[], checks: string[] }>} */
const results = [];
for (const row of compatibilityMatrix) {
  const scratch = await mkdtemp(join(tmpdir(), `kind-compatibility-${row.id}-`));
  /** @param {string} command @param {string[]} args @param {string} [cwd] */
  const run = (command, args, cwd = scratch) =>
    execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NODE_PATH: "" },
    });
  try {
    await writeFile(
      join(scratch, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        overrides: {
          "@tailwindcss/node": row.versions["@tailwindcss/node"],
          "@tailwindcss/oxide": row.versions["@tailwindcss/oxide"],
          "framer-motion": row.versions["framer-motion"],
          "motion-dom": row.versions["motion-dom"],
          "motion-utils": row.versions["motion-utils"],
        },
      }),
    );
    run(process.execPath, [
      npm,
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      tarball,
      ...Object.entries(row.versions).map(([name, version]) => `${name}@${version}`),
    ]);
    const installedPackage = join(scratch, "node_modules/@kind-ui/charts");
    assert.equal(
      await realpath(installedPackage),
      join(await realpath(scratch), "node_modules/@kind-ui/charts"),
      "Consumer must use the actual unpacked tarball, not a workspace link",
    );
    const installedManifest = packageManifestSchema.parse(
      parseJson(await readFile(join(installedPackage, "package.json"), "utf8")),
    );
    assert.deepEqual(installedManifest.peerDependencies, manifest.peerDependencies);
    /** @type {Record<string, string>} */
    const resolvedVersions = {};
    for (const [name, version] of Object.entries(row.versions)) {
      const installed = packageIdentitySchema.parse(
        parseJson(await readFile(join(scratch, "node_modules", name, "package.json"), "utf8")),
      );
      assert.equal(
        installed.version,
        version,
        `${row.id}: installed ${name} differs from its exact pin`,
      );
      resolvedVersions[name] = installed.version;
    }
    run(process.execPath, ["--input-type=module", "-e", "await import('@kind-ui/charts')"]);
    await writeFile(
      join(evidenceDirectory, `${row.id}-npm-ls.json`),
      run(process.execPath, [npm, "ls", "--all", "--json"]),
    );
    const source = await readFile(join(root, "tests/fixtures/line-integrations/host.tsx"), "utf8");
    await writeFile(join(scratch, "host.tsx"), source);
    await writeFile(
      join(scratch, "main.tsx"),
      'import { createRoot } from "react-dom/client"; import { IntegrationHost, ThemingHost, TreemapIntegrationHost } from "./host.js"; import "./styles.css"; const root=document.getElementById("root"); if(!root)throw new Error("Missing root"); createRoot(root).render(<><IntegrationHost /><ThemingHost /><TreemapIntegrationHost /></>);',
    );
    await writeFile(
      join(scratch, "styles.css"),
      '@import "tailwindcss";\n@source "./host.tsx";\n@source "./node_modules/@kind-ui/charts/dist";',
    );
    await writeFile(
      join(scratch, "index.html"),
      '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Tailwind and Lucide integration</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
    );
    // Check the actual public package declarations in both advertised ESM modes.
    for (const mode of ["NodeNext", "Bundler"]) {
      await writeFile(
        join(scratch, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            target: "ES2022",
            module: mode === "Bundler" ? "ESNext" : mode,
            moduleResolution: mode,
            jsx: "react-jsx",
            strict: true,
            skipLibCheck: false,
            exactOptionalPropertyTypes: false,
            noEmit: true,
          },
          files: ["host.tsx", "main.tsx"],
        }),
      );
      run(process.execPath, [
        join(scratch, "node_modules/typescript/bin/tsc"),
        "-p",
        "tsconfig.json",
      ]);
    }
    // Build with this row's installed Vite and Tailwind plugin, never the root's.
    await writeFile(
      join(scratch, "build.mjs"),
      `
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import tailwindcss from "@tailwindcss/vite";
import { build } from "vite";
import { browserDirectives } from ${JSON.stringify(pathToFileURL(join(root, "scripts/browser-directives.mjs")).href)};
const bundledIcons = new Set();
const diagnostics = browserDirectives(process.cwd());
await build({
  configFile: false,
  root: process.cwd(),
  logLevel: "warn",
  plugins: [tailwindcss(), diagnostics.plugin, {
    name: "icon-contract",
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle))
        if (chunk.type === "chunk")
          for (const id of chunk.moduleIds)
            if (id.includes("lucide-react/dist/esm/icons/")) bundledIcons.add(id);
    },
  }],
  build: {
    outDir: ${JSON.stringify(join(root, row.viteOutput))},
    emptyOutDir: true,
    ${row.versions.vite?.startsWith("6.") ? "rollupOptions" : "rolldownOptions"}: { onwarn: diagnostics.onwarn },
  },
});
assert.ok(bundledIcons.size <= 2 && bundledIcons.size >= 1,
  "Named icon import must retain only the selected Lucide icon: " + bundledIcons.size);
await writeFile("icons.json", JSON.stringify([...bundledIcons].map((id) => id.slice(id.indexOf("lucide-react/")))));
`,
    );
    run(process.execPath, ["build.mjs"]);
    const iconModules = z
      .array(z.string())
      .parse(parseJson(await readFile(join(scratch, "icons.json"), "utf8")));
    await mkdir(join(scratch, "app"));
    await writeFile(
      join(scratch, "app/icon.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="red"/></svg>',
    );
    await writeFile(join(scratch, "app/charts.tsx"), `"use client";\n${source}`);
    await writeFile(
      join(scratch, "app/layout.tsx"),
      'import "../styles.css"; export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}',
    );
    // Server components use named client boundaries; compound members remain in client hosts.
    await writeFile(
      join(scratch, "app/page.tsx"),
      `import { LineChart, LineSeries, XAxis } from "@kind-ui/charts"; import { IntegrationHost, PatternHydrationHost, ColorHydrationHost, ThemingHost, TreemapIntegrationHost } from "./charts"; export default function Page(){return <main><LineChart data={[{ month:"Jan", total:0 }]} config={{ total:{label:"Total",color:"red"} }} aria-label="Server boundary totals"><XAxis dataKey="month" /><LineSeries dataKey="total" /></LineChart><IntegrationHost /><PatternHydrationHost /><ColorHydrationHost /><ThemingHost /><TreemapIntegrationHost /></main>}`,
    );
    await writeFile(
      join(scratch, "postcss.config.mjs"),
      'export default { plugins: { "@tailwindcss/postcss": {} } };',
    );
    await writeFile(
      join(scratch, "next.config.mjs"),
      'export default { output:"export", experimental: { cpus: 1 } };',
    );
    await writeFile(
      join(scratch, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          lib: ["DOM", "DOM.Iterable", "ESNext"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "preserve",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          esModuleInterop: true,
          plugins: [{ name: "next" }],
        },
        include: ["next-env.d.ts", "app/**/*.tsx", ".next/types/**/*.ts"],
      }),
    );
    // Actual App Router server -> package client boundary plus a callback/icon client host.
    const nextLogPath = join(
      evidenceDirectory,
      row.id === "peer-floor" ? "next-build.log" : "selected-build.log",
    );
    await mkdir(join(root, "artifacts/line-integrations"), { recursive: true });
    const nextBuild = spawnSync(
      process.execPath,
      [join(scratch, "node_modules/next/dist/bin/next"), "build", "--webpack"],
      {
        cwd: scratch,
        encoding: "utf8",
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NODE_PATH: "" },
      },
    );
    if (nextBuild.stdout) process.stdout.write(nextBuild.stdout);
    if (nextBuild.stderr) process.stderr.write(nextBuild.stderr);
    await writeFile(
      nextLogPath,
      `${nextBuild.stdout ?? ""}\n${nextBuild.stderr ?? ""}${nextBuild.error ? `\n${nextBuild.error.message}` : ""}`,
    );
    if (nextBuild.error) throw nextBuild.error;
    assert.equal(
      nextBuild.status,
      0,
      `Next build failed (${nextBuild.signal ?? nextBuild.status})`,
    );
    const html = await readFile(join(scratch, "out/index.html"), "utf8");
    assert.match(html, /Server boundary totals/);
    assert.match(html, /data-kind-ui="chart"/, "SSR must include the package chart shell");
    assert.match(html, /data-kind-ui="chart-legend"/, "SSR must include package content");
    const patternIds = [...html.matchAll(/<pattern id="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(
      patternIds.length,
      0,
      "Responsive SSR shells defer native plot patterns and portaled legends until hydration",
    );
    // Native responsive SSR emits an empty wrapper; the client supplies SVG ARIA.
    assert.match(
      html,
      /id="compound-integration"/,
      "SSR retains the compound frame before its legend mounts during hydration",
    );
    const nextOutput = join(root, row.nextOutput);
    await rm(nextOutput, { recursive: true, force: true });
    await cp(join(scratch, "out"), nextOutput, { recursive: true });
    assert.equal(
      createHash("sha256")
        .update(await readFile(tarball))
        .digest("hex"),
      evidence.sha256,
      "Tested candidate must not change during integration validation",
    );
    const checks = [
      "actual tarball ESM import",
      "strict NodeNext declarations (skipLibCheck=false)",
      "strict Bundler declarations (skipLibCheck=false)",
      "Next production static export",
      "package SSR shell/content",
      "Tailwind production build",
      "named icon tree-shaking",
    ];
    results.push({
      id: row.id,
      sha256: evidence.sha256,
      versions: resolvedVersions,
      iconModules,
      checks,
    });
    if (row.id === "peer-floor") {
      // Preserve existing release evidence location without running another build.
      await writeFile(
        join(evidenceDirectory, "evidence.json"),
        JSON.stringify(
          {
            sha256: evidence.sha256,
            next: row.versions.next,
            tailwind: row.versions.tailwindcss,
            lucide: row.versions["lucide-react"],
            iconModules,
            checks,
            validation: "build checks only; browser hydration/interaction checks run separately",
          },
          null,
          2,
        ),
      );
    }
    console.log(
      `${row.id}: Next/Vite production builds and strict declarations passed; tarball SHA-256 ${evidence.sha256}`,
    );
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
await writeFile(
  join(evidenceDirectory, "compatibility-evidence.json"),
  JSON.stringify(
    {
      sha256: evidence.sha256,
      rows: results,
      validation:
        "build checks only; every matrix row's browser hydration/styling/interaction checks run separately",
    },
    null,
    2,
  ),
);
