import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createHeatmapModel, createHeatmapScale } from "@kind-ui/charts";
import { family } from "../examples/heatmap-catalog.mjs";
import { filesFor } from "../lib/example-files.mjs";
import { extractHeatmapData } from "./heatmap-source-data.mjs";
import "./heatmap-source-data.test.mjs";

const bundles = JSON.parse(readFileSync("generated/heatmap-examples.json", "utf8"));
for (const example of family.examples) {
  test(`${example.id}: accessible data covers every normalized source coordinate`, () => {
    const source = readFileSync(`examples/${example.id}/example.tsx`, "utf8");
    const values = extractHeatmapData(source);
    const model = createHeatmapModel(values);
    assert.deepEqual(
      family.dataLabels[example.id].rows,
      model.cells
        .flat()
        .map((cell) => ({ row: cell.row, column: cell.column, value: cell.value ?? "No report" })),
    );
    assert.equal(bundles[example.id].files[`src/examples/${example.id}/example.tsx`], source);
    if (example.id === "heatmap-compact") {
      assert.match(source, /cellSize: "clamp\(6px, calc\(\(100cqw - 84px\) \/ 26\), 28px\)"/);
      assert.match(source, /containerType: "inline-size"/);
      assert.match(source, /rowLabels: "hidden"/);
      assert.match(source, /columnLabels: "hidden"/);
      assert.match(source, /<Chart.HeatmapTooltip/);
    } else {
      assert.match(source, /<Chart.HeatmapDataTable/);
      assert.match(source, /<Chart.HeatmapTooltip valueAnimation="shuffle"/);
    }
    assert.ok(!/from ["']\.\.?\//.test(source));
    for (const [variant, selection] of Object.entries(bundles[example.id].variants ?? {})) {
      assert.equal(
        filesFor(bundles[example.id], {}, variant)[`src/examples/${example.id}/example.tsx`],
        selection.source,
      );
      assert.ok(selection.source.includes(`${family.variants[example.id].prop} = "${variant}"`));
    }
  });
}
test("Signed scale maps zero to the neutral midpoint and bounds all observations", () => {
  const source = readFileSync("examples/heatmap-diverging/example.tsx", "utf8");
  assert.match(source, /domain: \[-20, 20\]/);
  const scale = createHeatmapScale({
    domain: [-20, 20],
    colors: ["#9a3412", "#fff7ed", "#1e40af"],
  });
  assert.equal(scale.color(0), "#fff7ed");
});
