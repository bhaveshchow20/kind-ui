import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { normalizeTreemap } from "@kind-ui/charts";
import ts from "typescript";
import { family } from "../examples/treemap-catalog.mjs";
import { filesFor } from "../lib/example-files.mjs";

const docs = new URL("../", import.meta.url);
const specifications = {
  treemap: {
    id: "id",
    label: "label",
    children: "children",
    area: "value",
    metrics: [],
    summed: [],
    total: 76300,
  },
  "treemap-portfolio": {
    id: "id",
    label: "label",
    children: "children",
    area: "grossUsdK",
    metrics: ["signedUsdK", "pnlUsdK"],
    summed: [],
    total: 340,
  },
  "treemap-events": {
    id: "key",
    label: "title",
    children: "markets",
    area: "turnoverUsdK",
    metrics: ["probabilityChangePp"],
    summed: [],
    total: 130,
  },
  "treemap-storage": {
    id: "key",
    label: "title",
    children: "members",
    area: "storedGb",
    metrics: ["monthlyGrowthGb"],
    summed: [],
    total: 940,
  },
};
function literal(node) {
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node))
    return Object.fromEntries(
      node.properties.map((property) => {
        assert.ok(ts.isPropertyAssignment(property), "Data must have literal named properties");
        return [property.name.getText().replaceAll('"', ""), literal(property.initializer)];
      }),
    );
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken)
    return -literal(node.operand);
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  throw new Error(`Unsupported data literal: ${node.getText()}`);
}
function sourceData(source, variable = "data") {
  const syntax = ts.createSourceFile(
    "example.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let found;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(syntax) === variable)
      found = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(syntax);
  assert.ok(found, `Every complete source must declare literal const ${variable}`);
  return literal(found);
}
function descendantTotal(node, children, field) {
  const members = node[children];
  return members === undefined
    ? node[field]
    : members.reduce((total, child) => total + descendantTotal(child, children, field), 0);
}
for (const example of family.examples) {
  test(`${example.id}: plotted values exactly match original hierarchy, including zeros and missing metrics`, () => {
    const source = readFileSync(new URL(`examples/${example.id}/example.tsx`, docs), "utf8");
    const spec = specifications[example.id];
    const model = normalizeTreemap(sourceData(source), {
      id: (datum) => datum[spec.id],
      label: (datum) => datum[spec.label],
      children: (datum) => datum[spec.children],
      value: (datum) => datum[spec.area],
    });
    assert.equal(model.total, spec.total);
    const rows = model.nodes.map((node) => {
      const row = {
        id: node.id,
        path: node.path.map((id) => model.byId.get(id).label).join(" / "),
        kind: node.kind === "group" ? "Group total" : "Leaf",
        [spec.area]: node.value,
      };
      for (const metric of spec.metrics)
        row[metric] =
          node.kind === "group"
            ? spec.summed.includes(metric)
              ? descendantTotal(node.datum, spec.children, metric)
              : "Not aggregated"
            : (node.datum[metric] ?? "Unavailable");
      if (example.id === "treemap") {
        const previous = sourceData(source, "previousValues");
        const sumPrevious = (entry) =>
          entry.kind === "leaf"
            ? previous[entry.id]
            : entry.children.reduce((total, child) => total + sumPrevious(child), 0);
        row.previousValue = sumPrevious(node);
      }
      return row;
    });
    assert.deepEqual(family.dataLabels[example.id].rows, rows);
    assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
    if (example.id !== "treemap")
      assert.ok(rows.some((row) => row.kind === "Leaf" && row[spec.area] === 0));
    if (spec.metrics.length)
      assert.ok(rows.some((row) => spec.metrics.some((metric) => row[metric] === "Unavailable")));
    for (const part of [
      "Tiles",
      "Labels",
      "Tooltip",
      example.id === "treemap" ? "Legend" : "ColorLegend",
      "Breadcrumbs",
    ])
      assert.ok(source.includes(`<TreemapChart.${part}`), `Missing explicit ${part}`);
    assert.doesNotMatch(source, /<TreemapChart\.(?:Root|Plot|DataTable)|<table\b/);
    assert.doesNotMatch(source, /from ["']\.\.?\//);
    assert.doesNotMatch(source, /\?\?\s*0/, "Missing leaf area must never silently become zero");
    if (example.id !== "treemap") {
      assert.match(source, /if \(value === undefined\)/);
      assert.match(source, /throw new Error\(\s*`/);
      assert.ok(
        source.includes(`Treemap leaf \${datum.${spec.id}} is missing`),
        "Missing-area errors must identify the original record",
      );
    }
    assert.match(source, /Illustrative/);
    assert.match(
      family.dataLabels[example.id].caption,
      example.id === "treemap" ? /August and September 2026/ : /October 9, 2026/,
    );
  });
}
test("primary period selection and preview adapter agree with the literal default", () => {
  const source = readFileSync(new URL("examples/treemap/example.tsx", docs), "utf8");
  const preview = readFileSync(new URL("components/previews/treemap.tsx", docs), "utf8");
  assert.equal(family.examples[0].id, "treemap");
  assert.deepEqual(family.variants.treemap, {
    control: "Billing period",
    prop: "period",
    default: "current",
    options: [
      { value: "current", label: "September 2026" },
      { value: "previous", label: "August 2026" },
    ],
  });
  assert.match(source, /period = "current"/);
  assert.match(source, /export function CloudSpendTreemap/);
  assert.match(source, /loading = false/);
  assert.match(source, /loading=\{loading\}/);
  assert.match(source, /valueAnimation="shuffle"/);
  assert.deepEqual(family.loadingVariant, { prop: "loading", default: false, label: "Loading" });
  assert.match(preview, /loading=\{variant === "loading"\}/);
  assert.match(preview, /variant === "previous" \? "previous" : "current"/);
  for (const example of family.examples)
    assert.ok(preview.includes(`@/examples/${example.id}/example`));
});
test("monthly billing periods preserve every identity and match their supplied totals", () => {
  const source = readFileSync(new URL("examples/treemap/example.tsx", docs), "utf8");
  const current = normalizeTreemap(sourceData(source));
  const previousValues = sourceData(source, "previousValues");
  const leaves = current.nodes.filter((node) => node.kind === "leaf");
  assert.deepEqual(Object.keys(previousValues).sort(), leaves.map((node) => node.id).sort());
  assert.equal(
    Object.values(previousValues).reduce((sum, value) => sum + value, 0),
    69600,
  );
  assert.equal(current.total, 76300);
  assert.equal(leaves.length, 10);
  assert.match(source, /children: previousPeriod\(node.children\)/);
  assert.match(source, /value: previousValues\[node.id\]/);
  assert.doesNotMatch(source, /View (?:plotted )?[Dd]ata|DataTable/);
});
test("signed exposure is precomputed and market activity is not duplicated per outcome", () => {
  const portfolio = sourceData(
    readFileSync(new URL("examples/treemap-portfolio/example.tsx", docs), "utf8"),
  );
  const rows = family.dataLabels["treemap-portfolio"].rows.filter((row) => row.kind === "Leaf");
  assert.ok(rows.some((row) => row.signedUsdK < 0));
  for (const row of rows) assert.equal(row.grossUsdK, Math.abs(row.signedUsdK));
  assert.equal(portfolio.length, 2);
  const events = family.dataLabels["treemap-events"].rows.filter((row) => row.kind === "Leaf");
  assert.equal(events.length, 6);
  assert.equal(
    events.reduce((total, row) => total + row.turnoverUsdK, 0),
    130,
  );
  const storage = family.dataLabels["treemap-storage"].rows.find((row) => row.id === "planned");
  assert.deepEqual(storage, {
    id: "planned",
    path: "Planned services",
    kind: "Group total",
    storedGb: 0,
    monthlyGrowthGb: "Not aggregated",
  });
});

test("generated consumers and selected metric sources match their canonical examples", () => {
  const bundles = JSON.parse(
    readFileSync(new URL("generated/treemap-examples.json", docs), "utf8"),
  );
  for (const example of family.examples) {
    const source = readFileSync(new URL(`examples/${example.id}/example.tsx`, docs), "utf8");
    const path = `src/examples/${example.id}/example.tsx`;
    assert.equal(bundles[example.id].files[path], source);
    for (const [variant, selection] of Object.entries(bundles[example.id].variants ?? {})) {
      assert.equal(filesFor(bundles[example.id], {}, variant)[path], selection.source);
      if (variant === "loading") {
        assert.equal(example.id, "treemap");
        assert.ok(selection.source.includes("loading = true"));
        assert.ok(selection.source.includes('period = "current"'));
      } else {
        assert.ok(selection.source.includes(`${family.variants[example.id].prop} = "${variant}"`));
        if (example.id === "treemap") assert.ok(selection.source.includes("loading = false"));
      }
    }
  }
  assert.deepEqual(Object.keys(bundles.treemap.variants), ["current", "previous", "loading"]);
});
