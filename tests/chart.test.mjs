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
    "ScatterChart",
    "ScatterSeries",
    "ScatterTooltip",
    "ScatterTooltipContent",
    "Tooltip",
    "TooltipContent",
    "WaterfallChart",
    "WaterfallConnectors",
    "WaterfallSeries",
    "computeWaterfallData",
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
