import assert from "node:assert/strict";
import { test } from "node:test";
import { extractHeatmapData } from "./heatmap-source-data.mjs";

test("bounded Heatmap fixture inspection supports literals and computed coordinate grids", () => {
  const source = `const rows = ["Mon", "Tue"]; const columns = Array.from({ length: 3 }, (_, index) => \`Week \${index + 1}\`); const data = rows.flatMap((row, r) => columns.map((column, c) => ({ row, column, value: (r + c) % 2 })));`;
  assert.deepEqual(extractHeatmapData(source), {
    rows: ["Mon", "Tue"],
    columns: ["Week 1", "Week 2", "Week 3"],
    data: [
      { row: "Mon", column: "Week 1", value: 0 },
      { row: "Mon", column: "Week 2", value: 1 },
      { row: "Mon", column: "Week 3", value: 0 },
      { row: "Tue", column: "Week 1", value: 1 },
      { row: "Tue", column: "Week 2", value: 0 },
      { row: "Tue", column: "Week 3", value: 1 },
    ],
  });
  assert.deepEqual(
    extractHeatmapData(
      'const rows=["A"]; const columns=["B"]; const data=[{row:"A",column:"B",value:-2}, {row:"A",column:"B",value:null}];',
    ).data.map((item) => item.value),
    [-2, null],
  );
});
test("Heatmap fixture inspection rejects calls, statements and excessive work without executing source", () => {
  globalThis.heatmapInspectionExecuted = false;
  for (const expression of [
    "globalThis.heatmapInspectionExecuted = true",
    'Array.from({ length: 3 }, () => { globalThis.heatmapInspectionExecuted = true; return "B"; })',
    `Array.from({ length: 53 }, (_, i) => \`Week \${i + 1}\`)`,
    '["B"].constructor("globalThis.heatmapInspectionExecuted = true")()',
    'fetch("https://example.com")',
    '["B"].map(async column => column)',
    'Array.from({ length: 3 }, async () => "B")',
  ])
    assert.throws(
      () => extractHeatmapData(`const rows=["A"];const columns=${expression};const data=[];`),
      /Unsupported/,
    );
  assert.equal(globalThis.heatmapInspectionExecuted, false);
  delete globalThis.heatmapInspectionExecuted;
  assert.throws(
    () => extractHeatmapData('const rows=["A"];const columns=["B"];'),
    /Missing Heatmap fixture data/,
  );
});
