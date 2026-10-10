import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { allExamples, families } from "../examples/catalog.mjs";
import { recipeSource, validateCatalog } from "./registry.mjs";
import { registryItemSchema } from "./registry-schema.mjs";

const read = (file) => readFileSync(file, "utf8");
const index = JSON.parse(read("registry.json"));
const bundles = JSON.parse(read("generated/all-examples.json"));
test("registry covers all families, recipes and chart-like public exports", () => {
  validateCatalog(index);
  assert.equal(families.length, 13);
  assert.ok(index.items.some((item) => item.name === "kind-radial-activity"));
  const source = ts.createSourceFile(
    "index.ts",
    read("../../packages/charts/src/index.ts"),
    ts.ScriptTarget.Latest,
    true,
  );
  const chartExports = source.statements
    .filter(ts.isExportDeclaration)
    .flatMap((node) =>
      node.exportClause && ts.isNamedExports(node.exportClause)
        ? node.exportClause.elements
            .filter((part) => !node.isTypeOnly && !part.isTypeOnly)
            .map((part) => part.name.text)
        : [],
    )
    .filter((name) => /Chart$/.test(name) || name === "ActivityRings");
  const recipes = allExamples.map(({ id }) => read(`examples/${id}/example.tsx`)).join("\n");
  assert.equal(chartExports.length, 14);
  for (const name of chartExports) assert.ok(recipes.includes(`Chart.${name}`), `${name} omitted`);
});
test("missing, duplicate and incompatible items fail the catalog gate", () => {
  const missing = structuredClone(index);
  missing.items.pop();
  assert.throws(() => validateCatalog(missing));
  const duplicate = structuredClone(index);
  duplicate.items.push(duplicate.items[0]);
  assert.throws(() => validateCatalog(duplicate));
  const drift = structuredClone(index);
  drift.items[0].dependencies[0] = "@kind-ui/charts@latest";
  assert.throws(() => validateCatalog(drift));
});
test("every public JSON item contains only its recipe and required support files", () => {
  for (const item of index.items) {
    const built = JSON.parse(read(`public/r/${item.name}.json`));
    registryItemSchema.parse(built);
    assert.equal(built.files.length, item.files.length);
    assert.deepEqual(built.dependencies, item.dependencies);
    for (const file of built.files)
      assert.ok(file.content.length && file.target.startsWith("components/charts/"));
    const component = built.files.find((file) =>
      file.target.endsWith(`${item.meta.example}/example.tsx`),
    );
    assert.equal(component.content, recipeSource(bundles[item.meta.example]));
    assert.ok(component.content.includes('import * as Chart from "@kind-ui/charts"'));
    assert.ok(component.content.includes('import "../styles.css"'));
    assert.ok(component.content.includes("data-chart-alternative"));
    assert.doesNotMatch(component.content, /packages\/charts|\.\/dist\//);
  }
});
