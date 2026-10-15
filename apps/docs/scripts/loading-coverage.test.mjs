import assert from "node:assert/strict";
import test from "node:test";
import { nativeLoadingCoverage } from "./loading-coverage.mjs";

const lineEntry = 'export { LineChart } from "./line.js";';
const candidateEntry = `${lineEntry}\nexport { CandlestickChart } from "./candlestick.js";`;
const line = {
  id: "line",
  variants: {
    loading: {
      source:
        'import { LineChart } from "@kind-ui/charts"; export const Example = () => <LineChart loading />;',
    },
  },
};

test("an unreadable public entry cannot silently disable native coverage", () => {
  assert.throws(
    () => nativeLoadingCoverage('export { Tooltip } from "./tooltip.js";', { line }),
    /Installed Docs public entry has no chart roots/,
  );
});

test("an older installed Docs entry keeps full coverage while workspace Core advances", () => {
  assert.deepEqual(nativeLoadingCoverage(lineEntry, { line }), [
    { component: "LineChart", example: "line" },
  ]);
  assert.throws(
    () => nativeLoadingCoverage(candidateEntry, { line }),
    /CandlestickChart needs a native loading example/,
  );
});

test("a newly installed chart still requires its own native loading composition", () => {
  const candlestick = {
    id: "candlestick",
    variants: {
      loading: {
        source:
          'import { CandlestickChart as Candles } from "@kind-ui/charts"; export const Example = () => <Candles loading />;',
      },
    },
  };
  assert.deepEqual(nativeLoadingCoverage(candidateEntry, { line, candlestick }), [
    { component: "LineChart", example: "line" },
    { component: "CandlestickChart", example: "candlestick" },
  ]);
  assert.throws(
    () =>
      nativeLoadingCoverage(candidateEntry, {
        line,
        candlestick: {
          ...candlestick,
          variants: { loading: { source: "export const Example = () => <div loading />;" } },
        },
      }),
    /CandlestickChart needs a native loading example/,
  );
});

test("namespace native imports work while type-only imports cannot satisfy coverage", () => {
  const source =
    'import * as Charts from "@kind-ui/charts"; export const Example = () => <Charts.LineChart loading />;';
  assert.deepEqual(
    nativeLoadingCoverage(lineEntry, { line: { ...line, variants: { loading: { source } } } }),
    [{ component: "LineChart", example: "line" }],
  );
  assert.throws(
    () =>
      nativeLoadingCoverage(lineEntry, {
        line: {
          ...line,
          variants: {
            loading: {
              source:
                'import type { LineChart } from "@kind-ui/charts"; export const Example = () => <LineChart loading />;',
            },
          },
        },
      }),
    /LineChart needs a native loading example/,
  );
});
