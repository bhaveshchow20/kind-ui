import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { family } from "../examples/combo-catalog.mjs";
import { filesFor, promptFor } from "../lib/example-files.mjs";

const bundles = JSON.parse(readFileSync("generated/combo-examples.json", "utf8"));
test("Combo complete public sources, data alternatives and variants agree", () => {
  assert.deepEqual(
    Object.keys(bundles),
    family.examples.map((example) => example.id),
  );
  for (const bundle of Object.values(bundles)) {
    const source = readFileSync(`examples/${bundle.id}/example.tsx`, "utf8");
    assert.equal(bundle.files[`src/examples/${bundle.id}/example.tsx`], source);
    assert.match(source, /^"use client";/);
    assert.match(source, /export function \w+/);
    assert.match(source, /<Chart.ComboChart/);
    assert.match(source, /accessibilityLayer/);
    const imports = [...source.matchAll(/from "([^"]+)"/g)].map((match) => match[1]);
    assert.ok(imports.every((name) => name === "react" || name === "@kind-ui/charts"));
    assert.equal(bundle.dataAlternative.rows.length, 6);
    assert.equal(bundle.family, "combo");
    assert.ok(promptFor(bundle, {}, "https://docs.example").includes("/docs/components/combo/"));
    for (const [value, variant] of Object.entries(bundle.variants ?? {})) {
      assert.equal(
        filesFor(bundle, {}, value)[`src/examples/${bundle.id}/example.tsx`],
        variant.source,
      );
      assert.match(variant.source, new RegExp(`entrance = "${value}"`));
      assert.ok(
        promptFor(bundle, {}, "https://docs.example", value).includes(
          `/variants/${value}/example.tsx`,
        ),
      );
    }
  }
});
test("Composition keeps unit-aware native geometry and independent family entrances", () => {
  const primary = bundles.combo.files["src/examples/combo/example.tsx"];
  for (const part of ["AreaSeries", "BarSeries", "LineSeries"])
    assert.match(primary, new RegExp(`<Chart.${part}`));
  const stacked = bundles["combo-stacked"].files["src/examples/combo-stacked/example.tsx"];
  assert.equal([...stacked.matchAll(/stackId="revenue"/g)].length, 2);
  assert.equal([...stacked.matchAll(/yAxisId="revenue"/g)].length, 3);
  assert.equal([...stacked.matchAll(/yAxisId="margin"/g)].length, 2);
  assert.match(stacked, /orientation="right"/);
  assert.match(stacked, /visibleSeries={visibleSeries}/);
  assert.match(stacked, /onVisibleSeriesChange={setVisibleSeries}/);
  assert.match(stacked, /formatValue: dollars/);
  assert.match(stacked, /`\$\{value\}%`/);
  const motion = bundles["combo-motion"].files["src/examples/combo-motion/example.tsx"];
  assert.match(motion, /key={entrance}/);
  assert.match(motion, /areaReveal: false/);
  assert.match(motion, /barReveal: { revealDurationMs: 1000 }/);
  assert.match(motion, /lineReveal: { revealDurationMs: 600 }/);
  const markdown = readFileSync("public/markdown/components/combo.md", "utf8");
  assert.ok(!/<ChartExample/.test(markdown));
  assert.match(markdown, /export function ProductionComboChart/);
  assert.match(markdown, /Prop \| Type \| Default \| Description/);
});
