import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { filesFor, promptFor } from "../lib/example-files.mjs";

const bundles = JSON.parse(readFileSync("generated/pie-examples.json", "utf8"));
function assertCategoryDefaults(source, rows) {
  assert.match(source, /<Chart.Root config=\{config\}/);
  assert.match(source, /categoryKey="key"/);
  const parsed = ts.createSourceFile("example.tsx", source, ts.ScriptTarget.Latest, true);
  const declaration = parsed.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => [...statement.declarationList.declarations])
    .find((item) => item.name.getText(parsed) === "config");
  let initializer = declaration?.initializer;
  if (initializer && ts.isSatisfiesExpression(initializer)) initializer = initializer.expression;
  assert.ok(
    initializer && ts.isObjectLiteralExpression(initializer),
    "Explicit category config required",
  );
  const categories = new Map(
    initializer.properties.map((property) => [
      property.name?.getText(parsed).replace(/^["']|["']$/g, ""),
      property,
    ]),
  );
  for (const row of rows) {
    const category = categories.get(row.key);
    assert.ok(
      category &&
        ts.isPropertyAssignment(category) &&
        ts.isObjectLiteralExpression(category.initializer),
      `Missing category config: ${row.key}`,
    );
    for (const name of ["label", "color"]) {
      const field = category.initializer.properties.find(
        (property) => property.name?.getText(parsed) === name,
      );
      assert.ok(
        field &&
          ts.isPropertyAssignment(field) &&
          ts.isStringLiteral(field.initializer) &&
          field.initializer.text.length > 0,
        `Missing ${name} for category ${row.key}`,
      );
    }
  }
}

test("Pie consumers preserve category identity and public source parity", () => {
  assert.deepEqual(Object.keys(bundles), ["pie", "pie-visibility", "pie-materials"]);
  for (const bundle of Object.values(bundles)) {
    const source = bundle.files[`src/examples/${bundle.id}/example.tsx`];
    assert.equal(source, readFileSync(`examples/${bundle.id}/example.tsx`, "utf8"));
    assert.equal(
      source,
      readFileSync(`public/examples/${bundle.id}/src/examples/${bundle.id}/example.tsx`, "utf8"),
    );
    assert.match(source, /^"use client";/);
    if (bundle.id !== "pie-materials") assertCategoryDefaults(source, bundle.dataAlternative.rows);
    assert.match(source, /nameKey="key"/);
    assert.match(source, /itemKey=\{\(entry\) => String\(entry.payload\?\.key \?\? entry.name\)\}/);
    assert.equal(
      bundle.dataAlternative.rows.reduce((sum, row) => sum + row.hours, 0),
      1000,
    );
    assert.ok(promptFor(bundle, {}, "https://docs.example").includes("/docs/components/pie/"));
    for (const [value, variant] of Object.entries(bundle.variants ?? {})) {
      assert.equal(
        filesFor(bundle, {}, value)[`src/examples/${bundle.id}/example.tsx`],
        variant.source,
      );
      assert.match(
        variant.source,
        new RegExp(`${bundle.variantControl.toLowerCase()} = "${value}"`),
      );
      assert.equal(
        variant.source,
        readFileSync(`public/examples/${bundle.id}/variants/${value}/example.tsx`, "utf8"),
      );
    }
  }
  const visibility = bundles["pie-visibility"].files["src/examples/pie-visibility/example.tsx"];
  assert.match(visibility, /data.filter\(\(row\) => visible.includes\(row.key\)\)/);
  assert.match(visibility, /data=\{selected\}/);
  assert.match(visibility, /categoryKey="key"/);
  assert.ok(!visibility.includes("<Chart.Cell"));
  assert.ok(!visibility.includes("LabelList"));
  assert.match(visibility, /onVisibleSeriesChange=\{setVisible\}/);
});

test("Pie category-default contracts reject missing identity and category metadata", () => {
  const source = bundles.pie.files["src/examples/pie/example.tsx"];
  const rows = bundles.pie.dataAlternative.rows;
  assert.throws(() => assertCategoryDefaults(source.replace('categoryKey="key"', ""), rows));
  assert.throws(
    () => assertCategoryDefaults(source.replace("engineering: {", "unconfigured: {"), rows),
    /Missing category config: engineering/,
  );
  assert.throws(
    () => assertCategoryDefaults(source.replace('color: "#2469d4",', ""), rows),
    /Missing color for category engineering/,
  );
  assert.throws(() => assertCategoryDefaults(source.replace("config={config}", ""), rows));
});
