import assert from "node:assert/strict";
import test from "node:test";
import * as Chart from "@kind-ui/charts";
import { Legend, Root, TooltipContent } from "@kind-ui/charts";
import { Fragment, createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
import * as Native from "recharts";

// Standalone SVG marks need the same namespace as their chart host. Return the
// inner markup so existing geometry and direct-root assertions stay unchanged.
const renderSvg = (element) => render(h("svg", null, element)).slice(5, -6);

import { ScatterChart as NativeScatterChart, Scatter, XAxis, YAxis } from "recharts";

test("development stylesheet diagnostic leaves SSR markup identical and never accesses DOM", () => {
  const previous = process.env.NODE_ENV;
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
  const chart = h(Root, { config: { total: { color: "red" } } }, "Chart");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    get() {
      throw new Error("Stylesheet diagnostics must not read the SSR document");
    },
  });
  try {
    process.env.NODE_ENV = "production";
    const production = render(chart);
    process.env.NODE_ENV = "development";
    assert.equal(render(chart), production);
    assert.doesNotMatch(production, /kind-ui-styles-loaded|<style|<link/);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
    if (descriptor) Object.defineProperty(globalThis, "document", descriptor);
    else delete globalThis.document;
  }
});

test("fixed-size Scatter SSR matches the native empty wrapper; hosts supply a data alternative", () => {
  const axes = [
    h(XAxis, { key: "x", type: "number", dataKey: "x" }),
    h(YAxis, { key: "y", type: "number", dataKey: "y" }),
  ];
  const data = [{ x: 1, y: 2 }];
  const native = render(
    h(
      NativeScatterChart,
      { width: 320, height: 240 },
      ...axes,
      h(Scatter, { data, isAnimationActive: false }),
    ),
  );
  const kind = render(
    h(
      Root,
      { config: { points: { label: "Points", color: "#123456" } } },
      h(
        Chart.ScatterChart,
        { width: 320, height: 240, animate: false },
        ...axes,
        h(Chart.ScatterSeries, { data, seriesKey: "points" }),
      ),
    ),
  );
  for (const html of [native, kind]) {
    assert.match(html, /recharts-wrapper/);
    assert.match(html, /width:320px;height:240px/);
    assert.doesNotMatch(html, /<svg|recharts-scatter-symbol|<path/);
  }
});

test("direct and namespace imports expose the same public components", () => {
  assert.deepEqual(Object.keys(Chart).sort(), [
    "ActivityRings",
    "AreaChart",
    "AreaRevealShape",
    "AreaSeries",
    "BarChart",
    "BarSeries",
    "BarStack",
    "BoxPlotChart",
    "BoxPlotMark",
    "BoxPlotSeries",
    "Brush",
    "CartesianGrid",
    "Cell",
    "ChartBackgroundPattern",
    "ComboChart",
    "Curve",
    "Dot",
    "EmphasisMark",
    "ErrorBar",
    "FillPatternSwatch",
    "HeatmapCellContent",
    "HeatmapChart",
    "HeatmapDataTable",
    "HeatmapGrid",
    "HeatmapLegend",
    "HeatmapTooltip",
    "HistogramChart",
    "HistogramSeries",
    "Label",
    "LabelList",
    "Legend",
    "LineChart",
    "LineDrawShape",
    "LineSeries",
    "PieChart",
    "PieSeries",
    "PointMarker",
    "PolarAngleAxis",
    "PolarGrid",
    "PolarRadiusAxis",
    "Polygon",
    "RadarChart",
    "RadarSeries",
    "RadialBarChart",
    "RadialBarLabel",
    "RadialBarSeries",
    "Rectangle",
    "ReferenceArea",
    "ReferenceDot",
    "ReferenceLine",
    "ResponsiveContainer",
    "Root",
    "SankeyChart",
    "SankeyLegend",
    "SankeyLink",
    "SankeyNode",
    "SankeyNodeLabel",
    "SankeyTable",
    "ScatterChart",
    "ScatterSeries",
    "ScatterTooltip",
    "ScatterTooltipContent",
    "Sector",
    "Symbols",
    "Tooltip",
    "TooltipContent",
    "WaterfallChart",
    "WaterfallConnectors",
    "WaterfallSeries",
    "XAxis",
    "YAxis",
    "ZAxis",
    "binHistogram",
    "boxPlotExtent",
    "computeWaterfallData",
    "createHeatmapModel",
    "createHeatmapScale",
    "createPercentStack",
    "defineChartBackgroundPattern",
    "formatPercent",
    "getRelativeCoordinate",
    "prepareSankeyData",
    "useChartHeight",
    "useChartInteraction",
    "useChartWidth",
    "useEmphasis",
    "useXAxisScale",
    "useYAxisScale",
    "validateBoxPlotSummary",
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

test("optional numeric shuffle preserves exact SSR/default text and arbitrary formatter nodes", () => {
  for (const Content of [Chart.TooltipContent, Chart.ScatterTooltipContent]) {
    for (const value of [0, -12.5, 0.125, null, Number.NaN, Number.POSITIVE_INFINITY]) {
      const props = { tooltip: tooltip([entry(value), entry(2, { graphicalItemId: "other" })]) };
      const plain = render(h(Root, { config }, h(Content, props)));
      const shuffle = render(
        h(Root, { config }, h(Content, { ...props, valueAnimation: "shuffle" })),
      );
      assert.equal(
        shuffle,
        plain,
        "SSR's reduced-motion snapshot must preserve exact final output",
      );
      assert.doesNotMatch(plain, /tooltip-number|valueAnimation/);
    }
    const props = {
      tooltip: tooltip([entry(12)], {
        formatter: () => [h("em", { "data-custom": "value" }, "Twelve"), "Custom"],
      }),
      valueAnimation: "shuffle",
    };
    const html = render(h(Root, { config }, h(Content, props)));
    assert.match(html, /<em data-custom="value">Twelve<\/em>/);
    assert.doesNotMatch(html, /tooltip-number|valueAnimation/);
  }
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

const scatterContent = (payload, extra = {}, root = {}) =>
  render(
    h(
      Root,
      {
        config: {
          alpha: { label: "Alpha", color: "purple" },
          x: { label: "Latency", color: "gray", formatValue: (v) => `${v} ms` },
        },
        ...root,
      },
      h(Chart.ScatterTooltipContent, {
        tooltip: tooltip(payload, extra),
        pointLabel: (row) => row.id,
      }),
    ),
  );
test("scatter dimensions keep point identity, signed and zero values, native units and formatters", () => {
  const payload = [
    entry(0, { dataKey: "x", graphicalItemId: "alpha", payload: { id: "point-a" } }),
    entry(-8, {
      dataKey: "y",
      name: "Change",
      unit: "%",
      graphicalItemId: "alpha",
      payload: { id: "point-a" },
    }),
  ];
  const html = scatterContent(payload);
  assert.match(html, /point-a/);
  assert.match(html, /Latency/);
  assert.match(html, /0 ms/);
  assert.match(html, /-8%/);
  assert.doesNotMatch(html, /Monday/);
  assert.match(
    scatterContent(payload, { formatter: (v, name) => [`${v} units`, name] }),
    /0 units/,
  );
  assert.match(scatterContent(payload), /role="status"/);
  assert.doesNotMatch(scatterContent(payload, {}, { visibleSeries: [] }), /chart-tooltip/);
  assert.match(scatterContent(payload, {}, { visibleSeries: ["alpha"] }), /0 ms/);
});
test("scatter default content does not fabricate omitted dimensions or coerce missing into zero", () => {
  assert.doesNotMatch(
    scatterContent([
      entry(null, { dataKey: "x", graphicalItemId: "alpha", payload: { id: "missing" } }),
    ]),
    /chart-tooltip/,
  );
  const html = scatterContent([
    entry(1, { dataKey: "x", graphicalItemId: "alpha", payload: { id: "missing-size" } }),
    entry(null, { dataKey: "y", graphicalItemId: "alpha", payload: { id: "missing-size" } }),
  ]);
  assert.match(html, /No data/);
  assert.doesNotMatch(html, /data-dimension="z"/);
});

test("scatter explicit size mapping recovers zero/missing from raw records and honors custom missing content", () => {
  const show = (z, dataKey, extra = {}) =>
    render(
      h(
        Root,
        { config },
        h(Chart.ScatterTooltipContent, {
          tooltip: tooltip([
            entry(2, { dataKey: "x", payload: { size: z } }),
            entry(3, { dataKey: "y", payload: { size: z } }),
          ]),
          zDimension: { dataKey, name: "Volume", unit: " jobs" },
          ...extra,
        }),
      ),
    );
  assert.match(show(0, "size"), /0 jobs/);
  assert.match(show(null, "size"), /No data/);
  assert.match(show(undefined, "size", { missingValue: "Not measured" }), /Not measured/);
  assert.match(
    show(0, (row) => row.size),
    /0 jobs/,
  );
});

test("scatter raw size recovery preserves native nonzero Z after filterNull removes Y", () => {
  const html = render(
    h(
      Root,
      { config },
      h(Chart.ScatterTooltipContent, {
        tooltip: tooltip([
          entry(7, { dataKey: "x", payload: { size: 60 } }),
          entry(60, { dataKey: "size", name: "Volume", unit: " jobs", payload: { size: 60 } }),
        ]),
        zDimension: { dataKey: "size", name: "Volume", unit: " jobs" },
      }),
    ),
  );
  assert.equal((html.match(/60 jobs/g) || []).length, 1);
});

test("scatter nonzero function Z is not duplicated when Recharts wraps the accessor", () => {
  const original = (row) => row.size;
  const wrapped = (row) => original(row);
  const html = render(
    h(
      Root,
      { config },
      h(Chart.ScatterTooltipContent, {
        tooltip: tooltip([
          entry(7, { dataKey: "x", payload: { size: 60 } }),
          entry(60, { dataKey: wrapped, name: "Volume", unit: " jobs", payload: { size: 60 } }),
        ]),
        zDimension: { dataKey: original, name: "Volume", unit: " jobs" },
      }),
    ),
  );
  assert.equal((html.match(/60 jobs/g) || []).length, 1);
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

const summary = {
  lowerWhisker: -5,
  q1: -2,
  median: 0,
  q3: 3,
  upperWhisker: 8,
  outliers: [-10, 20, 20],
};
test("box summaries validate finite ordered values without selecting conventions", () => {
  assert.equal(Chart.validateBoxPlotSummary(summary), summary);
  assert.equal(Chart.validateBoxPlotSummary(null), null);
  assert.equal(Chart.validateBoxPlotSummary(undefined), null);
  assert.deepEqual(Chart.boxPlotExtent(summary), [-10, 20]);
  assert.deepEqual(
    Chart.boxPlotExtent({ lowerWhisker: 0, q1: 0, median: 0, q3: 0, upperWhisker: 0 }),
    [0, 0],
  );
  for (const field of ["lowerWhisker", "q1", "median", "q3", "upperWhisker"]) {
    for (const invalid of [undefined, null, NaN, Infinity, -Infinity, "3"]) {
      assert.throws(
        () => Chart.validateBoxPlotSummary({ ...summary, [field]: invalid }),
        /finite number/,
      );
    }
  }
  for (const invalid of ["1", [], 1]) assert.throws(() => Chart.validateBoxPlotSummary(invalid));
  assert.throws(() => Chart.validateBoxPlotSummary({ ...summary, q1: 1 }), /requires/);
  assert.throws(() => Chart.validateBoxPlotSummary({ ...summary, upperWhisker: 2 }), /requires/);
  for (const outliers of [[0], [-5], [8], [NaN], [Infinity], [null], "invalid"]) {
    assert.throws(() => Chart.validateBoxPlotSummary({ ...summary, outliers }), /outliers/);
  }
});
test("box SVG primitive preserves numeric geometry, zero IQR and native attributes", () => {
  const svg = renderSvg(
    h(Chart.BoxPlotMark, {
      coordinates: summary,
      center: 30,
      size: 20,
      "aria-label": "distribution",
      className: "custom",
    }),
  );
  assert.match(svg, /data-box-part="box"[^>]*x="20"[^>]*y="-2"[^>]*width="20"[^>]*height="5"/);
  assert.match(svg, /data-box-part="median"[^>]*y1="0"/);
  assert.match(svg, /aria-label="distribution"/);
  assert.equal((svg.match(/data-box-part="outlier"/g) ?? []).length, 3);
  const collapsed = renderSvg(
    h(Chart.BoxPlotMark, {
      coordinates: { lowerWhisker: 0, q1: 0, median: 0, q3: 0, upperWhisker: 0 },
      center: 10,
      size: 8,
      orientation: "horizontal",
    }),
  );
  assert.match(collapsed, /data-box-part="box"[^>]*width="0"/);
  assert.match(collapsed, /data-box-part="collapsed-box"/);
});

test("box materials retain native geometry and consumer filter ownership, including collapsed marks", () => {
  const attrs = {
    coordinates: summary,
    center: 30,
    size: 20,
    fillOpacity: 0,
    strokeDasharray: "4 2",
    clipPath: "url(#clip)",
    mask: "url(#mask)",
    visibility: "hidden",
  };
  const plain = renderSvg(h(Chart.BoxPlotMark, attrs));
  const geometry = (svg) =>
    [...svg.matchAll(/<(?:rect|line|circle)\b[^>]*>/g)].map((match) => match[0]);
  for (const material of ["paper", "clay", "glow"]) {
    const svg = renderSvg(h(Chart.BoxPlotMark, { ...attrs, material, filter: undefined }));
    assert.match(svg, /data-kind-ui="box-plot-mark"[^>]*filter="url\(#kind-ui-box-/);
    assert.deepEqual(geometry(svg), geometry(plain));
    assert.match(svg, /filterUnits="userSpaceOnUse"/);
    assert.match(svg, /fill-opacity="0"/);
    assert.match(svg, /visibility="hidden"/);
    for (const override of [{ filter: "none" }, { style: { filter: "none" } }]) {
      assert.doesNotMatch(
        renderSvg(h(Chart.BoxPlotMark, { ...attrs, material, ...override })),
        /data-kind-ui="box-material"/,
      );
    }
    const collapsed = renderSvg(
      h(Chart.BoxPlotMark, {
        material,
        coordinates: { lowerWhisker: 0, q1: 0, median: 0, q3: 0, upperWhisker: 0 },
        center: 4,
        size: 0.5,
      }),
    );
    assert.match(collapsed, /data-box-part="collapsed-box"/);
    assert.match(collapsed, /width="0.5"[^>]*height="0"/);
  }
});

test("heatmap explicit domains preserve signed, zero, missing and ordering", () => {
  const model = Chart.createHeatmapModel({
    rows: ["B", "A"],
    columns: ["Y", "X"],
    data: [
      { row: "A", column: "X", value: 0 },
      { row: "B", column: "Y", value: -5 },
      { row: "A", column: "Y", value: null },
    ],
  });
  assert.deepEqual(
    model.cells.map((row) => row.map((cell) => cell.value)),
    [
      [-5, null],
      [null, 0],
    ],
  );
  assert.equal(model.cells[0][1].sources.length, 0);
  assert.equal(model.cells[1][0].sources.length, 1);
  assert.equal(Chart.createHeatmapModel({ rows: [], columns: ["X"], data: [] }).cells.length, 0);
});
test("heatmap duplicate policies, invalid coordinates and nonfinite input", () => {
  const base = {
    rows: ["A"],
    columns: ["X"],
    data: [null, -2, 2].map((value) => ({ row: "A", column: "X", value })),
  };
  assert.throws(() => Chart.createHeatmapModel(base), /Duplicate/);
  assert.equal(Chart.createHeatmapModel({ ...base, duplicates: "first" }).cells[0][0].value, null);
  assert.equal(Chart.createHeatmapModel({ ...base, duplicates: "last" }).cells[0][0].value, 2);
  assert.equal(Chart.createHeatmapModel({ ...base, duplicates: "sum" }).cells[0][0].value, 0);
  assert.equal(
    Chart.createHeatmapModel({ ...base, duplicates: "sum", data: base.data.slice(0, 1) })
      .cells[0][0].value,
    null,
  );
  assert.throws(() => Chart.createHeatmapModel({ ...base, rows: ["A", "A"] }), /unique/);
  assert.throws(() => Chart.createHeatmapModel({ ...base, columns: ["Y"] }), /outside/);
  for (const value of [NaN, Infinity, undefined])
    assert.throws(
      () => Chart.createHeatmapModel({ ...base, data: [{ row: "A", column: "X", value }] }),
      /finite/,
    );
  assert.throws(
    () =>
      Chart.createHeatmapModel({
        ...base,
        duplicates: "sum",
        data: [Number.MAX_VALUE, Number.MAX_VALUE].map((value) => ({
          row: "A",
          column: "X",
          value,
        })),
      }),
    /finite/,
  );
});
test("heatmap quantitative scale clamps, interpolates and handles constant zero", () => {
  const scale = Chart.createHeatmapScale({ domain: [-1, 1], colors: ["#000000", "#ffffff"] });
  assert.equal(scale.color(-10), "#000000");
  assert.equal(scale.color(0), "#808080");
  assert.equal(scale.color(10), "#ffffff");
  assert.equal(
    Chart.createHeatmapScale({ domain: [0, 0], colors: scale.colors }).color(0),
    "#808080",
  );
  for (const domain of [
    [1, -1],
    [0, Infinity],
    [-Number.MAX_VALUE, Number.MAX_VALUE],
  ])
    assert.throws(() => Chart.createHeatmapScale({ domain, colors: scale.colors }), /domain/);
  assert.throws(
    () => Chart.createHeatmapScale({ domain: [0, 1], colors: ["red", "transparent"] }),
    /opaque/,
  );
  assert.throws(() => scale.color(NaN), /finite/);
});
test("heatmap public components compose native grid, numeric legend and static alternative", () => {
  const markup = render(
    h(
      Chart.HeatmapChart,
      {
        rows: ["A"],
        columns: ["X", "Y"],
        data: [{ row: "A", column: "X", value: 0 }],
        scale: Chart.createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] }),
      },
      h(Chart.HeatmapGrid, { caption: "Example" }),
      h(Chart.HeatmapLegend, { label: "Count" }),
      h(Chart.HeatmapTooltip),
      h(Chart.HeatmapDataTable, { caption: "Data" }),
    ),
  );
  assert.match(markup, /role="grid"/);
  assert.match(markup, /aria-label="A, X: 0"/);
  assert.match(markup, /aria-label="A, Y: Missing"/);
  assert.match(markup, /data-missing="true"/);
  assert.match(markup, /data-kind-ui="heatmap-data-table"/);
  assert.throws(
    () => render(h(Chart.HeatmapGrid, { caption: "No provider" })),
    /require HeatmapChart/,
  );
});
const Icon = () => h("svg", { "data-icon": "task" }, h("title", {}, "Decorative task"));
const iconConfig = { ...config, count: { ...config.count, icon: Icon } };
const optionContent = (options = {}, extra = {}) =>
  render(
    h(
      Root,
      { config: iconConfig },
      h(TooltipContent, { tooltip: tooltip([entry(0)], extra), ...options }),
    ),
  );
test("tooltip icon takes precedence; hiding decoration preserves value and live feedback", () => {
  for (const indicator of ["dot", "line", "dashed"]) {
    const html = optionContent({ indicator });
    assert.match(html, /aria-hidden="true" data-kind-ui="chart-icon"/);
    assert.match(html, /data-icon="task"/);
    assert.doesNotMatch(html, /data-kind-ui="chart-indicator"/);
    assert.match(html, /0 tasks/);
  }
  const hidden = optionContent({ hideIndicator: true, hideLabel: true });
  assert.doesNotMatch(
    hidden,
    /data-kind-ui="chart-icon"|data-kind-ui="chart-indicator"|chart-tooltip-label/,
  );
  assert.match(hidden, /role="status"/);
  assert.match(hidden, /Tasks/);
  assert.match(hidden, /0 tasks/);
  assert.doesNotMatch(hidden, /hideLabel=|hideIndicator=|indicator=/);
});
test("indicator choices, missing/unknown metadata and header formatters remain independent", () => {
  for (const indicator of ["dot", "line", "dashed"]) {
    const html = render(
      h(Root, { config }, h(TooltipContent, { tooltip: tooltip([entry(0)]), indicator })),
    );
    assert.match(html, new RegExp(`data-indicator="${indicator}"`));
    assert.match(html, /aria-hidden="true"/);
  }
  assert.match(content([entry(0)]), /data-indicator="line"/);
  assert.match(optionContent({}, { labelFormatter: () => "Formatted day" }), /Formatted day/);
  assert.doesNotMatch(
    optionContent(
      { hideLabel: true },
      {
        labelFormatter: () => {
          throw new Error("Hidden heading must not format");
        },
      },
    ),
    /chart-tooltip-label/,
  );
  assert.match(
    optionContent({}, { formatter: () => ["Formatted zero", "Tuple label"] }),
    /Tuple label/,
  );
  assert.doesNotMatch(optionContent({}, { formatter: () => null }), /chart-tooltip/);
});
test("legend icon fallback and composed noninteractive contents retain controlled semantics", () => {
  const legend = (props = {}, root = {}) =>
    render(h(Root, { config: iconConfig, ...root }, h(Legend, props)));
  assert.match(legend(), /data-icon="task"/);
  assert.doesNotMatch(legend({ hideIcon: true }), /data-icon="task"/);
  assert.match(legend({ hideIcon: true }), /chart-indicator/);
  const html = legend(
    {
      children: ({ key, label, visible, marker }) =>
        h("span", {}, marker, `${key}: ${label} ${visible ? "Shown" : "Hidden"}`),
    },
    { visibleSeries: [], onVisibleSeriesChange() {} },
  );
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /count: Tasks Hidden/);
  assert.equal((html.match(/<button/g) ?? []).length, 1);
  assert.doesNotMatch(html, /hideIcon=/);
});
test("category itemKey resolves icon, formatting, zero and hidden state together", () => {
  const category = entry(0, { dataKey: "amount", payload: { category: "count" } });
  const props = {
    tooltip: tooltip([category]),
    itemKey: (entry) => entry.payload.category,
    indicator: "dashed",
  };
  const html = render(
    h(Root, { config: iconConfig, visibleSeries: ["count"] }, h(TooltipContent, props)),
  );
  assert.match(html, /data-series="count"/);
  assert.match(html, /data-icon="task"/);
  assert.match(html, /0 tasks/);
  assert.doesNotMatch(
    render(h(Root, { config: iconConfig, visibleSeries: [] }, h(TooltipContent, props))),
    /chart-tooltip/,
  );
});

test("presentation options preserve unknown native colors and mixed missing/zero entries", () => {
  const payload = [
    entry(0, { dataKey: "unknown", name: "Native", color: "rebeccapurple" }),
    entry(null),
  ];
  const markup = render(
    h(
      Root,
      { config: iconConfig },
      h(TooltipContent, { tooltip: tooltip(payload), indicator: "dashed" }),
    ),
  );
  assert.match(markup, /data-indicator="dashed"/);
  assert.match(markup, /--kind-ui-chart-indicator-color:rebeccapurple/);
  assert.match(markup, /data-icon="task"/);
  assert.match(markup, /No data/);
  assert.match(markup, />0</);
  const hidden = render(
    h(
      Root,
      { config: iconConfig },
      h(TooltipContent, { tooltip: tooltip(payload), hideIndicator: true }),
    ),
  );
  assert.doesNotMatch(hidden, /chart-icon|chart-indicator/);
  assert.match(hidden, /No data/);
  assert.match(hidden, />0</);
});

test("waterfall arithmetic preserves directed endpoints, zero, crossing and checkpoints", () => {
  const entry = (id, kind, value) => ({
    id,
    label: id,
    kind,
    ...(kind === "subtotal" ? {} : { value }),
  });
  const raw = [
    entry("start", "start", 10),
    entry("gain", "delta", 5),
    entry("loss", "delta", -20),
    entry("net", "subtotal"),
    entry("zero", "delta", 0),
    entry("end", "end", -5),
  ];
  const rows = Chart.computeWaterfallData(raw);
  assert.deepEqual(
    rows.map((row) => row.range),
    [
      [0, 10],
      [10, 15],
      [-5, 15],
      [-5, 0],
      [-5, -5],
      [-5, 0],
    ],
  );
  assert.deepEqual(
    rows.map((row) => row.balance),
    [10, 15, -5, -5, -5, -5],
  );
  assert.equal(rows[2].start, 15);
  assert.equal(rows[2].end, -5);
  assert.equal(raw[3].value, undefined);
  assert.deepEqual(Chart.computeWaterfallData([]), []);
  assert.equal(Chart.computeWaterfallData([entry("a", "delta", 0)])[0].balance, 0);
  assert.equal(Chart.computeWaterfallData([entry("a", "delta", 5)], null)[0].range, null);
});
test("waterfall missing changes propagate uncertainty and explicit totals recover", () => {
  const rows = Chart.computeWaterfallData([
    { id: "a", label: "a", kind: "delta", value: null },
    { id: "b", label: "b", kind: "delta", value: 5 },
    { id: "c", label: "c", kind: "subtotal" },
    { id: "d", label: "d", kind: "total", value: -10 },
    { id: "e", label: "e", kind: "delta", value: 10 },
  ]);
  assert.deepEqual(
    rows.map((row) => row.range),
    [null, null, null, [-10, 0], [-10, 0]],
  );
  assert.equal(rows[1].value, 5);
  assert.equal(rows[4].balance, 0);
});
test("waterfall rejects invalid values, identities, kinds and overflow", () => {
  const base = { id: "a", label: "a", kind: "delta", value: 1 };
  for (const value of [undefined, NaN, Infinity, "1"])
    assert.throws(() => Chart.computeWaterfallData([{ ...base, value }]));
  assert.throws(() => Chart.computeWaterfallData([base, base]), /unique/);
  assert.throws(() => Chart.computeWaterfallData([{ ...base, id: "" }]), /unique/);
  assert.throws(() => Chart.computeWaterfallData([{ ...base, kind: "other" }]), /kind/);
  assert.throws(() => Chart.computeWaterfallData([{ ...base, kind: "subtotal" }]), /subtotals/);
  assert.throws(
    () => Chart.computeWaterfallData([{ ...base, value: Number.MAX_VALUE }], Number.MAX_VALUE),
    /overflow/,
  );
  assert.throws(() => Chart.computeWaterfallData([], NaN), /initialBalance/);
  for (const key of ["stackId", "minPointSize", "dataKey", "data"])
    assert.throws(() => render(h(Chart.WaterfallSeries, { [key]: 0 })), /does not accept/);
});

const flowData = () => ({
  nodes: [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
    { id: "c", name: "C" },
  ],
  links: [
    { id: "ab", source: "a", target: "b", value: 10 },
    { id: "bc", source: 1, target: 2, value: 10 },
  ],
});
test("Sankey resolves explicit IDs and indices without mutating inputs", () => {
  const input = flowData();
  input.links.push({ id: "zero", source: 0, target: 2, value: 0 });
  const copy = structuredClone(input);
  const result = Chart.prepareSankeyData(input);
  assert.equal(result.links[0].source, 0);
  assert.equal(result.links[2].value, 0);
  assert.deepEqual(input, copy);
  assert.deepEqual(Chart.prepareSankeyData({ nodes: [], links: [] }), { nodes: [], links: [] });
});
test("Sankey rejects invalid identities, endpoints, missing values, overflow and totals", () => {
  for (const value of [NaN, Infinity, -1, undefined, null, "1"]) {
    const data = flowData();
    data.links[0].value = value;
    assert.throws(() => Chart.prepareSankeyData(data), /finite nonnegative/);
  }
  for (const endpoint of [-1, 3, 0.5, NaN, "missing", "0", undefined]) {
    const data = flowData();
    data.links[0].source = endpoint;
    assert.throws(() => Chart.prepareSankeyData(data), /endpoint/);
  }
  for (const kind of ["nodes", "links"]) {
    const data = flowData();
    data[kind][1].id = data[kind][0].id;
    assert.throws(() => Chart.prepareSankeyData(data), /Duplicate/);
    data[kind][1].id = " ";
    assert.throws(() => Chart.prepareSankeyData(data), /nonempty/);
  }
  const unbalanced = flowData();
  unbalanced.links[1].value = 9;
  assert.throws(() => Chart.prepareSankeyData(unbalanced), /Inconsistent.*explicit loss\/gain/);
  const overflow = flowData();
  overflow.links = [0, 1].map((i) => ({
    id: `flow${i}`,
    source: 0,
    target: 2,
    value: Number.MAX_VALUE,
  }));
  assert.throws(() => Chart.prepareSankeyData(overflow), /overflow/);
  const decimals = flowData();
  decimals.links[0].value = 0.1 + 0.2;
  decimals.links[1].value = 0.3;
  assert.doesNotThrow(() => Chart.prepareSankeyData(decimals));
});
test("Sankey rejects self and multi-node cycles including measured zero", () => {
  for (const value of [0, 10]) {
    const data = flowData();
    data.links.forEach((link) => {
      link.value = value;
    });
    data.links.push({ id: "ca", source: 2, target: 0, value });
    assert.throws(() => Chart.prepareSankeyData(data), /cycles/);
    data.links = [{ id: "self", source: 0, target: 0, value }];
    assert.throws(() => Chart.prepareSankeyData(data), /cycles/);
  }
});
test("Sankey table retains measured zero and escapes labels; empty chart skips native layout", () => {
  const data = {
    nodes: [
      { id: "a", name: "<A>" },
      { id: "b", name: "B" },
    ],
    links: [{ id: "zero", source: "a", target: "b", value: 0 }],
  };
  const table = render(
    h(Chart.SankeyTable, {
      data,
      caption: "All flows",
      onInspect: () => {},
      activeLinkId: "zero",
      formatValue: (v) => `${v} MWh`,
    }),
  );
  assert.match(table, /&lt;A&gt;/);
  assert.match(table, /0 MWh/);
  assert.match(table, /aria-pressed="true"/);
  assert.match(table, /scope="row"/);
  assert.match(
    render(h(Chart.SankeyChart, { data, width: 200, height: 100 })),
    /No positive flows/,
  );
  assert.throws(
    () =>
      render(h(Chart.SankeyChart, { data: { ...data, links: [{ ...data.links[0], value: -1 }] } })),
    /finite nonnegative/,
  );
});
test("Sankey finishes keep computed curve and width even with competing presentation", () => {
  const props = {
    sourceX: 0,
    targetX: 100,
    sourceY: 20,
    targetY: 50,
    sourceControlX: 40,
    targetControlX: 60,
    sourceRelativeY: 0,
    targetRelativeY: 0,
    linkWidth: 7,
    index: 0,
    payload: {},
  };
  for (const finish of ["plain", "paper", "clay", "glow"])
    for (const material of ["solid", "gradient"]) {
      const markup = renderSvg(
        h(Chart.SankeyLink, {
          ...props,
          material,
          finish,
          pathProps: { strokeWidth: 99, style: { strokeWidth: 99 }, d: "M0,0" },
        }),
      );
      assert.match(markup, /stroke-width="7"/);
      assert.match(markup, /style="stroke-width:7"/);
      assert.match(markup, /M0,20C40,20 60,50 100,50/);
      assert.match(markup, /fill="none"/);
    }
});

test("Sankey keeps parallel identities in validation but rejects native equal-value key collisions", () => {
  const data = {
    nodes: [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ],
    links: [
      { id: "one", source: 0, target: 1, value: 5 },
      { id: "two", source: 0, target: 1, value: 5 },
    ],
  };
  assert.equal(Chart.prepareSankeyData(data).links.length, 2);
  assert.throws(() => render(h(Chart.SankeyChart, { data })), /equal-value parallel/);
  assert.doesNotThrow(() => render(h(Chart.SankeyTable, { data, caption: "Parallel flows" })));
  for (const duration of [-1, Infinity, NaN]) {
    assert.throws(
      () =>
        render(
          h(Chart.SankeyChart, {
            data: { nodes: [], links: [] },
            animate: { revealDurationMs: duration },
          }),
        ),
      /finite and nonnegative/,
    );
  }
});

test("Sankey explicit filters own surfaces and plain nodes retain direct rectangles", () => {
  const node = { x: 10, y: 20, width: 14, height: 50, index: 0, payload: {} };
  for (const finish of ["paper", "clay", "glow"]) {
    for (const rectProps of [{ filter: "url(#custom)" }, { style: { filter: "none" } }]) {
      const markup = renderSvg(h(Chart.SankeyNode, { ...node, finish, rectProps }));
      assert.doesNotMatch(markup, /<filter/);
      assert.match(markup, /width="14"/);
      assert.match(markup, /height="50"/);
    }
  }
  assert.match(renderSvg(h(Chart.SankeyNode, node)), /^<rect/);
});

test("Sankey undefined filters retain generated finishes and wide node strokes retain bounds", () => {
  for (const finish of ["paper", "clay", "glow"]) {
    const markup = renderSvg(
      h(Chart.SankeyNode, {
        x: 10,
        y: 20,
        width: 14,
        height: 50,
        index: 0,
        payload: {},
        finish,
        filter: undefined,
        rectProps: { filter: undefined, strokeWidth: 10 },
      }),
    );
    assert.match(markup, /<rect[^>]*filter="url\(#/);
    assert.match(markup, /x="-100%" y="-100%" width="300%" height="300%"/);
    const link = renderSvg(
      h(Chart.SankeyLink, {
        sourceX: 0,
        sourceY: 20,
        targetX: 100,
        targetY: 50,
        sourceControlX: 40,
        targetControlX: 60,
        sourceRelativeY: 0,
        targetRelativeY: 0,
        linkWidth: 7,
        index: 0,
        payload: {},
        finish,
        filter: undefined,
        pathProps: { filter: undefined },
      }),
    );
    assert.match(link, /<path[^>]*filter="url\(#/);
  }
});

test("heatmap materials decorate measured cells only and retain custom content/styles", () => {
  for (const material of ["plain", "paper", "clay", "glow"]) {
    const markup = render(
      h(
        Chart.HeatmapChart,
        {
          rows: ["A"],
          columns: ["X", "Y"],
          data: [{ row: "A", column: "X", value: 0 }],
          scale: Chart.createHeatmapScale({ domain: [-1, 1], colors: ["#000000", "#ffffff"] }),
        },
        h(Chart.HeatmapGrid, {
          caption: "Materials",
          material,
          Cell: ({ formattedValue }) => h("b", {}, formattedValue),
          cellProps: () => ({
            style: { filter: "brightness(1)", backgroundImage: "none" },
            "data-host": "yes",
          }),
        }),
      ),
    );
    assert.equal((markup.match(new RegExp(`data-material="${material}"`, "g")) ?? []).length, 1);
    assert.match(markup, /filter:brightness\(1\);background-image:none;background-color:#808080/);
    assert.match(markup, /<b>0<\/b>/);
    assert.match(markup, /aria-label="A, Y: Missing"/);
    assert.doesNotMatch(markup, / material=/);
  }
});

test("explicit native legend symbols retain icon/children priority and square fallback", () => {
  for (const shape of ["circle", "cross", "diamond", "square", "star", "triangle", "wye"]) {
    const symbolConfig = { count: { ...config.count, legendShape: shape } };
    const html = render(h(Root, { config: symbolConfig }, h(Legend)));
    assert.match(html, new RegExp(`data-legend-shape="${shape}"`));
    assert.match(html, /aria-hidden="true" focusable="false"/);
    assert.match(html, /<path[^>]*d="M/);
    const fallback = render(h(Root, { config: symbolConfig }, h(Legend, { hideIcon: true })));
    assert.doesNotMatch(fallback, /data-legend-shape|<svg/);
    assert.match(fallback, /chart-indicator/);
    const icon = render(
      h(Root, { config: { count: { ...symbolConfig.count, icon: Icon } } }, h(Legend)),
    );
    assert.match(icon, /data-icon="task"/);
    assert.doesNotMatch(icon, /data-legend-shape/);
    const custom = render(
      h(
        Root,
        { config: symbolConfig },
        h(Legend, {}, ({ label }) => h("span", { "data-custom-marker": true }, label)),
      ),
    );
    assert.match(custom, /data-custom-marker/);
    assert.doesNotMatch(custom, /data-legend-shape/);
    const tooltipHtml = render(
      h(Root, { config: symbolConfig }, h(TooltipContent, { tooltip: tooltip([entry(0)]) })),
    );
    assert.doesNotMatch(tooltipHtml, /data-legend-shape|<svg/);
    assert.match(tooltipHtml, /data-indicator="line"/);
  }
});

test("composition components and helpers preserve native identity", () => {
  for (const name of [
    "CartesianGrid",
    "XAxis",
    "YAxis",
    "ZAxis",
    "PolarGrid",
    "PolarAngleAxis",
    "PolarRadiusAxis",
    "ResponsiveContainer",
    "Cell",
    "Label",
    "LabelList",
    "BarStack",
    "ReferenceLine",
    "ReferenceDot",
    "ReferenceArea",
    "Brush",
    "ErrorBar",
    "Dot",
    "Curve",
    "Rectangle",
    "Sector",
    "Polygon",
    "Symbols",
    "AreaRevealShape",
    "LineDrawShape",
    "getRelativeCoordinate",
    "useChartHeight",
    "useChartWidth",
    "useXAxisScale",
    "useYAxisScale",
  ]) {
    // biome-ignore lint/performance/noDynamicNamespaceImportAccess: This test intentionally compares every public named export with its native registration.
    assert.equal(Chart[name], Native[name], `${name} must preserve registration and defaults`);
  }
});

test("Radar selection is SSR-safe without state glue and rejects ownerless controlled state", () => {
  const config = { value: { label: "Actual", color: "#3161bd" } };
  const props = {
    width: 400,
    height: 250,
    data: [{ category: "A", value: 10 }],
    selection: "series",
  };
  assert.doesNotThrow(() => render(h(Chart.Root, { config }, h(Chart.RadarChart, props))));
  assert.throws(
    () =>
      render(h(Chart.Root, { config }, h(Chart.RadarChart, { ...props, selectedSeries: "value" }))),
    /requires onSelectedSeriesChange for controlled selectedSeries/,
  );
  assert.doesNotThrow(() =>
    render(
      h(
        Chart.Root,
        { config },
        h(Chart.RadarChart, {
          ...props,
          selectedSeries: null,
          onSelectedSeriesChange: () => assert.fail("SSR must not emit selection changes"),
        }),
      ),
    ),
  );
});

test("heatmap compact controls retain caption, scoped associated headers and custom cell ownership", () => {
  const grid = (layout, extra = {}) =>
    render(
      h(
        Chart.HeatmapChart,
        {
          rows: ["A"],
          columns: ["X"],
          data: [{ row: "A", column: "X", value: 0 }],
          scale: Chart.createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] }),
        },
        h(Chart.HeatmapGrid, { caption: "Compact", layout, ...extra }),
      ),
    );
  const markup = grid(
    { cellSize: 12, gap: 0, rowLabels: "hidden", columnLabels: "hidden" },
    {
      Cell: ({ formattedValue }) => h("em", { "data-consumer": "cell" }, formattedValue),
      cellProps: () => ({ style: { height: 20, opacity: 0.5 }, className: "consumer-cell" }),
      style: { borderSpacing: 8 },
    },
  );
  assert.match(markup, /<caption>Compact<\/caption>/);
  assert.match(markup, /scope="row" id="([^"]+)">/);
  assert.match(markup, /scope="col"[^>]*id="([^"]+)">X/);
  const rowId = markup.match(/scope="row" id="([^"]+)"/)[1];
  const columnId = markup.match(/scope="col"[^>]*id="([^"]+)"/)[1];
  assert.ok(markup.includes(`headers="${rowId} ${columnId}"`));
  assert.match(markup, /--heatmap-cell-size:12px/);
  assert.match(markup, /--heatmap-gap:0px/);
  assert.match(markup, /data-row-labels="hidden"/);
  assert.match(markup, /data-column-labels="hidden"/);
  assert.match(markup, /border-spacing:8px/);
  assert.match(markup, /height:20px;opacity:0.5;background-color:#ffffff/);
  assert.match(markup, /class="consumer-cell"/);
  assert.match(markup, /<em data-consumer="cell">0<\/em>/);
  assert.doesNotMatch(
    grid(undefined),
    /data-cell-sizing|data-row-labels|data-column-labels|--heatmap-cell-size/,
  );
  assert.match(
    grid({ cellSize: "1rem", gap: "0.25rem" }),
    /--heatmap-cell-size:1rem;--heatmap-gap:0.25rem/,
  );
  for (const cellSize of [0, -1, NaN, Infinity])
    assert.throws(() => grid({ cellSize }), /cellSize.*finite.*positive/);
  for (const gap of [-1, NaN, Infinity])
    assert.throws(() => grid({ gap }), /gap.*finite.*nonnegative/);
});

test("category mode rejects missing data and unconfigured identities", () => {
  const config = { alpha: { label: "Alpha", color: "red" } };
  for (const props of [
    { categoryKey: "id", dataKey: "value" },
    { categoryKey: "id", dataKey: "value", data: [{ id: "missing", value: 1 }] },
  ])
    assert.throws(
      () => render(h(Root, { config }, h(Chart.PieSeries, props))),
      /explicit data|Root.config/,
    );
  assert.throws(
    () => render(h(Root, { config }, h(Chart.RadialBarChart, { categoryKey: "id" }))),
    /explicit chart data/,
  );
});
test("Sankey node metadata uses arbitrary IDs and preserves standalone legacy/explicit paint", () => {
  const config = { "node / a": { label: "Input", color: "#123456" } };
  const legend = render(h(Chart.SankeyLegend, { config }));
  assert.match(legend, /data-node="node \/ a"/);
  assert.match(legend, /--kind-ui-chart-indicator-color:#123456/);
  const props = {
    x: 0,
    y: 0,
    width: 10,
    height: 20,
    index: 0,
    payload: { id: "node / a", name: "Input", value: 1 },
  };
  assert.match(renderSvg(h(Chart.SankeyNode, props)), /fill="#4f46e5"/);
  assert.match(renderSvg(h(Chart.SankeyNode, { ...props, color: "#abcdef" })), /fill="#abcdef"/);
  assert.throws(
    () =>
      render(
        h(Chart.SankeyChart, {
          nodeConfig: config,
          data: { nodes: [{ id: "unknown", name: "Other" }], links: [] },
        }),
      ),
    /requires metadata/,
  );
});

test("missing config labels share inference across public legends and tooltip content", () => {
  const cases = [
    ["visitors", "Visitors"],
    ["monthlyVisitors", "Monthly visitors"],
    ["HTTPRequests", "Http requests"],
    ["monthly_visitors", "Monthly visitors"],
    ["monthly-visitors", "Monthly visitors"],
    ["visitors2026Total", "Visitors2026 total"],
    ["explicitLabel", "CUSTOM label", "CUSTOM label"],
    ["emptyLabel", "", ""],
  ];
  for (const [key, expected, label] of cases) {
    const meta = Object.freeze({ color: "#123456", ...(label !== undefined ? { label } : {}) });
    const inferred = Object.freeze({ [key]: meta });
    let rendered;
    const html = render(
      h(
        Root,
        { config: inferred, visibleSeries: [key] },
        h(Legend, null, (item) => {
          rendered = item;
          return item.label;
        }),
        h(TooltipContent, { tooltip: tooltip([entry(0, { dataKey: key, name: "Native name" })]) }),
        h(Chart.ScatterTooltipContent, {
          tooltip: tooltip([entry(0, { dataKey: key, name: "Native name" })]),
        }),
      ),
    );
    assert.equal(rendered.key, key);
    assert.equal(rendered.label, expected);
    assert.equal(rendered.visible, true);
    assert.ok(html.includes(`--color-${key}:#123456`));
    assert.ok(html.includes(`data-series="${key}"`));
    assert.ok(html.includes(`<span>${expected}</span>`));
    assert.doesNotMatch(html, /Native name/);
    assert.match(html, /role="status" aria-live="assertive"/);
    for (const Content of [TooltipContent, Chart.ScatterTooltipContent]) {
      const tip = render(
        h(
          Root,
          { config: inferred },
          h(Content, {
            tooltip: tooltip([entry(0, { dataKey: key, name: "Native name" })]),
          }),
        ),
      );
      assert.ok(tip.includes(`<span>${expected}</span>`));
      assert.doesNotMatch(tip, /Native name/);
    }
    assert.equal(inferred[key], meta);
    assert.equal(meta.label, label);
  }
});

test("inferred metadata retains formatter, item identity and unmatched fallback contracts", () => {
  const inferred = { visitors: { color: "red", formatValue: (value) => `${value} visits` } };
  const renderTip = (payload, extra = {}) =>
    render(
      h(
        Root,
        { config: inferred },
        h(TooltipContent, { tooltip: tooltip(payload, extra), itemKey: () => "visitors" }),
      ),
    );
  assert.match(renderTip([entry(0)]), /Visitors.*0 visits/);
  const formatted = renderTip([entry(1)], {
    formatter: () => [h("em", null, "one"), h("b", null, "Override")],
  });
  assert.match(formatted, /<b>Override<\/b>/);
  assert.match(formatted, /<em>one<\/em>/);
  const unmatched = render(
    h(
      Root,
      { config: inferred },
      h(TooltipContent, {
        tooltip: tooltip([entry(2, { name: "Native unmatched", color: "blue" })]),
      }),
    ),
  );
  assert.match(unmatched, /Native unmatched/);
  assert.match(unmatched, /indicator-color:blue/);
  assert.throws(
    () => render(h(Root, { config: { 2026: { color: "red" } } }, h(Legend))),
    /must start with a letter/,
  );
});

test("pattern swatches use independent SVG resources and all public encodings", () => {
  const html = render(
    h(
      Root,
      {
        config: {
          a: { color: "#123456", pattern: { kind: "hatch" } },
          b: { color: "#654321", pattern: { kind: "stripe", width: 3 } },
          c: { color: "pink", pattern: { kind: "duotone", color: "white", angle: 90 } },
        },
      },
      h(Legend),
      h(Chart.FillPatternSwatch, { pattern: { kind: "hatch" }, color: "red", "data-host": "yes" }),
    ),
  );
  const ids = [...html.matchAll(/<pattern id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 4);
  assert.equal(new Set(ids).size, 4);
  for (const id of ids) assert.ok(html.includes(`fill="url(#${id})"`));
  assert.match(html, /data-host="yes"/);
  assert.match(html, /fill="var\(--color-a\)"/);
  assert.match(html, /patternTransform="rotate\(90\)"/);
  assert.match(html, /aria-hidden="true"/);
  assert.doesNotMatch(html, /<animate|<filter/);
});

test("legend glyph/symbol priority and hideIcon remain consumer-owned with patterns", () => {
  const config = {
    a: { color: "red", pattern: { kind: "hatch" }, icon: () => h("i", null, "Icon") },
    b: { color: "blue", pattern: { kind: "stripe" }, legendShape: "diamond" },
  };
  assert.doesNotMatch(render(h(Root, { config }, h(Legend))), /<pattern/);
  assert.doesNotMatch(
    render(h(Root, { config }, h(Legend, { hideIcon: true }))),
    /<pattern|Icon|data-legend-shape/,
  );
});

test("invalid public pattern geometry fails explicitly", () => {
  for (const pattern of [
    { kind: "unknown" },
    { kind: "hatch", size: 0 },
    { kind: "stripe", width: -1 },
    { kind: "hatch", size: 4, width: 5 },
    { kind: "duotone", angle: Infinity },
  ]) {
    assert.throws(
      () => render(h(Chart.FillPatternSwatch, { pattern, color: "red" })),
      /FillPattern requires/,
    );
  }
});

test("series colors compile theme stops without changing labels or pattern metadata", () => {
  const html = render(
    h(
      Root,
      {
        config: {
          revenueTotal: {
            color: { light: ["var(--ink)", "blue"], dark: ["white", "gray", "black"] },
            pattern: { kind: "hatch" },
          },
          solid: { color: "tomato" },
          one: { color: ["purple"] },
        },
      },
      h(Legend),
    ),
  );
  assert.match(html, /--color-solid:tomato/);
  assert.match(html, /--color-one:purple/);
  assert.match(html, /--color-revenueTotal:light-dark\(var\(--ink\), white\)/);
  assert.match(html, /color-mix\(in srgb, var\(--ink\) 50%, blue 50%\), gray/);
  assert.match(html, /offset="0.5"/);
  assert.match(html, /Revenue total/);
  assert.match(html, /data-pattern="hatch"/);
  assert.equal((html.match(/<linearGradient /g) ?? []).length, 1);
  assert.match(html, /fill="var\(--color-revenueTotal\)"/);
});

test("color resources are unique across sibling Roots and stable on SSR", () => {
  const tree = h(
    "main",
    null,
    ...[0, 1].map((key) =>
      h(
        Root,
        {
          key,
          config: { sales: { color: ["red", "blue"] } },
        },
        h(Legend),
      ),
    ),
  );
  const html = render(tree);
  const ids = [...html.matchAll(/<linearGradient[^>]*id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  assert.equal(render(tree), html);
  assert.match(html, /--kind-ui-series-[\w-]+-gradient:linear-gradient/);
});

test("malformed new color shapes fail before emitting resources", () => {
  for (const color of [
    [],
    ["red", null],
    Array(2),
    { light: "red" },
    { light: [], dark: "blue" },
    { light: "red", dark: "blue", extra: true },
    null,
    3,
  ]) {
    assert.throws(() => render(h(Root, { config: { sales: { color } } })), /[Ss]eries color/);
  }
});

test("color errors identify only the offending series and property", () => {
  for (const [color, path, guidance] of [
    [[], 'config["sales"].color', /nonempty string or nonempty array/],
    [" ", 'config["sales"].color', /nonempty color string/],
    [["red", null], 'config["sales"].color[1]', /nonempty color string/],
    [Array(2), 'config["sales"].color[0]', /nonempty color string/],
    [{ light: [], dark: "blue" }, 'config["sales"].color.light', /nonempty array/],
    [
      { light: "red", dark: ["blue", " "] },
      'config["sales"].color.dark[1]',
      /nonempty color string/,
    ],
    [{ light: "red" }, 'config["sales"].color', /both light and dark/],
    [
      { light: "red", dark: "blue", secret: "PRIVATE_VALUE" },
      'config["sales"].color',
      /no other fields/,
    ],
    [null, 'config["sales"].color', /nonempty string or nonempty array/],
  ]) {
    assert.throws(
      () =>
        render(
          h(Root, {
            config: {
              unrelated: { color: "purple", label: "PRIVATE_LABEL" },
              sales: { color, label: "PRIVATE_SERIES_LABEL" },
            },
          }),
        ),
      (error) => {
        assert.ok(error.message.includes(path));
        assert.match(error.message, guidance);
        assert.doesNotMatch(error.message, /PRIVATE_|unrelated|secret|purple|blue|red/);
        return true;
      },
    );
  }
});

test("color shape validation preserves CSS syntax during SSR", () => {
  for (const color of [
    "var(--brand, currentColor)",
    "currentColor",
    "oklch(60% 0.2 240)",
    "color(display-p3 1 0.5 0)",
    "color-mix(in oklch, red 30%, blue)",
  ]) {
    const html = render(h(Root, { config: { sales: { color } } }));
    assert.ok(html.includes(`--color-sales:${color}`));
  }
});

test("indexed stops cannot collide with valid legacy series keys", () => {
  const html = render(
    h(
      Root,
      {
        config: {
          sales: { color: ["red", "blue"] },
          "sales-0": { color: "green" },
          "sales-gradient": { color: "purple" },
        },
      },
      h(Legend),
    ),
  );
  assert.match(html, /--color-sales-0:green/);
  assert.match(html, /--color-sales-gradient:purple/);
  assert.match(html, /--kind-ui-series-73-61-6c-65-73-0:red/);
  assert.match(html, /--kind-ui-series-73-61-6c-65-73-gradient:linear-gradient/);
});

test("dots and lines share public swatch resources with existing patterns", () => {
  const html = render(
    h(
      Root,
      {
        config: {
          dots: { color: "red", pattern: { kind: "dots", size: 10, width: 4 } },
          lines: { color: "var(--theme-blue)", pattern: { kind: "lines" } },
        },
      },
      h(Legend),
    ),
  );
  assert.match(html, /<circle cx="5" cy="5" r="2" fill="CanvasText"/);
  assert.match(html, /data-pattern="lines"[^>]*patternTransform="rotate\(0\)"/);
  const ids = [...html.matchAll(/<pattern id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) assert.ok(html.includes(`fill="url(#${id})"`));
});

test("Root shared interaction guards last eligible item and emits one callback", () => {
  let interaction;
  const changes = [];
  function Probe() {
    interaction = Chart.useChartInteraction();
    return null;
  }
  render(
    h(
      Root,
      {
        config: { first: { color: "red" }, stale: { color: "blue" } },
        visibleSeries: ["first", "stale"],
        onVisibleSeriesChange: (next) => changes.push(next),
        interaction: { kind: "series", eligibleKeys: ["first"], markActivation: "matching-legend" },
      },
      h(Probe),
    ),
  );
  assert.equal(interaction.activate({ kind: "series", key: "first" }, "legend"), false);
  assert.deepEqual(changes, []);
  assert.equal(interaction.activate({ kind: "series", key: "stale" }, "mark"), false);
  assert.equal("register" in interaction, false);
});

test("shared focus is independent of emphasis and consumer before hook vetoes", () => {
  let interaction;
  const changes = [];
  function Probe() {
    interaction = Chart.useChartInteraction();
    return h("output", null, interaction.selected);
  }
  const config = { first: { color: "red" }, second: { color: "blue" } };
  const html = render(
    h(
      Root,
      {
        config,
        emphasis: "none",
        interaction: {
          kind: "series",
          mode: "focus",
          eligibleKeys: ["first", "second"],
          defaultSelected: "first",
          onSelectionChange: (next) => changes.push(next),
          onBeforeInteraction: (request) => request.event?.preventDefault(),
        },
      },
      h(Probe),
      h(Legend),
    ),
  );
  assert.equal(interaction.selected, "first");
  assert.match(html, /aria-pressed="true"/);
  const event = {
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
  assert.equal(interaction.activate({ kind: "series", key: "second" }, "legend", event), false);
  assert.deepEqual(changes, []);
  assert.equal(interaction.activate({ kind: "series", key: "first" }, "legend"), true);
  assert.deepEqual(changes, [null]);
});

test("controlled invalid focus paints null and selection controls reject conflicting owners", () => {
  let selected;
  function Probe() {
    selected = Chart.useChartInteraction().selected;
    return null;
  }
  const config = { first: { color: "red" }, second: { color: "blue" } };
  const props = {
    config,
    interaction: {
      kind: "series",
      mode: "focus",
      eligibleKeys: ["first"],
      selected: "second",
      onSelectionChange() {},
    },
  };
  render(h(Root, props, h(Probe)));
  assert.equal(selected, null);
  render(
    h(
      Root,
      { ...props, interaction: { ...props.interaction, eligibleKeys: ["first", "second"] } },
      h(Probe),
    ),
  );
  assert.equal(selected, "second");
  assert.throws(
    () =>
      render(h(Root, props, h(Chart.RadarChart, { width: 300, height: 200, selection: "series" }))),
    /one selection owner/,
  );
  assert.throws(
    () =>
      render(
        h(
          Root,
          { config, interaction: { ...props.interaction, defaultSelected: "first" } },
          h(Probe),
        ),
      ),
    /controlled and defaulted/,
  );
  assert.throws(
    () =>
      render(
        h(
          Root,
          { config, interaction: { ...props.interaction, onSelectionChange: undefined } },
          h(Probe),
        ),
      ),
    /change callback/,
  );
});
// These run both in workspace tests and the isolated packed public consumer.
test("custom backgrounds are reusable frozen definitions, with no shared registry", () => {
  const renderTile = ({ size, color }) => h("circle", { r: size / 4, fill: color });
  const a = Chart.defineChartBackgroundPattern(renderTile);
  const b = Chart.defineChartBackgroundPattern(renderTile);
  assert.notEqual(a, b);
  assert.ok(Object.isFrozen(a));
  assert.equal(a.render, renderTile);
  assert.match(renderSvg(a.render({ size: 16, color: "red", idPrefix: "local" })), /r="4"/);
  assert.throws(() => Chart.defineChartBackgroundPattern(null), /render function/);
});

test("background validation runs even before plot geometry is available", () => {
  for (const props of [
    { pattern: "unknown" },
    { pattern: null },
    { pattern: {} },
    { pattern: "waves", size: 0 },
    { pattern: "waves", size: Infinity },
    { pattern: "waves", opacity: -1 },
    { pattern: "waves", opacity: 1.1 },
    { pattern: "waves", opacity: NaN },
  ]) {
    assert.throws(
      () => renderSvg(h(Chart.ChartBackgroundPattern, props)),
      /ChartBackgroundPattern/,
    );
  }
  assert.equal(renderSvg(h(Chart.ChartBackgroundPattern, { pattern: "pinpoints" })), "");
});

test("tooltip projection status uses caller identity without changing values or labels", () => {
  const row = Object.freeze({ id: "forecast" });
  const projected = entry(0, { payload: row });
  const html = render(
    h(
      Root,
      { config: { value: { label: "Value", color: "red" } } },
      h(TooltipContent, {
        tooltip: tooltip([projected]),
        isProjected: (item) => item.payload.id === "forecast",
      }),
    ),
  );
  assert.match(html, /data-projected="true"/);
  assert.match(html, /projection-status">Projected/);
  assert.match(html, /chart-tooltip-value">0/);
  assert.equal(projected.payload, row);
  const observed = render(
    h(
      Root,
      { config: {} },
      h(TooltipContent, {
        tooltip: tooltip([entry(9, { payload: { id: "observed" } })]),
        isProjected: (item) => item.payload.id === "forecast",
      }),
    ),
  );
  assert.doesNotMatch(observed, /projection-status|data-projected/);
});

test("tooltip projection status respects missing, hidden and formatter ownership", () => {
  const props = { isProjected: () => true, projectedLabel: "Incomplete" };
  const content = (items, overrides = {}) =>
    render(
      h(
        Root,
        { config: {} },
        h(TooltipContent, {
          ...props,
          tooltip: { ...tooltip(items), ...overrides },
        }),
      ),
    );
  assert.doesNotMatch(
    content([entry(null, { payload: { id: "p" } })]),
    /chart-tooltip|projection-status/,
  );
  assert.doesNotMatch(
    content([entry(5, { hide: true, payload: { id: "p" } })]),
    /chart-tooltip|projection-status/,
  );
  assert.doesNotMatch(
    content([entry(5, { payload: { id: "p" } })], { formatter: () => null }),
    /chart-tooltip|projection-status/,
  );
  assert.match(content([entry(5, { payload: { id: "p" } })]), /Incomplete/);
  assert.doesNotMatch(content([entry(5, { payload: null })]), /projection-status/);
});

test("chart loading props stay off the native engine and expose a chart-owned status", () => {
  const html = render(
    h(
      Root,
      { config: { sales: { label: "Sales", color: "#123" } } },
      h(Chart.BarChart, {
        width: 320,
        height: 240,
        loading: true,
        loadingLabel: "Loading sales",
        "aria-label": "Sales",
      }),
    ),
  );
  assert.match(html, /aria-busy="true" aria-hidden="true" inert=""/);
  assert.match(html, /role="status" aria-atomic="true">Loading sales/);
  assert.match(html, /width:320px;height:240px/);
  assert.doesNotMatch(html, /loadingLabel=| loading="/);
  const empty = render(
    h(Chart.LineChart, {
      config: {},
      data: [],
      xDataKey: "month",
      loading: false,
      "aria-label": "Empty sales",
      height: 280,
    }),
  );
  assert.match(empty, /aria-busy="false"/);
  assert.match(empty, /role="status" aria-atomic="true"><\/span>/);
});

test("bar-backed charts inherit chart-owned loading without fabricating data", () => {
  for (const [Component, props] of [
    [Chart.WaterfallChart, { data: [] }],
    [Chart.BoxPlotChart, { data: [] }],
    [Chart.HistogramChart, { bins: [], measure: "count" }],
  ]) {
    const html = render(
      h(Root, { config: {} }, h(Component, { ...props, width: 320, height: 240, loading: true })),
    );
    assert.match(html, /kind-ui-loading-chart-pending/);
    assert.match(html, /Loading chart/);
    assert.match(html, /aria-busy="true"/);
  }
});

test("all fourteen chart families expose deterministic loading SSR without native prop leaks", () => {
  const scale = Chart.createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#112233"] });
  const families = [
    ["line", Chart.LineChart, { data: [] }],
    ["area", Chart.AreaChart, { data: [] }],
    ["bar", Chart.BarChart, { data: [] }],
    ["combo", Chart.ComboChart, { data: [] }],
    ["scatter", Chart.ScatterChart, { data: [] }],
    ["waterfall", Chart.WaterfallChart, { data: [] }],
    ["histogram", Chart.HistogramChart, { bins: [], measure: "count" }],
    ["box-plot", Chart.BoxPlotChart, { data: [] }],
    ["pie", Chart.PieChart, {}],
    ["radar", Chart.RadarChart, { data: [] }],
    ["radial-bar", Chart.RadialBarChart, { data: [] }],
    ["activity-rings", Chart.ActivityRings, { config: {}, rings: [] }],
    ["heatmap", Chart.HeatmapChart, { rows: [], columns: [], data: [], scale }],
    ["sankey", Chart.SankeyChart, { data: { nodes: [], links: [] } }],
  ];
  assert.equal(families.length, 14);
  for (const [family, Component, props] of families) {
    const view = (loading) => {
      const element = h(
        Component,
        {
          ...props,
          ...(family === "heatmap" ? {} : { width: 320, height: 240 }),
          loading,
          loadingLabel: `Loading ${family}`,
          "aria-label": `${family} data`,
        },
        ...(family === "heatmap" ? [h(Chart.HeatmapGrid, { caption: "Matrix" })] : []),
      );
      return family === "activity-rings" || family === "heatmap" || family === "sankey"
        ? element
        : h(Root, { config: {} }, element);
    };
    const pending = render(view(true));
    assert.equal(render(view(true)), pending, `${family}: deterministic server markup`);
    assert.match(pending, /aria-busy="true"/, `${family}: pending state`);
    assert.match(pending, /role="status"/, `${family}: status region`);
    assert.ok(pending.includes(`Loading ${family}`), `${family}: meaningful status text`);
    assert.doesNotMatch(
      pending,
      /\s(?:loading|loadingLabel|loadingSeed|loadingSkeleton)="/,
      `${family}: loading props consumed before native DOM`,
    );
    const ready = render(view(false));
    assert.match(ready, /aria-busy="false"/, `${family}: completion state`);
    assert.ok(!ready.includes(`Loading ${family}`), `${family}: status clears on completion`);
    assert.doesNotMatch(
      ready,
      /\sinert=""|kind-ui-loading-chart-pending/,
      `${family}: loaded empty data stays available`,
    );
  }
});

test("standalone SSR skeletons preserve family identity independently of real data and announce outside busy content", () => {
  const scale = Chart.createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#112233"] });
  const matrix = (data) =>
    h(
      Chart.HeatmapChart,
      {
        rows: ["Region"],
        columns: ["Month"],
        data,
        scale,
        loading: true,
        loadingLabel: "Loading matrix",
      },
      h(Chart.HeatmapGrid, { caption: "Matrix" }),
    );
  const flows = (links) =>
    h(Chart.SankeyChart, {
      data: {
        nodes: [
          { id: "a", name: "Source" },
          { id: "b", name: "Destination" },
        ],
        links,
      },
      width: 320,
      height: 240,
      loading: true,
      loadingLabel: "Loading flows",
    });
  const skeletons = [];
  for (const [family, empty, populated] of [
    ["heatmap", matrix([]), matrix([{ row: "Region", column: "Month", value: 1 }])],
    ["sankey", flows([]), flows([{ id: "ab", source: "a", target: "b", value: 7 }])],
  ]) {
    const html = render(empty);
    const skeleton = html.match(
      /<svg\b[^>]*data-kind-ui="chart-loading-skeleton"[\s\S]*?<\/svg>/,
    )?.[0];
    assert.ok(skeleton, `${family}: decorative surface is present on the server`);
    assert.match(skeleton, new RegExp(`data-family="${family}"`));
    assert.match(skeleton, /aria-hidden="true" focusable="false"/);
    assert.equal(
      render(populated).match(
        /<svg\b[^>]*data-kind-ui="chart-loading-skeleton"[\s\S]*?<\/svg>/,
      )?.[0],
      skeleton,
      `${family}: consumer values do not change the illustration`,
    );
    skeletons.push(skeleton);
    const ancestors = [];
    let statuses = 0;
    const voidTags = new Set(["col", "br", "hr", "input", "img", "meta", "link"]);
    // Walk these controlled fixtures to verify ancestry without depending on attribute order.
    for (const [tag, name] of html.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
      if (tag.startsWith("</")) {
        const index = ancestors.findLastIndex((ancestor) => ancestor.name === name);
        if (index >= 0) ancestors.length = index;
      } else {
        if (/\brole="status"/.test(tag)) {
          statuses++;
          assert.ok(
            ancestors.every((ancestor) => !ancestor.unavailable),
            `${family}: status has no busy, hidden or inert ancestor`,
          );
        }
        if (!voidTags.has(name) && !tag.endsWith("/>"))
          ancestors.push({
            name,
            unavailable: /\baria-(?:busy|hidden)="true"|\binert(?:=|\s|>)/.test(tag),
          });
      }
    }
    assert.match(html, /aria-busy="true"/);
    assert.equal(statuses, 1, `${family}: one loading announcement`);
  }
  assert.notEqual(skeletons[0], skeletons[1], "matrix and flow illustrations are distinct");
});

test("PointMarker retains native geometry and style while applying variant paint", () => {
  const html = renderSvg(
    h(Chart.PointMarker, {
      cx: 12,
      cy: 15,
      r: 7,
      variant: "colored-border",
      stroke: "red",
      fill: "gold",
      strokeWidth: 4,
      style: { fill: "gold" },
      "aria-label": "Value",
    }),
  );
  assert.match(html, /cx="12"/);
  assert.match(html, /r="7"/);
  assert.match(html, /style="fill:gold"/);
  assert.match(html, /stroke-width="2"/);
  assert.match(html, /aria-label="Value"/);
  assert.doesNotMatch(html, /<defs|<filter/);
  const native = renderSvg(h(Native.Dot, { cx: 2, cy: 3, r: 3 }));
  const plain = renderSvg(h(Chart.PointMarker, { cx: 2, cy: 3, r: 3 }));
  assert.equal(
    plain.replace(/ data-kind-ui="point-marker"| data-point-style="default"/g, ""),
    native,
  );
});

test("directional entrance options do not leak clip or configuration attributes into the SSR shell", () => {
  for (const Component of [Chart.LineChart, Chart.AreaChart, Chart.ComboChart]) {
    for (const revealDirection of ["left-to-right", "right-to-left", "center-out", "edges-in"]) {
      const html = renderSvg(
        h(
          Chart.Root,
          { config: {} },
          h(Component, {
            width: 300,
            height: 200,
            animate: { revealDirection },
          }),
        ),
      );
      assert.doesNotMatch(html, /data-reveal-direction|data-combo-reveal|data-area-reveal/);
      assert.doesNotMatch(html, /revealDirection=/);
    }
  }
});

test("dashed line and combo SSR retain the chart shell without leaking dash props", () => {
  const data = Object.freeze([Object.freeze({ value: 4 }), Object.freeze({ value: 8 })]);
  for (const Engine of [Chart.LineChart, Chart.ComboChart]) {
    const markup = render(
      h(
        Chart.Root,
        { config: { value: { label: "Value", color: "teal" } } },
        h(
          Engine,
          { width: 480, height: 240, data, animate: true },
          h(Chart.LineSeries, {
            dataKey: "value",
            strokeDasharray: "6 4",
            dashAnimation: { durationMs: 800 },
          }),
        ),
      ),
    );
    assert.match(markup, /recharts-wrapper/);
    assert.doesNotMatch(markup, /dashAnimation|durationMs/);
    assert.deepEqual(data, [{ value: 4 }, { value: 8 }]);
  }
});

test("selective Pie glow requires existing explicit category identity", () => {
  const config = { alpha: { label: "Alpha", color: "#123456" } };
  const series = (props) =>
    render(h(Root, { config }, h(Chart.PieSeries, { dataKey: "value", ...props })));
  assert.throws(() => series({ glowCategories: [] }), /glowCategories requires categoryKey/);
  assert.throws(() => series({ categoryKey: "id", glowCategories: ["alpha"] }), /explicit data/);
  assert.throws(
    () =>
      series({
        categoryKey: "id",
        data: [{ id: "missing", value: 1 }],
        glowCategories: ["missing"],
      }),
    /Root.config/,
  );
});

test("selective Pie glow leaves the native SSR shell and host data alternative unchanged", () => {
  const data = [
    { id: "alpha", value: 60 },
    { id: "beta", value: 40 },
  ];
  const config = {
    alpha: { label: "Alpha", color: "#123456" },
    beta: { label: "Beta", color: "#abcdef" },
  };
  const chart = (glowCategories) =>
    render(
      h(
        Root,
        { config },
        h(
          Chart.PieChart,
          { width: 320, height: 240, "aria-label": "Allocation" },
          h(Chart.PieSeries, {
            data,
            dataKey: "value",
            categoryKey: "id",
            nameKey: "id",
            glowCategories,
          }),
        ),
        h(
          "table",
          null,
          h("caption", null, "Category values"),
          h(
            "tbody",
            null,
            ...data.map((row) =>
              h("tr", { key: row.id }, h("th", null, row.id), h("td", null, row.value)),
            ),
          ),
        ),
      ),
    );
  assert.equal(chart(["alpha", "unknown"]), chart(undefined));
  assert.doesNotMatch(chart(["alpha"]), /pie-halo|<filter/);
  assert.match(chart(["alpha"]), /Category values/);
});

test("initial Pie pin rejects unsupported composition through public exports", () => {
  const config = { beta: { label: "Beta", color: "blue" } };
  const chart = (...children) =>
    render(
      h(
        Chart.Root,
        { config },
        h(Chart.PieChart, { width: 320, height: 240, defaultPinnedCategory: "beta" }, ...children),
      ),
    );
  assert.throws(() => chart(h(Chart.PieSeries, { dataKey: "value" })), /one direct PieSeries/);
  const series = () =>
    h(Chart.PieSeries, {
      data: [{ id: "beta", value: 4 }],
      categoryKey: "id",
      dataKey: "value",
    });
  assert.throws(() => chart(series(), series()), /one direct PieSeries/);
  assert.throws(() => chart(series(), h(Chart.Tooltip), h(Chart.Tooltip)), /one direct Tooltip/);
  assert.throws(() => chart(series()), /one direct Tooltip/);
  assert.throws(() => chart(series(), h(Native.Tooltip)), /one direct Tooltip/);
  const WrappedTooltip = (props) => h(Chart.Tooltip, props);
  WrappedTooltip.displayName = "Tooltip";
  assert.throws(() => chart(series(), h(WrappedTooltip)), /one direct Tooltip/);
  const WrappedSeries = (props) => h(Chart.PieSeries, props);
  WrappedSeries.displayName = "PieSeries";
  assert.throws(() => chart(h(WrappedSeries), h(Chart.Tooltip)), /one direct PieSeries/);
  assert.throws(
    () => chart(series(), h(Native.Pie, { dataKey: "value" }), h(Chart.Tooltip)),
    /one direct PieSeries/,
  );
  assert.doesNotThrow(() =>
    chart(series(), h(Chart.Tooltip, { itemKey: (entry) => entry.payload.id })),
  );
  assert.doesNotThrow(() => chart(h(Fragment, null, series(), h(Chart.Tooltip))));
  assert.doesNotThrow(() =>
    chart(
      h(Chart.PieSeries, {
        data: [{ id: "beta", value: 0 }],
        categoryKey: (row) => row.id,
        dataKey: "value",
      }),
      h(Chart.Tooltip),
    ),
  );
});

test("Sankey labels use stable identity, totals, explicit contents and bounded inside text", () => {
  const data = {
    nodes: [
      { id: "b", name: "Sink" },
      { id: "a", name: "Source" },
    ],
    links: [{ id: "flow", source: "a", target: "b", value: 7 }],
  };
  const node = { x: 10, y: 20, width: 0, height: 1, payload: { id: "a", name: "stale" } };
  const label = (props = {}) =>
    renderSvg(
      h(Chart.SankeyNodeLabel, {
        node,
        data,
        showValues: true,
        valueFormatter: (v) => `${v} MWh`,
        ...props,
      }),
    );
  assert.match(label(), /Source: 7 MWh/);
  assert.match(label(), /x="18"/);
  assert.doesNotMatch(label(), /stale/);
  assert.match(label({ position: "inside", children: h("tspan", null, "Custom") }), /clipPath/);
  assert.match(label({ position: "inside" }), /width="0" height="1"/);
  assert.match(label({ children: "Custom" }), /<title>Source: 7 MWh<\/title>/);
  assert.match(label({ node: { ...node, payload: { id: "b" } } }), /Sink: 7 MWh/);
  assert.match(label({ node: { ...node, payload: { id: "b" } } }), /text-anchor="end"/);
  assert.throws(() => label({ node: { ...node, payload: { id: "missing" } } }), /requires node id/);
  assert.throws(() => label({ offset: -1 }), /nonnegative/);
  assert.match(label({ data: { ...data, links: [] } }), /Source: 0 MWh/);
  assert.match(
    render(h(Chart.SankeyTable, { data, caption: "Flows", formatValue: (v) => `${v} MWh` })),
    /7 MWh/,
  );
});

test("Sankey intermediate labels count throughput once including rounding tolerance", () => {
  const data = {
    nodes: [
      { id: "a", name: "Source" },
      { id: "m", name: "Middle" },
      { id: "b", name: "Sink" },
      { id: "c", name: "Loss" },
    ],
    links: [
      { id: "in", source: "a", target: "m", value: 10 },
      { id: "out", source: "m", target: "b", value: 7 },
      { id: "loss", source: "m", target: "c", value: 3 },
    ],
  };
  const node = { x: 20, y: 0, width: 10, height: 30, payload: { id: "m" } };
  const label = (flow = data) =>
    renderSvg(
      h(Chart.SankeyNodeLabel, {
        data: flow,
        node,
        showValues: true,
        side: "left",
        offset: 4,
        className: "custom",
        "aria-label": "Throughput",
      }),
    );
  assert.match(label(), /Middle: 10/);
  assert.match(label(), /x="16"/);
  assert.match(label(), /class="custom" aria-label="Throughput"/);
  assert.match(
    label({
      ...data,
      links: data.links.map((link) =>
        link.id === "loss" ? { ...link, value: 3.000000001 } : link,
      ),
    }),
    /Middle: 10.000000001/,
  );
});

test("Sankey configured icons preserve identity, text ownership and bounded placement", () => {
  const data = {
    nodes: [
      { id: "sink", name: "Sink" },
      { id: "source", name: "Source" },
    ],
    links: [{ id: "flow", source: "source", target: "sink", value: 7 }],
  };
  const node = {
    x: 30,
    y: 20,
    width: 10,
    height: 1,
    payload: { id: "source", name: "stale" },
    index: 0,
  };
  const nodeConfig = {
    source: { label: "Legend only", color: "red", icon: h("path", { d: "M0 0h24v24z" }) },
    sink: { label: "Sink metadata", color: "blue" },
  };
  const label = (props = {}) =>
    renderSvg(h(Chart.SankeyNodeLabel, { node, data, nodeConfig, ...props }));
  assert.match(label(), /data-kind-ui="sankey-node-icon"/);
  assert.match(label(), /aria-hidden="true" focusable="false"/);
  assert.match(label(), /<text x="68" y="20.5"/);
  assert.match(label(), /<title>Source<\/title>/);
  assert.doesNotMatch(label(), /Legend only|stale/);
  assert.match(label({ side: "left", iconSize: 12, iconGap: 2 }), /<text x="8"/);
  assert.match(
    label({ showValues: true, children: h("tspan", null, "Custom") }),
    /<title>Source: 7<\/title>/,
  );
  assert.match(label({ children: "Custom" }), />Custom<\/text>/);
  assert.match(label({ position: "inside" }), /clip-path="url\(#/);
  assert.match(label({ position: "inside" }), /width="10" height="1"/);
  assert.doesNotMatch(label({ node: { ...node, payload: { id: "sink" } } }), /sankey-node-icon/);
  assert.doesNotMatch(label({ nodeConfig: undefined }), /sankey-node-icon/);
  assert.doesNotMatch(label({ iconSize: 0 }), /sankey-node-icon/);
  for (const icon of [null, false, undefined]) {
    assert.match(label({ nodeConfig: { source: { ...nodeConfig.source, icon } } }), /<text x="48"/);
  }
  assert.match(
    label({ data: { ...data, nodes: [...data.nodes].reverse() } }),
    /data-node-id="source"/,
  );
  for (const props of [{ iconSize: -1 }, { iconGap: Infinity }])
    assert.throws(() => label(props), /nonnegative/);
});

test("percent formatting is scoped to caller-selected raw stack members and never mutates rows", () => {
  const row = Object.freeze({ first: 1, second: 3, latency: 8 });
  const percent = Chart.createPercentStack({
    values: (item) =>
      item.dataKey === "first" ? [item.payload.first, item.payload.second] : undefined,
  });
  assert.equal(percent.tickFormatter(0.25), "25%");
  assert.equal(percent.tickFormatter(-0.5), "-50%");
  assert.equal(percent.normalizedValue(entry(1, { dataKey: "first", payload: row })), 0.25);
  assert.equal(percent.normalizedValue(entry(8, { dataKey: "latency", payload: row })), undefined);
  assert.deepEqual(row, { first: 1, second: 3, latency: 8 });
  for (const [members, value, expected] of [
    [[0, 0], 0, 0],
    [[null, undefined, 2], 2, 1],
    [[-1, 3], -1, -0.5],
    [[-1, 1], 1, undefined],
    [[Infinity, 1], 1, undefined],
    [[NaN, 1], 1, undefined],
    [[], 0, undefined],
    [[1, 3], null, undefined],
    [[1, 3], [0, 1], undefined],
  ]) {
    assert.equal(
      Chart.createPercentStack({ values: () => members }).normalizedValue(entry(value)),
      expected,
    );
  }
});

test("normalized tooltip preserves raw formatting, explicit formatter precedence and projection", () => {
  const renderPercent = (extra = {}, ...fractions) =>
    render(
      h(
        Root,
        { config },
        h(TooltipContent, {
          tooltip: tooltip(
            [entry(1, { payload: { id: "future" } }), entry(null, { graphicalItemId: "missing" })],
            extra,
          ),
          normalizedValue: () => (fractions.length ? fractions[0] : 0.25),
          isProjected: (item) => item.payload?.id === "future",
        }),
      ),
    );
  assert.match(renderPercent(), /25% \(1 tasks\)/);
  assert.match(renderPercent(), /Projected/);
  assert.match(renderPercent(), /No data/);
  assert.doesNotMatch(renderPercent({ formatter: () => "Custom" }), /25%/);
  assert.match(renderPercent({ formatter: () => "Custom" }), /Custom/);
  assert.doesNotMatch(renderPercent({ formatter: () => null }), /chart-tooltip/);
  assert.doesNotMatch(renderPercent({}, NaN), /NaN|% \(/);
  assert.doesNotMatch(renderPercent({}, undefined), /% \(/);
  assert.match(renderPercent({}, -0.5), /-50% \(1 tasks\)/);
});
