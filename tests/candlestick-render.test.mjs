import assert from "node:assert/strict";
import test from "node:test";
import { CandlestickChart, CandlestickMark } from "@kind-ui/charts";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const config = { price: { label: "Observed price", color: "blue" } };
const data = [{ time: 1000, open: 10, high: 14, low: 8, close: 12 }];
const props = { config, data, timeMode: "epoch-ms", "aria-label": "Observed intervals" };

test("candle mark preserves wick extrema and exact open/close coordinates", () => {
  const html = render(
    h(
      "svg",
      null,
      h(CandlestickMark, {
        center: 40,
        width: 12,
        open: 30,
        high: 10,
        low: 60,
        close: 20,
        direction: "rising",
        className: "consumer-mark",
        stroke: "purple",
      }),
    ),
  );
  assert.match(html, /data-direction="rising"/);
  assert.match(html, /data-candle-part="wick" x1="40" x2="40" y1="10" y2="60"/);
  assert.match(html, /data-candle-part="body" x="34" y="20" width="12" height="10"/);
  assert.match(html, /class="consumer-mark"/);
  assert.match(html, /stroke="purple"/);
});

test("zero-price doji remains a line without fabricated numeric range", () => {
  const html = render(
    h(
      "svg",
      null,
      h(CandlestickMark, {
        center: 25,
        width: 10,
        open: 0,
        high: -5,
        low: 8,
        close: 0,
        direction: "unchanged",
      }),
    ),
  );
  assert.match(html, /data-candle-part="doji" x1="20" x2="30" y1="0" y2="0"/);
  assert.doesNotMatch(html, /data-candle-part="body"/);
});

test("root owns its named focus frame and only explicit composition", () => {
  const html = render(h(CandlestickChart, props, null));
  assert.match(html, /aria-label="Observed intervals"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /Arrow keys inspect candles/);
  assert.doesNotMatch(html, /candlestick-(?:mark|table|content|crosshair)/);
  assert.throws(() => render(h(CandlestickChart, props)), /requires explicit children/);
});

test("malformed observations fail even when no Series is composed", () => {
  assert.throws(
    () =>
      render(
        h(
          CandlestickChart,
          {
            ...props,
            data: [{ ...data[0], low: 11 }],
          },
          null,
        ),
      ),
    /low/,
  );
  assert.throws(
    () =>
      render(
        h(
          CandlestickChart,
          {
            ...props,
            priceScale: "log",
            data: [{ ...data[0], low: 0 }],
          },
          null,
        ),
      ),
    /positive/,
  );
  assert.throws(
    () =>
      render(
        h(
          CandlestickChart,
          {
            ...props,
            priceBounds: [0, 1],
          },
          null,
        ),
      ),
    /bounds/,
  );
});

test("state ownership and pane geometry fail with actionable errors", () => {
  assert.throws(
    () =>
      render(
        h(
          CandlestickChart,
          {
            ...props,
            viewport: { from: 0, to: 1 },
            defaultViewport: { from: 0, to: 1 },
          },
          null,
        ),
      ),
    /controlled and defaulted/,
  );
  assert.throws(
    () =>
      render(
        h(
          CandlestickChart,
          {
            ...props,
            selection: 1000,
            defaultSelection: 1000,
          },
          null,
        ),
      ),
    /controlled and defaulted/,
  );
  assert.throws(
    () =>
      render(
        h(
          CandlestickChart,
          {
            ...props,
            volumeRatio: 1,
          },
          null,
        ),
      ),
    /volumeRatio/,
  );
});

test("standalone compounds require the owning family", () => {
  for (const Part of [
    CandlestickChart.Series,
    CandlestickChart.XAxis,
    CandlestickChart.YAxis,
    CandlestickChart.Volume,
    CandlestickChart.Overlay,
    CandlestickChart.Crosshair,
    CandlestickChart.Content,
    CandlestickChart.DataTable,
  ]) {
    assert.throws(
      () => render(h(Part, { seriesKey: "price", dataKey: "close", caption: "Intervals" })),
      /Candlestick|LineSeries/,
    );
  }
});

test("provided malformed fixed domains fail rather than falling back to autoscale", () => {
  for (const priceDomain of [null, 0, [1], [3, 2]]) {
    assert.throws(() => render(h(CandlestickChart, { ...props, priceDomain }, null)), /domain/);
  }
});

test("loading exposes one consumer-labelled status and hides stale plot inspection", () => {
  const html = render(
    h(
      CandlestickChart,
      { ...props, loading: true, loadingLabel: "Loading observed intervals" },
      null,
    ),
  );
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /aria-hidden="true" inert=""/);
  assert.match(html, /Loading observed intervals/);
  assert.equal((html.match(/role="status"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /candlestick-(?:table|content|crosshair)/);
});
