import assert from "node:assert/strict";
import test from "node:test";
import {
  CandlestickChart,
  CandlestickControls,
  CandlestickHistoryNavigator,
} from "@kind-ui/charts";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("navigation parts share the explicit compound public exports", () => {
  assert.equal(CandlestickChart.Controls, CandlestickControls);
  assert.equal(CandlestickChart.HistoryNavigator, CandlestickHistoryNavigator);
  assert.throws(() => render(h(CandlestickControls)), /require CandlestickChart/);
  assert.throws(() => render(h(CandlestickHistoryNavigator)), /require CandlestickChart/);
});
test("navigation options reject malformed zoom factors, sizes and owned native overrides", () => {
  for (const zoomFactor of [0, 1, NaN, Infinity, null]) {
    assert.throws(() => render(h(CandlestickControls, { zoomFactor })), /zoomFactor/);
  }
  for (const height of [0, 31, NaN, Infinity, null]) {
    assert.throws(() => render(h(CandlestickHistoryNavigator, { height })), /height/);
  }
  for (const key of [
    "data",
    "dataKey",
    "startIndex",
    "endIndex",
    "children",
    "x",
    "y",
    "width",
    "height",
  ]) {
    assert.throws(
      () => render(h(CandlestickHistoryNavigator, { brushProps: { [key]: undefined } })),
      new RegExp(`brushProps.${key}`),
    );
  }
  for (const key of ["data", "dataKey", "xAxisId", "yAxisId", "isAnimationActive"]) {
    assert.throws(
      () => render(h(CandlestickHistoryNavigator, { overviewProps: { [key]: undefined } })),
      new RegExp(`overviewProps.${key}`),
    );
  }
});
