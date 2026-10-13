import assert from "node:assert/strict";
import test from "node:test";
import { CandlestickChart, CandlestickCurrentPrice } from "@kind-ui/charts";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("CurrentPrice is an explicit public compound and requires its chart context", () => {
  assert.equal(CandlestickChart.CurrentPrice, CandlestickCurrentPrice);
  assert.throws(
    () => renderToStaticMarkup(createElement(CandlestickCurrentPrice)),
    /Candlestick parts require CandlestickChart/,
  );
});
