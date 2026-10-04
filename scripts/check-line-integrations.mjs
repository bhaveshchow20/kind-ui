import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { build } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.env.npm_execpath;
assert.ok(npm, "Run npm run check:line-integrations after npm run pack:artifact");
const evidence = JSON.parse(
  await readFile(join(root, "artifacts/package/validated-artifact.json"), "utf8"),
);
const tarball = join(root, "artifacts/package", evidence.filename);
assert.equal(
  createHash("sha256")
    .update(await readFile(tarball))
    .digest("hex"),
  evidence.sha256,
);
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const scratch = await mkdtemp(join(tmpdir(), "kind-line-integrations-"));
const run = (command, args, cwd = scratch) =>
  execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NODE_PATH: "" },
  });
try {
  await writeFile(join(scratch, "package.json"), JSON.stringify({ private: true, type: "module" }));
  const dependencies = [
    "react",
    "react-dom",
    "react-is",
    "motion",
    "recharts",
    "@types/react",
    "@types/react-dom",
    "@types/node",
    "typescript",
    "tailwindcss",
  ];
  run(process.execPath, [
    npm,
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--package-lock=false",
    tarball,
    ...dependencies.map((name) => `${name}@${manifest.devDependencies[name]}`),
    "next@16.3.8",
    "lucide-react@1.50.0",
  ]);
  const source = await readFile(join(root, "tests/fixtures/line-integrations/host.tsx"), "utf8");
  await writeFile(join(scratch, "host.tsx"), source);
  await writeFile(
    join(scratch, "main.tsx"),
    'import { createRoot } from "react-dom/client"; import { IntegrationHost } from "./host.js"; import "./styles.css"; const root=document.getElementById("root"); if(!root)throw new Error("Missing root"); createRoot(root).render(<IntegrationHost />);',
  );
  await writeFile(
    join(scratch, "styles.css"),
    '@layer theme, base, kind-ui, components, utilities;\n@import "tailwindcss";\n@import "@kind-ui/charts/styles.css";\n@source "./host.tsx";',
  );
  await writeFile(
    join(scratch, "index.html"),
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Tailwind and Lucide integration</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
  );
  await writeFile(
    join(scratch, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        skipLibCheck: false,
        noEmit: true,
      },
      files: ["host.tsx", "main.tsx"],
    }),
  );
  run(process.execPath, [join(scratch, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"]);
  const bundledIcons = new Set();
  await build({
    configFile: false,
    root: scratch,
    logLevel: "warn",
    plugins: [
      tailwindcss(),
      {
        name: "icon-contract",
        generateBundle(_options, bundle) {
          for (const chunk of Object.values(bundle))
            if (chunk.type === "chunk")
              for (const id of chunk.moduleIds)
                if (/lucide-react\/dist\/esm\/icons\//.test(id)) bundledIcons.add(id);
        },
      },
    ],
    build: { outDir: join(root, "artifacts/packed-line-integrations"), emptyOutDir: true },
  });
  assert.ok(
    bundledIcons.size <= 2 && bundledIcons.size >= 1,
    `Named icon import must retain only the selected Lucide icon: ${bundledIcons.size}`,
  );
  await mkdir(join(scratch, "app"));
  await writeFile(join(scratch, "app/charts.tsx"), '"use client";\n' + source);
  await writeFile(
    join(scratch, "app/layout.tsx"),
    'import "@kind-ui/charts/styles.css"; export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}',
  );
  await writeFile(
    join(scratch, "app/page.tsx"),
    `import { LineChart } from "@kind-ui/charts"; import { IntegrationHost } from "./charts"; export default function Page(){return <main><LineChart data={[{ month:"Jan", total:0 }]} config={{ total:{label:"Total",color:"red"} }} xDataKey="month" aria-label="Server boundary totals" /><IntegrationHost /></main>}`,
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
  const nextLog = run(process.execPath, [
    join(scratch, "node_modules/next/dist/bin/next"),
    "build",
    "--webpack",
  ]);
  await mkdir(join(root, "artifacts/line-integrations"), { recursive: true });
  await writeFile(join(root, "artifacts/line-integrations/next-build.log"), nextLog);
  const html = await readFile(join(scratch, "out/index.html"), "utf8");
  assert.match(html, /Server boundary totals/);
  // Native responsive SSR emits an empty wrapper; the client supplies SVG ARIA.
  assert.match(html, /lucide-trending-up/);
  const nextOutput = join(root, "artifacts/packed-line-next");
  await rm(nextOutput, { recursive: true, force: true });
  await cp(join(scratch, "out"), nextOutput, { recursive: true });
  await writeFile(
    join(root, "artifacts/line-integrations/evidence.json"),
    JSON.stringify(
      {
        sha256: evidence.sha256,
        next: "16.3.8",
        tailwind: manifest.devDependencies.tailwindcss,
        lucide: "1.50.0",
        iconModules: [...bundledIcons].map((id) => id.slice(id.indexOf("lucide-react/"))),
      },
      null,
      2,
    ),
  );
  console.log(
    `Next App Router build passed; Tailwind v4 production consumer built; Lucide retained ${bundledIcons.size} icon module(s); tarball SHA-256 ${evidence.sha256}`,
  );
} finally {
  await rm(scratch, { recursive: true, force: true });
}
