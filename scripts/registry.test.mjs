import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { catalog, githubRepository, httpBase } from "../registry/catalog.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
test("catalog has complete unique items and safe source/target paths", async () => {
  const names = catalog.items.map((item) => item.name);
  assert.deepEqual(names, ["kind-chart-styles", "line-chart", "area-chart", "bar-chart"]);
  assert.ok(catalog.items.every((item) => item.type !== "registry:block"));
  assert.equal(new Set(names).size, names.length);
  for (const item of catalog.items) {
    assert.ok(item.description.length > 40);
    for (const file of item.files) {
      assert.match(file.path, /^registry\/charts\/[a-z-]+\.(tsx|css)$/);
      assert.match(file.target, /^@components\/charts\/[a-z-]+\.(tsx|css)$/);
      assert.ok(await read(file.path));
    }
    for (const dep of item.registryDependencies ?? []) {
      assert.ok(dep === "card" || names.includes(dep.replace(`${githubRepository}/`, "")), dep);
    }
  }
});
test("HTTP output embeds exact source and rewrites only same-repository dependencies", async () => {
  assert.deepEqual(JSON.parse(await read("registry.json")), catalog);
  for (const item of catalog.items) {
    const built = JSON.parse(await read(`apps/docs/public/r/${item.name}.json`));
    assert.equal(built.name, item.name);
    assert.equal(built.files.length, item.files.length);
    for (const file of built.files) assert.equal(file.content, await read(file.path));
    assert.deepEqual(
      built.registryDependencies ?? [],
      (item.registryDependencies ?? []).map((dep) =>
        dep.startsWith(`${githubRepository}/`) ? `${httpBase}/${dep.split("/").at(-1)}.json` : dep,
      ),
    );
  }
});
test("recipes use real public chart exports, required peers and accessible data alternatives", async () => {
  const exports = await read("packages/charts/src/index.ts");
  for (const item of catalog.items.filter((item) => item.type === "registry:component")) {
    assert.deepEqual(item.dependencies, [
      "@kind-ui/charts@^0.1.0",
      "react@^19.3.0",
      "react-dom@^19.3.0",
      "recharts@^3.10.1",
      "motion@^13.4.6",
    ]);
    const source = await read(item.files[0].path);
    for (const match of source.matchAll(/Chart\.([A-Za-z]+)/g))
      assert.match(exports, new RegExp(`\\b${match[1]}\\b`));
    assert.match(source, /@kind-ui\/charts\/styles.css/);
    assert.match(source, /accessibilityLayer\s+aria-label=/);
    assert.match(source, /<caption>/);
    assert.match(source, /scope="row"/);
    assert.doesNotMatch(source, /onKeyDown|matchMedia|requestAnimationFrame/);
  }
});
