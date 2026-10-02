import assert from "node:assert/strict";
import test from "node:test";
import * as Chart from "@kind-ui/charts";
import { Legend, Root, TooltipContent } from "@kind-ui/charts";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

test("direct and namespace imports expose the same public components", () => {
  assert.deepEqual(Object.keys(Chart).sort(), [
    "AreaChart",
    "AreaSeries",
    "BarChart",
    "BarSeries",
    "ComboChart",
    "HistogramChart",
    "HistogramSeries",
    "Legend",
    "LineChart",
    "LineSeries",
    "PieChart",
    "PieSeries",
    "RadarChart",
    "RadarSeries",
    "RadialBarChart",
    "RadialBarLabel",
    "RadialBarSeries",
    "Root",
    "Tooltip",
    "TooltipContent",
    "binHistogram",
  ]);
  assert.equal(Chart.Root, Root);
  assert.equal(Chart.Legend, Legend);
  assert.equal(Chart.TooltipContent, TooltipContent);
});

const config = {
  count: { label: "Tasks", color: "#2563eb", formatValue: (value) => `${value} tasks` },
};
const entry = (value, extra = {}) => ({
  dataKey: "count",
  name: "count",
  value,
  graphicalItemId: "count",
  ...extra,
});
const tooltip = (payload, extra = {}) => ({
  active: true,
  payload,
  label: "Monday",
  accessibilityLayer: true,
  activeIndex: "0",
  coordinate: undefined,
  ...extra,
});
const content = (payload, extra = {}) =>
  render(
    h(
      Root,
      { config },
      h(TooltipContent, {
        tooltip: tooltip(payload, extra),
        id: "tip",
        "data-owner": "consumer",
      }),
    ),
  );

test("zero uses the series formatter; null and undefined remain missing", () => {
  assert.match(content([entry(0)]), /0 tasks/);
  assert.doesNotMatch(content([entry(null)]), /data-kind-ui="chart-tooltip"/);
  assert.doesNotMatch(content([entry(undefined)]), /data-kind-ui="chart-tooltip"/);
  assert.match(content([entry(null), entry(0, { graphicalItemId: "other" })]), /No data/);
  assert.doesNotMatch(content([entry(null)]), /null tasks/);
});
test("upstream formatter, tuple label and label formatter remain usable", () => {
  const html = content([entry(0)], {
    formatter: (value) => [`${value}%`, "Custom"],
    labelFormatter: () => "Custom day",
  });
  assert.match(html, /0%/);
  assert.match(html, /Custom day/);
  assert.match(html, /Custom/);
});
test("hidden, type-none, inactive and consumer-hidden entries are omitted", () => {
  assert.doesNotMatch(content([entry(9, { hide: true })]), /9 tasks/);
  assert.doesNotMatch(content([entry(9, { type: "none" })]), /9 tasks/);
  assert.doesNotMatch(content([entry(9)], { active: false }), /9 tasks/);
  const html = render(
    h(Root, { config, visibleSeries: [] }, h(TooltipContent, { tooltip: tooltip([entry(9)]) })),
  );
  assert.doesNotMatch(html, /9 tasks/);
});
test("content preserves live-region semantics and forwards DOM props", () => {
  const html = content([entry(4)]);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="assertive"/);
  assert.match(html, /id="tip"/);
  assert.match(html, /data-owner="consumer"/);
  assert.doesNotMatch(html, /accessibilityLayer=|graphicalItemId=|activeIndex=/);
});
test("legend is static by default, controlled when requested, and container colors are scoped", () => {
  const html = render(
    h(Root, { config, id: "scope", className: "custom" }, h(Legend, { id: "legend" })),
  );
  assert.match(html, /--color-count:#2563eb/);
  assert.match(html, /id="legend"/);
  assert.doesNotMatch(html, /<button/);
  const hidden = render(
    h(Root, { config, visibleSeries: [], onVisibleSeriesChange() {} }, h(Legend)),
  );
  assert.match(hidden, /aria-pressed="false"/);
});
test("invalid composition and keys have actionable errors", () => {
  assert.throws(() => render(h(Legend)), /inside Root/);
  assert.throws(
    () => render(h(Root, { config, onVisibleSeriesChange() {} })),
    /requires visibleSeries/,
  );
  assert.throws(() => render(h(Root, { config: { "bad key": config.count } })), /Chart series key/);
});

test("upstream null formatter suppresses an entry and per-entry formatters take precedence", () => {
  assert.doesNotMatch(
    content([entry(1, { formatter: () => null }), entry(null, { graphicalItemId: "missing" })]),
    /data-kind-ui="chart-tooltip"/,
  );
  assert.doesNotMatch(
    content([entry(1)], { formatter: () => null }),
    /data-kind-ui="chart-tooltip"/,
  );
  assert.doesNotMatch(
    content([entry(1)], { formatter: () => undefined }),
    /data-kind-ui="chart-tooltip"/,
  );
  assert.match(
    content([entry(0, { formatter: () => "entry format" })], { formatter: () => "global format" }),
    /entry format/,
  );
});
test("unknown prototype-named keys use upstream metadata without inherited config", () => {
  for (const dataKey of ["constructor", "toString"]) {
    const html = content([entry(1, { dataKey, name: "Unknown", color: "#f00" })]);
    assert.match(html, /Unknown/);
    assert.match(html, /--kind-ui-chart-indicator-color:#f00/);
    assert.doesNotMatch(html, new RegExp(`var\\(--color-${dataKey}`));
  }
});

test("line components reject missing composition boundaries", () => {
  assert.throws(() => render(h(Chart.Tooltip)), /inside LineChart/);
  assert.throws(
    () => render(h(Root, { config }, h(Chart.LineSeries, { dataKey: "count" }))),
    /inside LineChart/,
  );
});

test("area composition requires Root and a chart interaction boundary", () => {
  assert.throws(
    () => render(h(Root, { config }, h(Chart.AreaSeries, { dataKey: "count" }))),
    /inside LineChart/,
  );
});

test("category itemKey resolves metadata, zero, formatting and visibility independently of dataKey", () => {
  const payload = [entry(0, { payload: { id: "category" }, name: "Native name" })];
  const categoryConfig = {
    category: { label: "Category label", color: "red", formatValue: (v) => `${v} members` },
  };
  const renderCategory = (visibleSeries) =>
    render(
      h(
        Root,
        { config: categoryConfig, visibleSeries },
        h(TooltipContent, {
          tooltip: tooltip(payload),
          itemKey: (item) => item.payload.id,
        }),
      ),
    );
  assert.match(renderCategory(["category"]), /Category label/);
  assert.match(renderCategory(["category"]), /0 members/);
  assert.match(renderCategory(["category"]), /data-series="category"/);
  assert.doesNotMatch(renderCategory(["count"]), /chart-tooltip/);
  assert.doesNotMatch(renderCategory(["category"]), /itemKey=/);
});

for (const [name, Component] of [
  ["RadarSeries", Chart.RadarSeries],
  ["RadialBarSeries", Chart.RadialBarSeries],
]) {
  test(`${name} rejects missing polar composition boundaries`, () => {
    assert.throws(() => render(h(Component, { dataKey: "count" })), /inside Root/);
    assert.throws(
      () => render(h(Root, { config }, h(Component, { dataKey: "count" }))),
      /inside LineChart/,
    );
  });
}

test("RadialBarLabel preserves SSR metadata and omits invalid or disabled geometry", () => {
  const viewBox = {
    cx: 100,
    cy: 100,
    innerRadius: 60,
    outerRadius: 80,
    startAngle: 0,
    endAngle: 180,
  };
  const props = { viewBox, value: 25, formatter: (value) => `${value} points` };
  const markup = render(h("svg", null, h(Chart.RadialBarLabel, props)));
  assert.match(markup, /25 points/);
  assert.match(markup, /visibility:hidden/);
  assert.doesNotMatch(markup, /NaN/);
  for (const overrides of [
    { show: false },
    { viewBox: { ...viewBox, endAngle: 0 } },
    { viewBox: { ...viewBox, outerRadius: 61 } },
    { viewBox: { ...viewBox, cx: NaN } },
    { value: null },
  ])
    assert.equal(
      render(h(Chart.RadialBarLabel, { ...props, ...overrides, formatter: undefined })),
      "",
    );
});
// Histogram numerical contracts also run from the isolated tarball consumer.
test("histogram explicit boundaries include final edge, negatives and zeros", () => {
  const result = Chart.binHistogram(
    [-3, -2, -1, 0, 1, 2, 3, null, undefined, NaN, Infinity],
    [-2, 0, 2],
  );
  assert.deepEqual(result, {
    bins: [
      { lower: -2, upper: 0, count: 2 },
      { lower: 0, upper: 2, count: 3 },
    ],
    accepted: 5,
    missing: 2,
    nonfinite: 2,
    outOfRange: 2,
  });
  assert.deepEqual(
    Chart.binHistogram([], [0, 1, 3]).bins.map((bin) => bin.count),
    [0, 0],
  );
  assert.equal(Chart.binHistogram([0, 1], [0, 1]).bins[0].count, 2);
});
test("histogram rejects duplicate, unsorted, nonfinite and overflowing edges", () => {
  for (const edges of [
    [],
    [0],
    [0, 0],
    [2, 1],
    [0, NaN],
    [-Infinity, 1],
    [-Number.MAX_VALUE, Number.MAX_VALUE],
  ])
    assert.throws(() => Chart.binHistogram([], edges), /Histogram/);
});
test("histogram counts conserve accepted samples without mutating inputs", () => {
  const edges = Object.freeze([-10, -3, 0, 0.5, 10]);
  const samples = Object.freeze(Array.from({ length: 501 }, (_, index) => index / 10 - 20));
  const result = Chart.binHistogram(samples, edges);
  assert.equal(
    result.accepted + result.outOfRange + result.missing + result.nonfinite,
    samples.length,
  );
  assert.equal(
    result.bins.reduce((sum, bin) => sum + bin.count, 0),
    result.accepted,
  );
});
const histogramMarkup = (bins, measure = "count") =>
  render(
    h(
      Root,
      { config },
      h(Chart.HistogramChart, { bins, measure, width: 300, height: 200 }, h(Chart.HistogramSeries)),
    ),
  );
test("histogram validates pre-binned aggregates instead of repairing them", () => {
  for (const bins of [
    [{ lower: 0, upper: 1, count: -1 }],
    [{ lower: 0, upper: 1, count: 0.5 }],
    [{ lower: 0, upper: 1, count: null }],
    [{ lower: 0, upper: 1, count: NaN }],
    [{ lower: 0, upper: 1, count: Infinity }],
    [
      { lower: 0, upper: 2, count: 1 },
      { lower: 1, upper: 3, count: 2 },
    ],
    [
      { lower: 0, upper: 1, count: Number.MAX_SAFE_INTEGER },
      { lower: 1, upper: 2, count: 1 },
    ],
  ])
    assert.throws(() => histogramMarkup(bins), /Histogram/);
  assert.doesNotThrow(() => histogramMarkup([], "density"));
  assert.doesNotThrow(() =>
    histogramMarkup(
      [
        { lower: -2, upper: 0, count: 0 },
        { lower: 1, upper: 5, count: 0 },
      ],
      "density",
    ),
  );
  assert.throws(
    () => histogramMarkup([{ lower: 0, upper: Number.MIN_VALUE, count: 1 }], "density"),
    /density/,
  );
  assert.throws(() => histogramMarkup([], "fraction"), /measure/);
  assert.throws(() => render(h(Root, { config }, h(Chart.HistogramSeries))), /HistogramChart/);
});

test("histogram rejects domain overflow and positive-density underflow", () => {
  assert.throws(
    () =>
      histogramMarkup([
        { lower: -Number.MAX_VALUE, upper: 0, count: 1 },
        { lower: 0, upper: Number.MAX_VALUE, count: 1 },
      ]),
    /domain/,
  );
  assert.throws(
    () =>
      histogramMarkup(
        [
          { lower: 0, upper: 1, count: Number.MAX_SAFE_INTEGER - 1 },
          { lower: 1, upper: 1e308, count: 1 },
        ],
        "density",
      ),
    /density/,
  );
});
