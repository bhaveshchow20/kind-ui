import assert from "node:assert/strict";
import { mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { canonicalDocSlugs } from "../lib/routing.mjs";

async function sourceFor(id) {
  return readFile(`examples/${id}/example.tsx`, "utf8");
}
function jsxElements(source, tag) {
  const parsed = ts.createSourceFile(
    "example.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const elements = [];
  function visit(node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(parsed) === tag)
      elements.push(node.getText(parsed));
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  return elements;
}
async function renderedText(jsx, props) {
  const fixture = await mkdtemp(join(tmpdir(), "kind-docs-text-"));
  try {
    await symlink(await realpath("node_modules"), join(fixture, "node_modules"), "dir");
    const output = ts.transpileModule(
      `export default function Text({result, row, summary, visibleTotal}) { return (${jsx}); }`,
      { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } },
    ).outputText;
    const modulePath = join(fixture, "text.mjs");
    await writeFile(modulePath, output);
    const { default: Text } = await import(modulePath);
    return renderToStaticMarkup(Text(props)).replace(/<[^>]+>/g, "");
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
}

test("histogram accounting and Pie status separate values from words", async () => {
  for (const id of ["histogram", "histogram-density", "histogram-materials"]) {
    const summary = jsxElements(await sourceFor(id), "p").find((element) =>
      element.includes("result.accepted"),
    );
    assert.ok(summary);
    assert.equal(
      await renderedText(summary, {
        result: { accepted: 36, missing: 1, nonfinite: 0, outOfRange: 1 },
      }),
      "36 accepted · 1 missing · 0 nonfinite · 1 outside 0–200 ms",
    );
  }
  const status = jsxElements(await sourceFor("pie-visibility"), "p")[0];
  assert.equal(
    await renderedText(status, { visibleTotal: 1000 }),
    "1,000 hours visible; slice positions retain the full allocation",
  );
});

test("every boxplot quantitative data alternative separates its unit", async () => {
  const values = { lowerWhisker: 5, q1: 5, median: 5, q3: 5, upperWhisker: 5, outlier: 5 };
  for (const id of [
    "box-plot",
    "box-plot-horizontal",
    "box-plot-materials",
    "box-plot-edge-cases",
  ]) {
    const cells = jsxElements(await sourceFor(id), "dd").filter((cell) =>
      /\}(?:\s+)?(?:ms|pp)/.test(cell),
    );
    assert.equal(cells.length, id === "box-plot-edge-cases" ? 5 : 6);
    for (const cell of cells)
      assert.equal(
        await renderedText(cell, { row: values, summary: values }),
        id === "box-plot-edge-cases" ? "5 pp" : "5 ms",
      );
  }
});

test("heatmap frames name the represented data", async () => {
  for (const [id, name] of Object.entries({
    heatmap: "Support requests by day and hour",
    "heatmap-materials": "Support requests by day and hour",
    "heatmap-compact": "Contributions by day and week",
    "heatmap-diverging": "Regional orders versus monthly target",
  })) {
    const source = await sourceFor(id);
    assert.ok(source.includes(`aria-label="${name}"`));
    assert.ok(!source.includes('aria-label="Heatmap chart"'));
  }
});

test("legacy interaction fragment and Line legend remain available", async () => {
  const destination = canonicalDocSlugs(["chart-components", "root"]);
  const frame = await readFile(`content/docs/${destination.join("/")}.mdx`, "utf8");
  assert.match(frame, /<span id="interaction-and-eligibility"\s*\/>\s*## Focus and eligibility/);
  const line = await readFile("content/docs/components/line.mdx", "utf8");
  const usage = line.match(/```tsx title="Composition sketch"\n([\s\S]*?)```/)[1];
  assert.match(usage, /<LineChart.Legend\s*\/>/);
});
