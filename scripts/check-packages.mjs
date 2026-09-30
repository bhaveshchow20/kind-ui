import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifacts = join(root, "artifacts");
await mkdir(artifacts, { recursive: true });
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
function run(command, args, cwd = root) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}
const tarballs = [];
for (const directory of ["charts-core", "charts", "cli"]) {
  const manifest = JSON.parse(
    await readFile(join(root, "packages", directory, "package.json"), "utf8"),
  );
  assert.equal(manifest.private, true, "Publishing stays disabled until explicitly approved");
  const [packed] = JSON.parse(
    run(npm, [
      "pack",
      "--workspace",
      manifest.name,
      "--json",
      "--pack-destination",
      artifacts,
      "--ignore-scripts",
    ]),
  );
  const files = packed.files.map((file) => file.path);
  for (const file of ["dist/index.js", "dist/index.d.ts", "LICENSE", "README.md", "package.json"]) {
    assert.ok(files.includes(file), `${manifest.name} is missing ${file}`);
  }
  const allowlist =
    directory === "cli"
      ? /^(dist\/.*\.(js|d\.ts)|recipes\/(manifest\.json|line-chart-demo\.tsx)|LICENSE|README\.md|package\.json)$/
      : /^(dist\/.*\.(js|d\.ts)|LICENSE|README\.md|package\.json)$/;
  assert.ok(
    files.every((file) => allowlist.test(file)),
    "Unexpected package content",
  );
  if (directory === "cli") {
    for (const file of ["dist/bin.js", "recipes/manifest.json", "recipes/line-chart-demo.tsx"]) {
      assert.ok(files.includes(file), `CLI is missing ${file}`);
    }
    assert.equal(manifest.bin["kind-ui"], "./dist/bin.js");
  }
  assert.ok(packed.size < 40_000, "Scaffold package unexpectedly exceeds 40 kB packed");
  tarballs.push(join(artifacts, packed.filename));
  console.log(`${manifest.name}: ${files.length} packed files, ${packed.size} bytes`);
}
const consumer = await mkdtemp(join(tmpdir(), "chart-consumer-"));
try {
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  run(
    npm,
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      ...tarballs,
      "react@19.3.0",
      "react-dom@19.3.0",
      "@types/react@19.3.0",
      "@types/react-dom@19.3.0",
    ],
    consumer,
  );
  const cli = join(
    consumer,
    "node_modules/.bin",
    process.platform === "win32" ? "kind-ui.cmd" : "kind-ui",
  );
  assert.match(run(cli, ["--help"], consumer), /Usage:/);
  assert.match(run(cli, ["init", "--dry-run"], consumer), /Dry run/);
  await assert.rejects(readFile(join(consumer, "kind-ui.json")), { code: "ENOENT" });
  run(cli, ["init"], consumer);
  const generated = "src/components/ui/charts/line-chart-demo.tsx";
  assert.match(run(cli, ["add", "charts/line", "--dry-run"], consumer), /create:/);
  await assert.rejects(readFile(join(consumer, generated)), { code: "ENOENT" });
  run(cli, ["add", "charts/line"], consumer);
  assert.match(run(cli, ["add", "charts/line"], consumer), /unchanged:/);
  console.log("Packed executable: help, init, add, dry-run, and idempotency passed");
  await writeFile(
    join(consumer, "index.tsx"),
    `
import { normalizeSeries, createLineGeometry } from "@kind-ui/charts-core";
import { LineChart, DataTable } from "@kind-ui/charts";
import { renderToStaticMarkup } from "react-dom/server";
import { LineChartDemo } from "./src/components/ui/charts/line-chart-demo.js";
const model = normalizeSeries([{ id: "first", x: 1, y: 8 }, { id: "missing", x: 2, y: null }, { id: "last", x: 3, y: 12 }], { missing: "zero", x: { kind: "number", unit: null }, y: { unit: "USD" } });
if (model.yDomain[0] !== 0) throw new Error("Packed normalizer lost imputed zero");
if (!createLineGeometry(model, { width: 640, height: 320 }).path) throw new Error("Packed geometry failed");
const html = renderToStaticMarkup(<><LineChart model={model} title="Packed consumer" /><DataTable model={model} caption="Exact values" /></>);
if (!html.includes("<svg") || !html.includes("<table") || !html.includes("Missing (shown as 0)")) throw new Error("Packed SSR failed");
const recipeHtml = renderToStaticMarkup(<LineChartDemo />);
if (!recipeHtml.includes("<svg") || !recipeHtml.includes("<table") || !recipeHtml.includes("Monthly energy")) throw new Error("Generated recipe SSR failed");
console.log("Packed ESM import, declarations, React JSX, generated recipe, and SSR passed");
`,
  );
  await writeFile(
    join(consumer, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        jsx: "react-jsx",
        skipLibCheck: false,
        outDir: "out",
      },
      include: ["index.tsx", "src/**/*.tsx"],
    }),
  );
  run(
    process.execPath,
    [join(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
    consumer,
  );
  console.log(run(process.execPath, ["out/index.js"], consumer).trim());
} finally {
  await rm(consumer, { recursive: true, force: true });
}
