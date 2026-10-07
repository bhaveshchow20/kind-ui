import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { prepareSankeyData } from "@kind-ui/charts";
import ts from "typescript";
import { family } from "../examples/sankey-catalog.mjs";

function literal(node) {
  if (ts.isSatisfiesExpression(node)) return literal(node.expression);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map((property) => [property.name.text, literal(property.initializer)]),
    );
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  throw new Error("Expected literal Sankey input");
}
for (const example of family.examples) {
  test(`${example.id}: standalone source, data alternative and generated variants agree`, () => {
    const source = readFileSync(
      new URL(`../examples/${example.id}/example.tsx`, import.meta.url),
      "utf8",
    );
    const ast = ts.createSourceFile("example.tsx", source, ts.ScriptTarget.Latest, true);
    const variable = ast.statements
      .flatMap((statement) =>
        ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : [],
      )
      .find((declaration) => declaration.name.getText(ast) === "data");
    const data = literal(variable.initializer);
    assert.deepEqual(family.dataLabels[example.id].rows, data.links);
    if (example.id === "sankey-config") {
      assert.deepEqual(
        data.nodes.map((node) => node.id),
        ["solar", "wind", "homes", "industry"],
      );
      assert.equal(data.links.length, 4);
      assert.equal(prepareSankeyData(data).links.length, 4);
      assert.equal(
        data.links.reduce((sum, link) => sum + link.value, 0),
        100,
      );
      assert.match(source, /nodeConfig=\{nodeConfig\}/);
      assert.match(source, /<Chart\.SankeyLegend config=\{nodeConfig\}/);
      assert.doesNotMatch(source, /<Chart\.SankeyLink|animate=/);
    } else {
      assert.equal(data.nodes.length, 9);
      assert.equal(data.links.length, 18);
      assert.equal(prepareSankeyData(data).links.length, 18);
      assert.equal(
        data.links
          .filter((link) => ["solar", "wind", "hydro"].includes(link.source))
          .reduce((sum, link) => sum + link.value, 0),
        180,
      );
      assert.match(source, /<Chart\.SankeyLink/);
      assert.match(source, /animate=\{\{ revealDurationMs: 900 \}\}/);
    }
    assert.match(source, /^"use client";/);
    assert.doesNotMatch(source, /from ["'](?:@\/|\.\.\/)/);
    const bundle = JSON.parse(
      readFileSync(new URL("../generated/all-examples.json", import.meta.url), "utf8"),
    )[example.id];
    assert.equal(bundle.files[`src/examples/${example.id}/example.tsx`], source);
    for (const [value, variant] of Object.entries(bundle.variants ?? {})) {
      assert.match(variant.source, new RegExp(`appearance = "${value}"`));
      assert.equal(
        variant.source.replace(`appearance = "${value}"`, 'appearance = "default"'),
        source,
      );
    }
  });
}
