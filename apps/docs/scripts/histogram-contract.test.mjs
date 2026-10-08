import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { binHistogram } from "@kind-ui/charts";
import { family } from "../examples/histogram-catalog.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";

const bundles = JSON.parse(readFileSync("generated/histogram-examples.json", "utf8"));
test("histogram copies retain native quantitative composition and matching variants", () => {
  assert.deepEqual(Object.keys(bundles), ["histogram", "histogram-density", "histogram-materials"]);
  for (const bundle of Object.values(bundles)) {
    const source = readFileSync(`examples/${bundle.id}/example.tsx`, "utf8");
    assert.equal(source, bundle.files[`src/examples/${bundle.id}/example.tsx`]);
    assert.match(source, /^"use client"/);
    assert.match(source, /Chart.binHistogram/);
    assert.match(source, /<Chart.HistogramChart/);
    assert.match(source, /<Chart.HistogramSeries/);
    assert.ok(!/<Chart.(BarSeries|XAxis|YAxis)\b/.test(source));
    assert.match(source, /animate\s+accessibilityLayer/);
    assert.equal(bundle.dataAlternative.rows.length, bundle.id === "histogram" ? 5 : 4);
    assert.ok(
      promptFor(bundle, {}, "https://docs.example").includes("/docs/components/histogram/"),
    );
    for (const [value, variant] of Object.entries(bundle.variants ?? {})) {
      assert.equal(
        filesFor(bundle, {}, value)[`src/examples/${bundle.id}/example.tsx`],
        variant.source,
      );
      assert.match(variant.source, new RegExp(`${family.variants[bundle.id].prop} = "${value}"`));
    }
  }
});
test("published binning preserves interior and final boundaries and discard accounting", () => {
  const result = binHistogram(
    [0, 25, 50, 100, 200, null, undefined, NaN, Infinity, -1, 201],
    [0, 25, 50, 100, 200],
  );
  assert.deepEqual(
    result.bins.map((bin) => bin.count),
    [1, 1, 1, 2],
  );
  assert.deepEqual(
    [result.accepted, result.missing, result.nonfinite, result.outOfRange],
    [5, 2, 2, 2],
  );
});
test("complete dataset has 36 accepted samples and unit density area", () => {
  const source = bundles["histogram-density"].files["src/examples/histogram-density/example.tsx"];
  const samples = [...source.matchAll(/milliseconds: (null|\d+)/g)].map((match) =>
    match[1] === "null" ? null : Number(match[1]),
  );
  const result = binHistogram(samples, [0, 25, 50, 100, 200]);
  assert.deepEqual(
    result.bins.map((bin) => bin.count),
    [3, 15, 12, 6],
  );
  assert.deepEqual(
    [result.accepted, result.missing, result.nonfinite, result.outOfRange],
    [36, 1, 0, 1],
  );
  const area = result.bins.reduce(
    (sum, bin) =>
      sum + (bin.count / result.accepted / (bin.upper - bin.lower)) * (bin.upper - bin.lower),
    0,
  );
  assert.ok(Math.abs(area - 1) < 1e-12);
});
