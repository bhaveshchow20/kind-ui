import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { coreVersion, registryItems, sourcePaths } from "../registry/catalog.mjs";
import { compatibilityMatrix } from "./compatibility-matrix.mjs";
import { artifactReceiptSchema, packageIdentitySchema, parseJson } from "./tooling-schemas.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const arguments_ = process.argv.slice(2);
assert.ok(
  arguments_.length === 0 || (arguments_.length === 1 && arguments_[0] === "--published"),
  "Usage: node scripts/check-registry-consumers.mjs [--published]",
);
const published = arguments_.includes("--published");
const receipt = artifactReceiptSchema.parse(
  parseJson(await readFile(path.join(root, "artifacts/package/validated-artifact.json"), "utf8")),
);
assert.equal(receipt.package.version, coreVersion);
const tarball = await readFile(path.join(root, "artifacts/package", receipt.filename));
assert.equal(createHash("sha256").update(tarball).digest("hex"), receipt.sha256);
if (published) {
  for (const item of registryItems) {
    if (!item.minimumCoreVersion) continue;
    const actual = coreVersion.split(".").map(Number);
    const minimum = item.minimumCoreVersion.split(".").map(Number);
    const firstDifference = actual.findIndex((part, index) => part !== minimum[index]);
    const actualPart = actual[firstDifference];
    const minimumPart = minimum[firstDifference];
    assert.ok(
      firstDifference === -1 ||
        (actualPart !== undefined && minimumPart !== undefined && actualPart > minimumPart),
      `Published consumer verification for ${item.name} requires Core ${item.minimumCoreVersion} or later; validated artifact is ${coreVersion}. Use candidate verification for this artifact.`,
    );
  }
}
const publishedMetadata = published ? await verifyPublishedArchive() : undefined;
const output = path.join(root, "artifacts/registry/r");
const evidencePath = path.join(
  root,
  published
    ? "artifacts/registry/published-consumer-evidence.json"
    : "artifacts/registry/consumer-evidence.json",
);
await rm(evidencePath, { force: true });
const payloadSchema = z
  .object({
    dependencies: z.array(z.string()),
    files: z.array(z.object({ content: z.string() }).passthrough()),
  })
  .passthrough();
const originalContents = new Map(
  await Promise.all(
    registryItems.map(
      async ({ name }) =>
        /** @type {const} */ ([name, await readFile(path.join(output, `${name}.json`), "utf8")]),
    ),
  ),
);
const payloads = new Map(
  [...originalContents].map(([name, body]) => [name, payloadSchema.parse(parseJson(body))]),
);
const originalHashes = new Map(
  [...originalContents].map(([name, body]) => [
    name,
    createHash("sha256").update(body).digest("hex"),
  ]),
);
let artifactRequests = 0;
const server = createServer((request, response) => {
  const url = request.url ?? "";
  if (!published && url === "/candidate.tgz") {
    artifactRequests++;
    response.writeHead(200, { "Content-Type": "application/octet-stream" });
    response.end(tarball);
    return;
  }
  const name = url.match(/^\/r\/([a-z-]+)\.json$/)?.[1];
  const item = name ? payloads.get(name) : undefined;
  if (!item) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": "application/json" });
  if (published) {
    // Public-install checks serve the production payload byte-for-byte, including its npm dependency.
    response.end(originalContents.get(name ?? ""));
    return;
  }
  response.end(
    JSON.stringify({
      ...item,
      dependencies: item.dependencies.map((dependency) =>
        dependency.startsWith("@kind-ui/charts@") ? `${endpoint}/candidate.tgz` : dependency,
      ),
    }),
  );
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve(undefined));
});
const address = server.address();
assert.ok(address && typeof address !== "string");
const endpoint = `http://127.0.0.1:${address.port}`;
const selected = compatibilityMatrix.find(({ id }) => id === "selected-stable");
assert.ok(selected);
/** @type {Array<{framework:string, sha256:string, integrity:string, versions:Record<string,string>, checks:string[]}>} */
const results = [];
/** @param {string[]} args @param {string} cwd @param {boolean} [capture] @returns {Promise<string>} */
async function run(args, cwd, capture = false) {
  return await new Promise((resolve, reject) => {
    let stdout = "";
    const child = spawn("npm", args, {
      cwd,
      stdio: ["ignore", capture ? "pipe" : "inherit", "inherit"],
      env: {
        ...process.env,
        npm_config_registry: "https://registry.npmjs.org",
        NEXT_TELEMETRY_DISABLED: "1",
        NODE_PATH: "",
      },
    });
    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`npm ${args.join(" ")} failed (${signal ?? code})`));
    });
  });
}
async function verifyPublishedArchive() {
  const metadata = z
    .object({
      version: z.literal(coreVersion),
      dist: z.object({
        integrity: z.string().startsWith("sha512-"),
        tarball: z.literal(
          `https://registry.npmjs.org/@kind-ui/charts/-/charts-${coreVersion}.tgz`,
        ),
      }),
    })
    .parse(
      parseJson(
        await run(
          [
            "view",
            `@kind-ui/charts@${coreVersion}`,
            "--json",
            "--registry=https://registry.npmjs.org",
          ],
          root,
          true,
        ),
      ),
    );
  assert.equal(
    metadata.dist.integrity,
    receipt.integrity,
    "Published npm integrity must equal the validated candidate",
  );
  const download = await mkdtemp(path.join(tmpdir(), "kind-registry-published-"));
  try {
    // Packing an exact registry spec downloads its published archive; it never repacks workspace source.
    const records = z
      .array(
        z.object({
          filename: z.string().regex(/^[a-z0-9.-]+\.tgz$/),
          integrity: z.string(),
        }),
      )
      .length(1)
      .parse(
        parseJson(
          await run(
            [
              "pack",
              `@kind-ui/charts@${coreVersion}`,
              "--json",
              "--pack-destination",
              download,
              "--registry=https://registry.npmjs.org",
            ],
            download,
            true,
          ),
        ),
      );
    const record = records[0];
    assert.ok(record);
    const archive = await readFile(path.join(download, record.filename));
    const sha256 = createHash("sha256").update(archive).digest("hex");
    const integrity = `sha512-${createHash("sha512").update(archive).digest("base64")}`;
    assert.equal(record.integrity, metadata.dist.integrity);
    assert.equal(
      integrity,
      metadata.dist.integrity,
      "Downloaded published archive must match npm metadata",
    );
    assert.equal(
      sha256,
      receipt.sha256,
      "Published archive must match the exact validated candidate bytes",
    );
    return { ...metadata.dist, sha256, verifiedAt: new Date().toISOString() };
  } finally {
    await rm(download, { recursive: true, force: true });
  }
}
/** @param {string} destination @param {string} contents */
async function write(destination, contents) {
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents);
}
try {
  for (const framework of ["vite", "next"]) {
    const scratch = await mkdtemp(path.join(tmpdir(), `kind-registry-${framework}-`));
    const components = framework === "vite" ? "src/widgets" : "src/features/charts";
    const cssFile = framework === "vite" ? "src/index.css" : "src/app/globals.css";
    const alias = framework === "vite" ? "~" : "@";
    const targetOutput = path.join(root, `artifacts/packed-registry-${framework}`);
    await rm(targetOutput, { recursive: true, force: true });
    try {
      /** @type {Record<string, string>} */
      const versions = Object.fromEntries(
        Object.entries(selected.versions).filter(
          ([name]) =>
            name !== "lucide-react" &&
            name !== (framework === "vite" ? "next" : "vite") &&
            name !== (framework === "vite" ? "@tailwindcss/postcss" : "@tailwindcss/vite"),
        ),
      );
      await write(
        path.join(scratch, "package.json"),
        JSON.stringify({
          name: `kind-registry-${framework}-consumer`,
          private: true,
          type: "module",
          dependencies: versions,
          scripts: { build: framework === "vite" ? "vite build" : "next build --webpack" },
        }),
      );
      await run(["install", "--ignore-scripts", "--no-audit", "--no-fund"], scratch);
      await write(
        path.join(scratch, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            target: "ES2022",
            lib: [framework === "next" ? "ESNext" : "ES2022", "DOM", "DOM.Iterable"],
            module: "ESNext",
            moduleResolution: "Bundler",
            jsx: "react-jsx",
            strict: true,
            // Next's bundled declarations require the same app-only exception as the existing matrix.
            // Installed compositions are checked separately with dependency declarations enabled.
            skipLibCheck: framework === "next",
            noEmit: true,
            esModuleInterop: true,
            baseUrl: ".",
            paths: { [`${alias}/*`]: ["./src/*"] },
          },
          include: ["src"],
        }),
      );
      const initialCss =
        '@import "tailwindcss";\n:root { --foreground: #123456; --background: #ffffff; --popover: #ffffff; --popover-foreground: #123456; --border: #ccddee; --muted-foreground: #556677; }\n.dark { --foreground: #fedcba; --background: #171719; --popover: #252527; --popover-foreground: #fedcba; --border: #454549; --muted-foreground: #aabbcc; }\nbody { margin: 0; background: var(--background); color: var(--foreground); font-family: system-ui, sans-serif; }\nmain { max-width: 760px; margin: 24px auto; padding: 16px; min-width: 0; }\nbutton, select { margin: 4px; border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; }\n';
      await write(path.join(scratch, cssFile), initialCss);
      await write(
        path.join(scratch, "components.json"),
        JSON.stringify({
          $schema: "https://ui.shadcn.com/schema.json",
          style: "new-york",
          rsc: framework === "next",
          tsx: true,
          tailwind: { config: "", css: cssFile, baseColor: "neutral", cssVariables: true },
          aliases: {
            components: `${alias}/${components.replace(/^src\//, "")}`,
            ui: `${alias}/widgets/ui`,
            utils: `${alias}/lib/utils`,
            lib: `${alias}/lib`,
            hooks: `${alias}/hooks`,
          },
          registries: { "@kind-ui": `${endpoint}/r/{name}.json` },
        }),
      );
      await run(
        [
          "exec",
          "--yes",
          "--package=shadcn@4.21.4",
          "--",
          "shadcn",
          "add",
          ...registryItems.map(({ name }) => `@kind-ui/${name}`),
          "--yes",
          "--cwd",
          scratch,
        ],
        scratch,
      );
      const installedPath = path.join(scratch, "node_modules/@kind-ui/charts");
      assert.equal(
        await realpath(installedPath),
        path.join(await realpath(scratch), "node_modules/@kind-ui/charts"),
        "Core must not be a workspace link",
      );
      const installed = packageIdentitySchema.parse(
        parseJson(await readFile(path.join(installedPath, "package.json"), "utf8")),
      );
      assert.equal(installed.version, coreVersion);
      const lock = z
        .object({
          packages: z.record(
            z.string(),
            z
              .object({ integrity: z.string().optional(), resolved: z.string().optional() })
              .passthrough(),
          ),
        })
        .parse(parseJson(await readFile(path.join(scratch, "package-lock.json"), "utf8")));
      assert.equal(lock.packages["node_modules/@kind-ui/charts"]?.integrity, receipt.integrity);
      assert.equal(
        lock.packages["node_modules/@kind-ui/charts"]?.resolved,
        publishedMetadata?.tarball ?? `${endpoint}/candidate.tgz`,
      );
      for (const { name, exampleId } of registryItems) {
        const installedSource = await readFile(
          path.join(scratch, components, `${name}.tsx`),
          "utf8",
        );
        const canonical = await readFile(
          path.join(root, `apps/docs/examples/${exampleId}/example.tsx`),
          "utf8",
        );
        assert.equal(
          installedSource.trim(),
          // The official CLI drops a leading lint-only comment before the client directive.
          canonical.replace(/^\/\/ biome-ignore-all[^\n]*\n/, "").trim(),
          `${framework}: ${name} preserves the canonical composition`,
        );
      }
      const cssAfter = await readFile(path.join(scratch, cssFile), "utf8");
      assert.ok(cssAfter.includes("--foreground: #123456"));
      assert.ok(cssAfter.includes("--foreground: #fedcba"));
      for (const source of sourcePaths)
        assert.equal(cssAfter.split(`@source "${source}"`).length - 1, 1);
      const lineFile = path.join(scratch, components, "line-chart.tsx");
      await writeFile(lineFile, "// Scratch consumer modification\n");
      await run(
        [
          "exec",
          "--yes",
          "--package=shadcn@4.21.4",
          "--",
          "shadcn",
          "add",
          "@kind-ui/line-chart",
          "--yes",
          "--overwrite",
          "--cwd",
          scratch,
        ],
        scratch,
      );
      assert.equal(await readFile(path.join(scratch, cssFile), "utf8"), cssAfter);
      assert.equal(
        (await readFile(lineFile, "utf8")).trim(),
        (await readFile(path.join(root, "apps/docs/examples/line/example.tsx"), "utf8")).trim(),
        "Overwrite must restore the complete editable composition",
      );
      const hostImports = [];
      const renders = [];
      for (const { name } of registryItems) {
        const source = await readFile(path.join(scratch, components, `${name}.tsx`), "utf8");
        const exportName = source.match(/export function (\w+)/)?.[1];
        assert.ok(exportName);
        hostImports.push(
          `import { ${exportName} } from "${alias}/${components.replace(/^src\//, "")}/${name}";`,
        );
        const prop = name === "pie-chart" ? "shape" : name === "radial-chart" ? "labels" : "state";
        const ready = name === "pie-chart" ? "pie" : name === "radial-chart" ? "visible" : "ready";
        renders.push(
          `{name:"${name}",render:(loading:boolean)=><${exportName} ${prop}={loading?"loading":"${ready}"}/>}`,
        );
      }
      await write(
        path.join(scratch, "src/host.tsx"),
        `"use client";\nimport {useEffect,useState} from "react";\n${hostImports.join("\n")}\nconst charts=[${renders.join(",")}];\nexport function RegistryHost(){const [selected,setSelected]=useState("line-chart");const [loading,setLoading]=useState(false);const [dark,setDark]=useState(false);useEffect(()=>{document.documentElement.classList.toggle("dark",dark)},[dark]);const chart=charts.find(({name})=>name===selected);return <main><h1>Installed chart compositions</h1><label>Chart<select aria-label="Chart" value={selected} onChange={event=>setSelected(event.target.value)}>{charts.map(({name})=><option key={name}>{name}</option>)}</select></label><button onClick={()=>setLoading(!loading)} aria-pressed={loading}>Loading</button><button onClick={()=>setDark(!dark)} aria-pressed={dark}>Dark mode</button><section aria-label="Installed composition">{chart?.render(loading)}</section></main>}`,
      );
      for (const mode of ["NodeNext", "Bundler"]) {
        await write(
          path.join(scratch, "tsconfig.public.json"),
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
            files: registryItems.map(({ name }) => `${components}/${name}.tsx`),
          }),
        );
        await run(["exec", "tsc", "--", "-p", "tsconfig.public.json"], scratch);
      }
      if (framework === "vite") {
        await write(
          path.join(scratch, "vite.config.mjs"),
          `import {defineConfig} from "vite";import tailwindcss from "@tailwindcss/vite";import {fileURLToPath} from "node:url";import {browserDirectives} from ${JSON.stringify(pathToFileURL(path.join(root, "scripts/browser-directives.mjs")).href)};const diagnostics=browserDirectives(process.cwd());export default defineConfig({plugins:[tailwindcss(),diagnostics.plugin],resolve:{alias:{"~":fileURLToPath(new URL("./src",import.meta.url))}},build:{rolldownOptions:{onwarn:diagnostics.onwarn}}});`,
        );
        await write(
          path.join(scratch, "index.html"),
          '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Registry consumer</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
        );
        await write(
          path.join(scratch, "src/main.tsx"),
          'import {createRoot} from "react-dom/client";import {RegistryHost} from "./host";import "./index.css";const root=document.getElementById("root");if(!root)throw new Error("Missing mount");createRoot(root).render(<RegistryHost/>);',
        );
        await run(["exec", "tsc", "--", "--noEmit"], scratch);
      } else {
        await write(
          path.join(scratch, "src/app/layout.tsx"),
          'import "./globals.css";export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}',
        );
        await write(
          path.join(scratch, "src/app/page.tsx"),
          'import {RegistryHost} from "../host";export default function Page(){return <RegistryHost/>}',
        );
        await write(
          path.join(scratch, "next.config.mjs"),
          'export default {output:"export",experimental:{cpus:1}};',
        );
        await write(
          path.join(scratch, "postcss.config.mjs"),
          'export default {plugins:{"@tailwindcss/postcss":{}}};',
        );
      }
      await run(["run", "build"], scratch);
      await cp(path.join(scratch, framework === "vite" ? "dist" : "out"), targetOutput, {
        recursive: true,
      });
      /** @type {Record<string,string>} */
      const resolvedVersions = {};
      for (const name of Object.keys(versions)) {
        const identity = packageIdentitySchema.parse(
          parseJson(
            await readFile(path.join(scratch, "node_modules", name, "package.json"), "utf8"),
          ),
        );
        assert.equal(
          identity.version,
          versions[name],
          `${framework}: ${name} changed unexpectedly`,
        );
        resolvedVersions[name] = identity.version;
      }
      results.push({
        framework,
        sha256: receipt.sha256,
        integrity: receipt.integrity,
        versions: resolvedVersions,
        checks: [
          "actual namespace CLI installation of all 14 items",
          "custom components aliases",
          published
            ? "official npm tarball resolution and integrity"
            : "exact candidate tarball integrity",
          "canonical composition source",
          "strict NodeNext and Bundler public types",
          "production build",
          "overwrite restores source",
          "source registration idempotence",
          "existing light/dark theme preserved",
        ],
      });
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  }
} finally {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}
if (published)
  assert.equal(artifactRequests, 0, "Public installs must not use the candidate endpoint");
else assert.ok(artifactRequests >= 2, "Both clean consumers must fetch the actual candidate");
assert.equal(
  createHash("sha256")
    .update(await readFile(path.join(root, "artifacts/package", receipt.filename)))
    .digest("hex"),
  receipt.sha256,
  "The exact candidate must remain unchanged throughout consumer validation",
);
for (const [name, originalHash] of originalHashes)
  assert.equal(
    createHash("sha256")
      .update(await readFile(path.join(output, `${name}.json`)))
      .digest("hex"),
    originalHash,
    "Production registry payload must remain unchanged",
  );
await write(
  evidencePath,
  `${JSON.stringify(
    {
      validation: published
        ? "public npm CLI/build checks using unmodified production items; namespace acceptance and deployment remain external prerequisites; rendered checks run separately"
        : "candidate-artifact CLI/build checks do not establish public npm installation or namespace acceptance; rendered checks run separately",
      method: published
        ? "test-only namespace mapping; production item payloads unmodified; npm archive independently downloaded and matched to validated candidate"
        : "test-only namespace mapping; only Core dependency substituted with checksum-verified candidate HTTP tarball",
      cli: "shadcn@4.21.4",
      mode: published ? "published" : "candidate",
      ...(publishedMetadata ? { npm: publishedMetadata } : {}),
      sha256: receipt.sha256,
      artifactRequests,
      consumers: results,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Vite and Next installed all 14 ${published ? "published" : "candidate"} registry compositions with strict types and production builds.`,
);
