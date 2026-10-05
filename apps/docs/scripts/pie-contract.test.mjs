import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { filesFor, promptFor } from "../lib/example-files.mjs";

const bundles = JSON.parse(readFileSync("generated/pie-examples.json", "utf8"));
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
  assert.match(visibility, /selected.map/);
  assert.ok(!visibility.includes("LabelList"));
  assert.match(visibility, /onVisibleSeriesChange=\{setVisible\}/);
});
