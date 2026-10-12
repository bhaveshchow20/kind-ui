import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertBundleBudgets,
  assertBundleRetention,
  bundleBudgetSchema,
  measureBundle,
} from "./bundle-contract.mjs";

const budgets = bundleBudgetSchema.parse(
  JSON.parse(readFileSync(new URL("../docs/bundle-budgets.json", import.meta.url), "utf8")),
);
function baseline() {
  return {
    tools: { ...budgets.tools },
    fixtures: Object.fromEntries(
      Object.entries(budgets.fixtures).map(([name, budget]) => [
        name,
        structuredClone(budget.baseline),
      ]),
    ),
  };
}

test("measured baseline passes and missing fixture coverage fails", () => {
  assertBundleBudgets(baseline(), budgets);
  const missing = baseline();
  delete missing.fixtures.polar;
  assert.throws(() => assertBundleBudgets(missing, budgets), /cover exactly/);
});

for (const [asset, encoding] of [
  ["js", "raw"],
  ["js", "gzip"],
  ["js", "brotli"],
  ["css", "raw"],
  ["css", "gzip"],
  ["css", "brotli"],
]) {
  test(`an increase beyond ${asset}/${encoding} budget fails with an actionable fixture error`, () => {
    const increased = baseline();
    increased.fixtures.cartesian[asset][encoding] =
      budgets.fixtures.cartesian.maximum[asset][encoding] + 1;
    assert.throws(
      () => assertBundleBudgets(increased, budgets),
      /cartesian .*exceeds .*inspect retained modules/,
    );
  });
}

test("tool or peer changes require reviewed measurements", () => {
  for (const pin of ["vite", "react", "recharts", "framer-motion", "@tailwindcss/oxide"]) {
    const changed = baseline();
    changed.tools[pin] = "99.0.0";
    assert.throws(() => assertBundleBudgets(changed, budgets), /pins changed/);
  }
});

test("primitive overhead fails even when it fits the absolute budget", () => {
  const changed = baseline();
  changed.fixtures["primitive-kind"].js.raw += 101;
  assert.throws(() => assertBundleBudgets(changed, budgets), /difference must remain negligible/);
});

test("schema rejects invalid budget bytes and compression settings", () => {
  const changed = structuredClone(budgets);
  changed.fixtures.cartesian.maximum.js.gzip = -1;
  assert.throws(() => bundleBudgetSchema.parse(changed));
  changed.compression.gzipLevel = 1;
  assert.throws(() => bundleBudgetSchema.parse(changed));
});

test("primitive consumers reject Kind runtime and Motion retention", () => {
  assertBundleRetention("primitive-kind", []);
  for (const id of [
    "/node_modules/@kind-ui/charts/dist/chart-interaction.js",
    "/node_modules/framer-motion/dist/es/index.mjs",
  ]) {
    assert.throws(() => assertBundleRetention("primitive-kind", [id]), /must tree-shake/);
  }
});

test("single-family consumers reject unrelated compositions, standalone roots and loading designs", () => {
  const ownLoading = "/node_modules/@kind-ui/charts/dist/loading-skeleton.js";
  for (const fixture of ["cartesian", "line-loading", "polar"]) {
    assertBundleRetention(fixture, [ownLoading]);
    for (const name of [
      "composition/heatmap",
      "heatmap",
      "heatmap-model",
      "sankey-chart",
      "sankey-composition",
      "loading-standalone-designs",
      "loading-cartesian-designs",
    ]) {
      assert.throws(
        () =>
          assertBundleRetention(fixture, [
            ownLoading,
            `/node_modules/@kind-ui/charts/dist/${name}.js`,
          ]),
        /unrelated/,
      );
    }
  }
  assert.throws(() => assertBundleRetention("cartesian", []), /own supported loading/);
});

test("Heatmap and Sankey keep their shared designs but reject the other family", () => {
  const common = [
    "/node_modules/@kind-ui/charts/dist/loading-skeleton.js",
    "/node_modules/@kind-ui/charts/dist/loading-standalone-designs.js",
  ];
  for (const fixture of ["heatmap", "sankey"]) {
    assertBundleRetention(fixture, common);
    const other = fixture === "heatmap" ? "sankey-chart" : "heatmap";
    assert.throws(
      () =>
        assertBundleRetention(fixture, [
          ...common,
          `/node_modules/@kind-ui/charts/dist/${other}.js`,
        ]),
      /unrelated/,
    );
  }
});

test("measurement ignores a zero-code module instead of mistaking a traversed barrel for retained code", () => {
  const empty = "/node_modules/@kind-ui/charts/dist/heatmap.js";
  const retained = "/node_modules/@kind-ui/charts/dist/loading-skeleton.js";
  const measured = measureBundle({
    output: [
      {
        type: "chunk",
        code: "console.log(1)",
        modules: { [empty]: { renderedLength: 0 }, [retained]: { renderedLength: 14 } },
      },
      { type: "asset", fileName: "app.css", source: "body{color:red}" },
    ],
  });
  assert.deepEqual(measured.modules, [retained]);
  assert.equal(measured.js.raw, 14);
  assert.equal(measured.css.raw, 15);
  assertBundleRetention("cartesian", measured.modules);
});
