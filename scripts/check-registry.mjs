import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { catalog, httpBase } from "../registry/catalog.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(
  process.env.REGISTRY_TOOL_ROOT
    ? resolve(process.env.REGISTRY_TOOL_ROOT, "package.json")
    : new URL("../package.json", import.meta.url),
);
const { registrySchema, registryItemSchema } = await import(require.resolve("shadcn/schema"));
const cliPackage = JSON.parse(
  await readFile(resolve(dirname(require.resolve("shadcn")), "../package.json"), "utf8"),
);
assert.equal(cliPackage.version, "4.21.2", "Registry tooling must use the tested shadcn version");
const cli = require.resolve("shadcn");
registrySchema.parse(catalog);
for (const item of catalog.items)
  registryItemSchema.parse(
    JSON.parse(await readFile(resolve(root, `apps/docs/public/r/${item.name}.json`), "utf8")),
  );
const output = resolve(root, "artifacts/registry");
await mkdir(output, { recursive: true });
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env: process.env });
  if (result.status !== 0)
    throw new Error(`${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`);
  console.log(result.stdout.trim());
  return result;
}
run(process.execPath, [cli, "build", "registry.json", "--output", resolve(output, "official")]);
for (const item of catalog.items) {
  const official = JSON.parse(
    await readFile(resolve(output, `official/${item.name}.json`), "utf8"),
  );
  registryItemSchema.parse(official);
  for (const file of official.files)
    assert.equal(file.content, await readFile(resolve(root, file.path), "utf8"));
}
console.log("Official schema and CLI build passed.");
if (!process.argv.includes("--consumer")) process.exit(0);
const archive =
  process.env.KIND_CHARTS_ARCHIVE || resolve(root, "artifacts/package/kind-ui-charts-0.1.0.tgz");
const receipt = JSON.parse(
  await readFile(resolve(dirname(archive), "validated-artifact.json"), "utf8"),
);
const archiveBytes = await readFile(archive);
assert.equal(
  createHash("sha256").update(archiveBytes).digest("hex"),
  receipt.sha256,
  "Archive checksum differs from validation receipt",
);
assert.equal(
  `sha512-${createHash("sha512").update(archiveBytes).digest("base64")}`,
  receipt.integrity,
  "Archive integrity differs from validation receipt",
);
assert.equal(receipt.package.name, "@kind-ui/charts");
assert.equal(receipt.package.version, "0.1.0");
const npmVersion = run("npm", ["--version"]).stdout.trim();
assert.equal(npmVersion, "11.9.0", "Use the repository's pinned npm for consumer installs");
const consumer = await mkdtemp(resolve(tmpdir(), "kind-registry-consumer-"));
const fixtureBase = "http://127.0.0.1:7373/r";
const server = createServer(async (req, res) => {
  try {
    const name = new URL(req.url, fixtureBase).pathname.split("/").at(-1);
    assert.ok(catalog.items.some((item) => `${item.name}.json` === name));
    const item = JSON.parse(await readFile(resolve(root, `apps/docs/public/r/${name}`), "utf8"));
    item.dependencies = item.dependencies?.map((dep) =>
      dep === "@kind-ui/charts@^0.1.0" ? archive : dep,
    );
    item.registryDependencies = item.registryDependencies?.map((dep) =>
      dep.replace(httpBase, fixtureBase),
    );
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(item));
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((done) => server.listen(7373, "127.0.0.1", done));
// The async CLI child permits the in-process HTTP fixture to answer requests.
async function child(command, args, cwd) {
  const { spawn } = await import("node:child_process");
  await new Promise((done, reject) => {
    const process = spawn(command, args, { cwd, stdio: "inherit", env: globalThis.process.env });
    process.on("error", reject);
    process.on("exit", (code) => (code === 0 ? done() : reject(new Error(`Child exited ${code}`))));
  });
}
try {
  await writeFile(
    resolve(consumer, "package.json"),
    JSON.stringify({
      name: "kind-registry-consumer",
      private: true,
      type: "module",
      dependencies: {
        clsx: "2.1.1",
        "tailwind-merge": "3.6.0",
        react: "19.3.0",
        "react-dom": "19.3.0",
        "@kind-ui/charts": `file:${archive}`,
        recharts: "3.10.1",
        motion: "13.4.6",
        tailwindcss: "4.3.3",
        "@tailwindcss/vite": "4.3.3",
        vite: "8.3.1",
        typescript: "5.9.3",
        "@types/react": "19.3.0",
        "@types/react-dom": "19.3.0",
      },
    }),
  );
  await writeFile(
    resolve(consumer, "components.json"),
    JSON.stringify({
      $schema: "https://ui.shadcn.com/schema.json",
      style: "new-york",
      rsc: false,
      tsx: true,
      tailwind: { css: "src/index.css", baseColor: "neutral", cssVariables: true },
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
        lib: "@/lib",
        hooks: "@/hooks",
      },
      registries: { "@kindui": `${fixtureBase}/{name}.json` },
    }),
  );
  await mkdir(resolve(consumer, "src/lib"), { recursive: true });
  await writeFile(
    resolve(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        baseUrl: ".",
        paths: { "@/*": ["src/*"] },
        lib: ["ES2022", "DOM"],
      },
      include: ["src"],
    }),
  );
  await writeFile(resolve(consumer, "src/index.css"), '@import "tailwindcss";\n');
  await writeFile(
    resolve(consumer, "src/lib/utils.ts"),
    'import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\nexport function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }\n',
  );
  await child("npm", ["install", "--no-audit", "--no-fund"], consumer);
  await child(
    process.execPath,
    [cli, "add", "@kindui/charts-dashboard", "--yes", "--cwd", consumer],
    consumer,
  );
  const editedFile = resolve(consumer, "src/components/charts/line-chart.tsx");
  const editedContent = `${await readFile(editedFile, "utf8")}\n// Consumer-owned customization.\n`;
  await writeFile(editedFile, editedContent);
  const lockBeforeDiff = await readFile(resolve(consumer, "package-lock.json"), "utf8");
  await child(
    process.execPath,
    [cli, "add", "@kindui/charts-dashboard", "--diff", "--cwd", consumer],
    consumer,
  );
  assert.equal(
    await readFile(editedFile, "utf8"),
    editedContent,
    "--diff must preserve consumer edits",
  );
  assert.equal(
    await readFile(resolve(consumer, "package-lock.json"), "utf8"),
    lockBeforeDiff,
    "--diff must not mutate the lockfile",
  );
  await writeFile(
    resolve(consumer, "index.html"),
    '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Kind chart registry consumer</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
  );
  await writeFile(
    resolve(consumer, "src/main.tsx"),
    'import { createRoot } from "react-dom/client";\nimport { ChartsDashboard } from "@/components/charts/charts-dashboard";\nimport "./index.css";\ncreateRoot(document.getElementById("root")!).render(<ChartsDashboard />);\n',
  );
  await writeFile(
    resolve(consumer, "vite.config.mjs"),
    'import { defineConfig } from "vite";\nimport tailwindcss from "@tailwindcss/vite";\nimport { fileURLToPath } from "node:url";\nexport default defineConfig({ plugins: [tailwindcss()], resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } } });\n',
  );
  run(
    process.execPath,
    [resolve(consumer, "node_modules/typescript/bin/tsc"), "-p", consumer],
    consumer,
  );
  run(process.execPath, [resolve(consumer, "node_modules/vite/bin/vite.js"), "build"], consumer);
  await writeFile(
    resolve(output, "consumer.json"),
    `${JSON.stringify({ consumer, tooling: { shadcn: cliPackage.version, node: process.version, npm: npmVersion }, dependencyProof: "local validated archive; public npm and remote GitHub routing require separate live verification", archive, sha256: receipt.sha256 }, null, 2)}\n`,
  );
  console.log(`Clean CLI consumer types/build passed: ${consumer}`);
} finally {
  server.close();
}
