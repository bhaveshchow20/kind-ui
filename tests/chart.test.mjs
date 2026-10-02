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
    "BoxPlotChart",
    "BoxPlotMark",
    "BoxPlotSeries",
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
    "Tooltip",
    "TooltipContent",
    "boxPlotExtent",
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
  const svg = render(
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
  const collapsed = render(
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
  const plain = render(h(Chart.BoxPlotMark, attrs));
  const geometry = (svg) =>
    [...svg.matchAll(/<(?:rect|line|circle)\b[^>]*>/g)].map((match) => match[0]);
  for (const material of ["paper", "clay", "glow"]) {
    const svg = render(h(Chart.BoxPlotMark, { ...attrs, material, filter: undefined }));
    assert.match(svg, /data-kind-ui="box-plot-mark"[^>]*filter="url\(#kind-ui-box-/);
    assert.deepEqual(geometry(svg), geometry(plain));
    assert.match(svg, /filterUnits="userSpaceOnUse"/);
    assert.match(svg, /fill-opacity="0"/);
    assert.match(svg, /visibility="hidden"/);
    for (const override of [{ filter: "none" }, { style: { filter: "none" } }]) {
      assert.doesNotMatch(
        render(h(Chart.BoxPlotMark, { ...attrs, material, ...override })),
        /data-kind-ui="box-material"/,
      );
    }
    const collapsed = render(
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
