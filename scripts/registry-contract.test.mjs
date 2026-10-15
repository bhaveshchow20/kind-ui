import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  coreVersion,
  itemNameFor,
  registryCss,
  registryEndpoint,
  registryHomepage,
  registryItems,
  sourcePaths,
} from "../registry/catalog.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "artifacts/registry/r");
const fileSchema = z.object({
  path: z.string(),
  type: z.literal("registry:component"),
  target: z.string(),
  content: z.string().optional(),
});
const itemSchema = z.object({
  name: z.string().regex(/^[a-z][a-z-]+$/),
  type: z.literal("registry:component"),
  title: z.string().min(1),
  description: z.string().min(1),
  dependencies: z.array(z.string()),
  devDependencies: z.array(z.string()),
  files: z.array(fileSchema).length(1),
  css: z.record(z.string(), z.record(z.string(), z.never())),
});
const catalogSchema = z.object({
  $schema: z.literal("https://ui.shadcn.com/schema/registry.json"),
  name: z.literal("kind-ui"),
  homepage: z.literal("https://kindui.dev/charts/"),
  items: z.array(itemSchema),
});
const readJson = (file) => /** @type {unknown} */ (JSON.parse(readFileSync(file, "utf8")));
const catalog = catalogSchema.parse(readJson(path.join(output, "registry.json")));

test("official CLI output has a flat complete catalog and content-free discovery payload", () => {
  assert.equal(catalog.homepage, registryHomepage);
  assert.equal(registryEndpoint, "https://kindui.dev/r/");
  assert.equal(catalog.items.length, 15);
  assert.deepEqual(
    catalog.items.map(({ name }) => name),
    registryItems.map(({ name }) => name),
  );
  assert.deepEqual(
    readdirSync(output).sort(),
    ["registry.json", ...registryItems.map(({ name }) => `${name}.json`)].sort(),
  );
  for (const item of catalog.items) {
    const definition = registryItems.find(({ name }) => name === item.name);
    assert.ok(definition);
    assert.ok(item.files.every((file) => !Object.hasOwn(file, "content")));
    assert.deepEqual(item.dependencies, [
      `@kind-ui/charts@${definition.minimumCoreVersion ? `^${definition.minimumCoreVersion}` : coreVersion}`,
      "react@^19.3.0",
      "react-dom@^19.3.0",
      "recharts@^3.10.1",
      "motion@^13.4.6",
    ]);
    assert.deepEqual(item.devDependencies, ["tailwindcss@^4.0.0"]);
    assert.deepEqual(item.css, registryCss);
  }
});

test("installed compositions equal canonical preview and copied source bytes", () => {
  for (const definition of registryItems) {
    const item = itemSchema.parse(readJson(path.join(output, `${definition.name}.json`)));
    assert.equal(item.name, definition.name);
    assert.equal(item.title, definition.title);
    assert.equal(item.description, definition.description);
    const file = item.files[0];
    assert.ok(file);
    assert.equal(file.path, `components/${definition.name}.tsx`);
    assert.equal(file.target, `@components/${definition.name}.tsx`);
    const canonical = readFileSync(
      path.join(root, `apps/docs/examples/${definition.exampleId}/example.tsx`),
      "utf8",
    );
    assert.equal(file.content, canonical);
    assert.match(canonical, /["']use client["'];/);
    assert.match(canonical, /from ["']@kind-ui\/charts["']/);
    assert.doesNotMatch(canonical, /from ["'](?:\.\.?\/|@\/)/);
  }
});

test("Tailwind source registration covers standard Vite and Next stylesheet depths", () => {
  for (const stylesheet of ["src/index.css", "app/globals.css", "src/app/globals.css"]) {
    const matches = sourcePaths.filter(
      (source) =>
        path.posix.normalize(path.posix.join(path.posix.dirname(stylesheet), source)) ===
        "node_modules/@kind-ui/charts/dist",
    );
    assert.equal(matches.length, 1, stylesheet);
  }
  assert.equal(Object.keys(registryCss).length, sourcePaths.length);
});

test("directory submission entry has the production namespace, endpoint and review fields", () => {
  const entry = z
    .object({
      name: z.literal("@kind-ui"),
      homepage: z.literal("https://kindui.dev/charts/"),
      url: z.literal("https://kindui.dev/r/{name}.json"),
      description: z.string().min(1),
      logo: z.string().startsWith("<svg"),
    })
    .strict()
    .parse(readJson(path.join(root, "registry/directory-entry.json")));
  for (const item of registryItems) {
    const resolved = new URL(entry.url.replace("{name}", item.name));
    assert.equal(resolved.pathname, `/r/${item.name}.json`);
  }
});

test("lookup and policy reject missing examples, nested names and absent dependencies", () => {
  assert.equal(itemNameFor("line"), "line-chart");
  assert.equal(itemNameFor("radial-activity"), "activity-rings");
  assert.throws(() => itemNameFor("line-smooth"), /No registry installation/);
  const first = catalog.items[0];
  assert.ok(first);
  assert.equal(itemSchema.safeParse({ ...first, name: "charts/line-chart" }).success, false);
  assert.equal(itemSchema.safeParse({ ...first, dependencies: undefined }).success, false);
  assert.equal(itemSchema.safeParse({ ...first, files: [] }).success, false);
});

test("Candlestick has a canonical flat registry address and exact editable source", () => {
  assert.equal(itemNameFor("candlestick"), "candlestick-chart");
  const definition = registryItems.find((item) => item.exampleId === "candlestick");
  assert.ok(definition);
  assert.equal(definition.name, "candlestick-chart");
  const item = itemSchema.parse(readJson(path.join(output, "candlestick-chart.json")));
  const file = item.files[0];
  assert.ok(file);
  assert.equal(file.path, "components/candlestick-chart.tsx");
  assert.equal(file.target, "@components/candlestick-chart.tsx");
  assert.equal(
    file.content,
    readFileSync(path.join(root, "apps/docs/examples/candlestick/example.tsx"), "utf8"),
  );
  assert.equal(
    new URL(`${definition.name}.json`, registryEndpoint).pathname,
    "/r/candlestick-chart.json",
  );
});
