import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { referenceRows } from "../lib/api-reference.mjs";

const source = (id) =>
  readFileSync(new URL(`../examples/${id}/example.tsx`, import.meta.url), "utf8");

test("series focus examples preserve source data and bind stable eligible identities", () => {
  for (const id of [
    "area-stacked",
    "bar-comparison",
    "combo-stacked",
    "scatter",
    "radial-stacked",
  ]) {
    const code = source(id);
    assert.match(code, /mode: "focus"/, id);
    assert.match(code, /eligibleKeys: Object.keys\(config\)/, id);
    assert.doesNotMatch(code, /visibleSeries=|onVisibleSeriesChange=/, id);
  }
});

test("controlled pie visibility retains full source rows and binds categories to the chart", () => {
  const code = source("pie-visibility");
  assert.match(code, /mode: "visibility"/);
  assert.match(code, /<PieChart\b[\s\S]*?config=\{config\}/);
  assert.match(code, /categoryKey="key"/);
  assert.match(code, /data=\{data\}/);
  assert.doesNotMatch(code, /data\.filter\(/);
});

test("chart-frame API table describes focus and supported mark activation defaults", () => {
  const [row] = referenceRows("ChartFrame", [
    { name: "interaction", type: "ChartInteractionConfig", description: "", required: false },
  ]);
  assert.match(row.default, /focus/);
  assert.match(row.default, /matching-legend/);
  assert.match(row.description, /preserved full-data layout/);
});
