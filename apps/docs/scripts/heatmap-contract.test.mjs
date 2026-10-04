import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createHeatmapModel, createHeatmapScale } from "@kind-ui/charts";
import ts from "typescript";
import { family } from "../examples/heatmap-catalog.mjs";
import { filesFor } from "../lib/example-files.mjs";

const bundles = JSON.parse(readFileSync("generated/heatmap-examples.json", "utf8"));
function literal(node) {
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map((property) => [property.name.text, literal(property.initializer)]),
    );
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node)) return -literal(node.operand);
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  throw new Error(`Unsupported literal ${node.getText()}`);
}
for (const example of family.examples) {
  test(`${example.id}: accessible data covers every normalized source coordinate`, () => {
    const source = readFileSync(`examples/${example.id}/example.tsx`, "utf8");
    const parsed = ts.createSourceFile("example.tsx", source, ts.ScriptTarget.Latest, true);
    const variables = parsed.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => [...statement.declarationList.declarations]);
    const values = Object.fromEntries(
      variables
        .filter((declaration) =>
          ["rows", "columns", "data"].includes(declaration.name.getText(parsed)),
        )
        .map((declaration) => [declaration.name.getText(parsed), literal(declaration.initializer)]),
    );
    const model = createHeatmapModel(values);
    assert.deepEqual(
      family.dataLabels[example.id].rows,
      model.cells
        .flat()
        .map((cell) => ({ row: cell.row, column: cell.column, value: cell.value ?? "No report" })),
    );
    assert.equal(bundles[example.id].files[`src/examples/${example.id}/example.tsx`], source);
    assert.match(source, /<Chart.HeatmapDataTable/);
    assert.match(source, /<Chart.HeatmapTooltip valueAnimation="shuffle"/);
    assert.ok(!/from ["']\.\.?\//.test(source));
    for (const [variant, selection] of Object.entries(bundles[example.id].variants ?? {})) {
      assert.equal(
        filesFor(bundles[example.id], {}, variant)[`src/examples/${example.id}/example.tsx`],
        selection.source,
      );
      assert.ok(selection.source.includes(`material = "${variant}"`));
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
