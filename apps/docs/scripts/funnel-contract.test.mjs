import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createFunnelModel } from "@kind-ui/charts";
import ts from "typescript";
import { family } from "../examples/funnel-catalog.mjs";
import { promptFor } from "../lib/example-files.mjs";

function literal(node) {
  if (ts.isSatisfiesExpression(node)) return literal(node.expression);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map((property) => {
        assert.ok(ts.isPropertyAssignment(property));
        return [property.name.getText().replace(/^"|"$/g, ""), literal(property.initializer)];
      }),
    );
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  throw new Error("Expected literal Funnel example data");
}
const percentage = (ratio) => (ratio === null ? "—" : Number((ratio * 100).toFixed(1)));

for (const example of family.examples) {
  test(`${example.id}: canonical aggregates, catalog alternatives and copied variants agree`, () => {
    const source = readFileSync(
      new URL(`../examples/${example.id}/example.tsx`, import.meta.url),
      "utf8",
    );
    const parsed = ts.createSourceFile("example.tsx", source, ts.ScriptTarget.Latest, true);
    const directive = parsed.statements[0];
    assert.ok(ts.isExpressionStatement(directive) && ts.isStringLiteral(directive.expression));
    assert.equal(directive.expression.text, "use client");
    assert.doesNotMatch(source, /from ["'](?:@\/|\.\.\/)/);
    assert.doesNotMatch(source, /<table\b|FunnelChart\.DataTable|localhost|127\.0\.0\.1/);
    const variable = parsed.statements
      .flatMap((statement) =>
        ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : [],
      )
      .find((declaration) => declaration.name.getText(parsed) === "data");
    assert.ok(variable?.initializer);
    const data = literal(variable.initializer);
    let rows;
    if (example.id === "funnel-pipeline") {
      rows = data.map((record) => ({
        ...record,
        weightedUsd: record.weightedUsd ?? "Not reported",
        medianDays: record.medianDays ?? "Unknown duration",
      }));
      const model = createFunnelModel({
        data,
        accessors: {
          id: (record) => record.key,
          label: (record) => record.title,
          value: (record) => record.weightedUsd,
        },
      });
      assert.ok(model.stages[1].value > model.stages[0].value);
      assert.equal(model.stages[2].value, null);
      assert.equal(model.stages[3].value, 0);
      assert.ok(model.stages.every((stage) => stage.ratio === null));
      assert.doesNotMatch(source, /\bdenominator=|\bratioLabel=/);
      assert.match(source, /id:\s*\(record\)\s*=>\s*record\.key/);
      assert.match(source, /label:\s*\(record\)\s*=>\s*record\.title/);
      assert.match(source, /value:\s*\(record\)\s*=>\s*record\.weightedUsd/);
      assert.match(source, /FunnelChart\.Labels<PipelineStage>/);
      assert.match(source, /stage\.datum\.medianDays/);
    } else if (example.id === "funnel-comparison") {
      rows = ["June", "July"].flatMap((cohort) => {
        const model = createFunnelModel({
          data: data.filter((record) => record.cohort === cohort),
          denominator: "first",
          scaleMax: 1600,
        });
        assert.equal(model.scaleMax, 1600);
        assert.equal(model.stages[0].ratio, 1);
        return model.stages.map((stage) => ({
          ...stage.datum,
          denominator: stage.denominator,
          ratio: percentage(stage.ratio),
        }));
      });
      assert.match(source, /scaleMax=\{1600\}/);
      assert.match(source, /denominator="first"/);
      assert.equal(rows[2].ratio, 42);
      assert.equal(rows[5].ratio, 45.5);
    } else {
      const denominator = example.id === "funnel" ? "first" : "previous";
      const model = createFunnelModel({ data, denominator });
      rows = model.stages.map((stage) => ({
        ...stage.datum,
        denominator: stage.denominator ?? "—",
        ratio: percentage(stage.ratio),
      }));
      assert.match(source, new RegExp(`denominator="${denominator}"`));
      if (example.id === "funnel-orientation") {
        assert.match(source, /geometry="trapezoid"/);
        assert.match(source, /orientation=\{orientation\}/);
        assert.equal(model.stages[0].ratio, null);
      }
    }
    assert.deepEqual(rows, family.dataLabels[example.id].rows);

    const bundles = JSON.parse(
      readFileSync(new URL("../generated/funnel-examples.json", import.meta.url), "utf8"),
    );
    const bundle = bundles[example.id];
    assert.equal(bundle.files[`src/examples/${example.id}/example.tsx`], source);
    assert.deepEqual(bundle.dataAlternative.rows, rows);
    if (example.id === "funnel") assert.equal(bundle.registryItemName, "funnel-chart");
    const definition = family.variants[example.id];
    assert.deepEqual(
      Object.keys(bundle.variants ?? {}),
      definition?.options.map((option) => option.value) ?? [],
    );
    for (const [value, variant] of Object.entries(bundle.variants ?? {})) {
      assert.equal(
        variant.source.replace(
          `${definition.prop} = "${value}"`,
          `${definition.prop} = "${definition.default}"`,
        ),
        source,
      );
      const prompt = promptFor(bundle, undefined, value);
      assert.ok(
        prompt.includes(
          `https://kindui.dev/charts/docs/examples/${example.id}/variants/${value}/example.tsx`,
        ),
      );
      assert.ok(prompt.includes(`(${value})`));
      assert.doesNotMatch(prompt, /localhost|127\.0\.0\.1/);
    }
  });
}

test("Funnel install metadata requires compatible exports without changing candidate identity", () => {
  const bundles = JSON.parse(
    readFileSync(new URL("../generated/funnel-examples.json", import.meta.url), "utf8"),
  );
  for (const bundle of Object.values(bundles)) {
    assert.equal(bundle.coreRequirement, "^0.6.0");
    assert.equal(
      JSON.parse(bundle.files["package.json"]).dependencies["@kind-ui/charts"],
      "^0.6.0",
    );
    assert.match(promptFor(bundle, {}), /Reference package: @kind-ui\/charts@\^0\.6\.0/);
    assert.match(promptFor(bundle, {}), /Install @kind-ui\/charts@\^0\.6\.0/);
    assert.doesNotMatch(promptFor(bundle, {}), /Reference package: @kind-ui\/charts@0\.5\.0/);
  }
});
