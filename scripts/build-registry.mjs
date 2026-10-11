import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registryItemSchema, registrySchema } from "./registry/schema.mjs";

export const repositoryRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
export const registryOutput = path.join(repositoryRoot, "artifacts/registry");
export const coreVersion = "0.4.0";
export const publishedIntegrity =
  "sha512-M7lSyoxHRi3GR2t6LvyDdCwTNYYoH/fjrRwIGjbe0xGHJn1R+Gfdm9O74lsGxT10ONsC15V+O732YfbdEMvMjQ==";
export const readRegistry = (file) => readFileSync(path.join(repositoryRoot, file), "utf8");
export const registryCatalog = () => JSON.parse(readRegistry("registry/registry.json"));

export function validateCatalog(index) {
  registrySchema.parse(index);
  const names = new Set();
  for (const item of index.items) {
    assert.match(item.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!names.has(item.name), `Duplicate registry item: ${item.name}`);
    names.add(item.name);
    for (const file of item.files) {
      const source = path.resolve(repositoryRoot, file.path);
      assert.ok(source.startsWith(`${repositoryRoot}${path.sep}`), "Source escapes repository");
      assert.ok(file.path.startsWith("registry/") || file.path === "LICENSE");
    }
  }
  // Compatibility belongs to each product; unrelated npm packages need not share a version.
  const charts = index.items.filter((item) => item.categories?.includes("charts"));
  assert.deepEqual(
    charts.map((item) => item.meta.component).sort(),
    [
      "LineChart",
      "AreaChart",
      "BarChart",
      "BoxPlotChart",
      "ComboChart",
      "HeatmapChart",
      "HistogramChart",
      "PieChart",
      "RadarChart",
      "RadialBarChart",
      "SankeyChart",
      "ScatterChart",
      "WaterfallChart",
      "ActivityRings",
    ].sort(),
    "Every public chart must have exactly one reusable item",
  );
  assert.equal(JSON.parse(readRegistry("packages/charts/package.json")).version, coreVersion);
  for (const item of charts) {
    assert.deepEqual(item.dependencies, [
      `@kind-ui/charts@${coreVersion}`,
      "react@^19.3.0",
      "react-dom@^19.3.0",
      "recharts@^3.10.1",
      "motion@^13.4.6",
    ]);
    assert.equal(item.meta.coreVersion, coreVersion);
    assert.equal(
      item.registryDependencies?.length ?? 0,
      0,
      "A family cannot pull other charts into the consumer",
    );
    assert.ok(item.files.some((file) => file.path === `registry/charts/${item.name}.tsx`));
  }
}

export function buildRegistry(output = registryOutput) {
  const index = registryCatalog();
  validateCatalog(index);
  const legacy = JSON.parse(readRegistry("registry/charts/legacy.json"));
  registrySchema.parse(legacy);
  const staged = structuredClone({ ...index, items: [...index.items, ...legacy.items] });
  assert.equal(new Set(staged.items.map((item) => item.name)).size, staged.items.length);
  // This directory contains only generated registry output, never the docs app or npm packages.
  rmSync(output, { recursive: true, force: true });
  const write = (file, body) => {
    const target = path.join(output, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, body);
  };
  for (const item of staged.items) {
    for (const file of item.files) {
      const content = readRegistry(file.path);
      file.path = `generated/registry/${item.name}/${path.basename(file.path)}`;
      write(file.path, content);
    }
  }
  write("generated/registry.json", `${JSON.stringify(staged, null, 2)}\n`);
  execFileSync(
    "npm",
    [
      "exec",
      "--yes",
      "--package=shadcn@4.21.4",
      "--",
      "shadcn",
      "build",
      "generated/registry.json",
      "--output",
      "public/r",
    ],
    { cwd: output, stdio: "inherit" },
  );
  write("public/r/registry.json", `${JSON.stringify(index, null, 2)}\n`);
  const installations = {};
  for (const item of staged.items) {
    const built = JSON.parse(readFileSync(path.join(output, `public/r/${item.name}.json`)));
    registryItemSchema.parse(built);
    assert.ok(built.files.every((file) => typeof file.content === "string"));
    if (index.items.some((entry) => entry.name === item.name)) installations[item.name] = built;
  }
  write("installations.json", `${JSON.stringify(installations, null, 2)}\n`);
  console.log(
    `Built ${index.items.length} reusable items and ${legacy.items.length} compatibility items at ${output}/public/r.`,
  );
  return output;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))
  buildRegistry();
