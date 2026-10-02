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
    "SankeyChart",
    "SankeyLink",
    "SankeyNode",
    "SankeyTable",
    "ScatterChart",
    "ScatterSeries",
    "ScatterTooltip",
    "ScatterTooltipContent",
    "Tooltip",
    "TooltipContent",
    "prepareSankeyData",
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
  for (const material of ["solid", "gradient"]) {
    const markup = render(
      h(Chart.SankeyLink, {
        ...props,
        material,
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
