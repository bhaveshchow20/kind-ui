import assert from "node:assert/strict";
import test from "node:test";
import * as Chart from "@kind-ui/charts";
import { Fragment, createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const config = { value: { label: "Value", color: "red" } };
const families = [
  Chart.AreaChart,
  Chart.BarChart,
  Chart.ComboChart,
  Chart.PieChart,
  Chart.RadarChart,
  Chart.RadialBarChart,
  Chart.ScatterChart,
  Chart.WaterfallChart,
  Chart.HistogramChart,
  Chart.BoxPlotChart,
];
const propsFor = (Family) =>
  Family === Chart.HistogramChart ? { bins: [], measure: "count" } : { data: [] };
for (const Family of families) {
  test(`${Family.name} owns exactly one frame and never creates a legend from metadata`, () => {
    const html = render(h(Family, { ...propsFor(Family), config, "aria-label": "Values" }, null));
    assert.equal((html.match(/data-kind-ui="chart"/g) ?? []).length, 1);
    assert.doesNotMatch(html, /data-kind-ui="chart-legend"/);
    assert.match(html, /data-kind-ui="chart-parts"/);
  });
  test(`${Family.name} rejects missing names, implicit content and nested frame ownership`, () => {
    assert.throws(
      () => render(h(Family, { ...propsFor(Family), rootProps: {} }, null)),
      /frame options require config/,
    );
    assert.throws(
      () => render(h(Family, { ...propsFor(Family), config }, null)),
      /requires aria-label/,
    );
    assert.throws(
      () => render(h(Family, { ...propsFor(Family), config, "aria-label": " " }, null)),
      /requires aria-label/,
    );
    assert.throws(
      () => render(h(Family, { ...propsFor(Family), config, "aria-label": "Values" })),
      /requires explicit children/,
    );
    assert.throws(
      () =>
        render(
          h(
            Chart.Root,
            { config },
            h(Family, { ...propsFor(Family), config, "aria-label": "Values" }, null),
          ),
        ),
      /owns Root/,
    );
  });
}
test("every family exposes its parts, with mixed series explicit and named primitives retained", () => {
  for (const [Family, members] of [
    [Chart.LineChart, ["Series", "Grid", "XAxis", "YAxis", "Tooltip", "Legend"]],
    [Chart.AreaChart, ["Series", "Grid", "XAxis", "YAxis", "Tooltip", "Legend"]],
    [Chart.BarChart, ["Series", "Grid", "XAxis", "YAxis", "Tooltip", "Legend"]],
    [
      Chart.ComboChart,
      ["Line", "Area", "Bar", "Scatter", "Grid", "XAxis", "YAxis", "Tooltip", "Legend"],
    ],
    [Chart.PieChart, ["Series", "Cell", "Labels", "Tooltip", "Legend"]],
    [Chart.RadarChart, ["Series", "Grid", "AngleAxis", "RadiusAxis", "Tooltip", "Legend"]],
    [Chart.RadialBarChart, ["Series", "Grid", "AngleAxis", "RadiusAxis", "Tooltip", "Legend"]],
    [Chart.ScatterChart, ["Series", "Grid", "XAxis", "YAxis", "ZAxis", "Tooltip", "Legend"]],
    [Chart.WaterfallChart, ["Series", "Connectors", "XAxis", "YAxis", "Tooltip", "Legend"]],
    [Chart.HistogramChart, ["Series", "Grid", "XAxis", "YAxis", "Tooltip", "Legend"]],
    [Chart.BoxPlotChart, ["Series", "Mark", "XAxis", "YAxis", "Tooltip", "Legend"]],
    [Chart.HeatmapChart, ["Grid", "Tooltip", "Legend", "DataTable", "Cell"]],
    [Chart.ActivityRings, ["Series", "Labels", "Tooltip", "Legend"]],
    [
      Chart.SankeyChart,
      ["Nodes", "Links", "Node", "Link", "NodeLabel", "Tooltip", "Legend", "Table"],
    ],
  ])
    for (const member of members) assert.equal(typeof Family[member], "function", member);
  assert.equal(Chart.LineChart.Series, Chart.LineSeries);
  assert.equal(Chart.ComboChart.Bar, Chart.BarSeries);
  assert.equal(Chart.PieChart.Series, Chart.PieSeries);
});
test("explicit activity children omit generated content and reject conflicting recipe options", () => {
  const props = { config, rings: [{ key: "value", value: 70 }], "aria-label": "Activity" };
  assert.doesNotMatch(render(h(Chart.ActivityRings, props, null)), /chart-legend/);
  assert.match(render(h(Chart.ActivityRings, props, null)), /<dt>Value<\/dt><dd>70<\/dd>/);
  for (const option of [
    { legend: false },
    { tooltip: false },
    { series: {} },
    { labels: {} },
    { labels: false },
  ])
    assert.throws(
      () => render(h(Chart.ActivityRings, { ...props, ...option }, h(Fragment))),
      /replace generated parts/,
    );
});
test("Sankey retains arbitrary node identities under its owned metadata and data root", () => {
  const data = {
    nodes: [{ id: "source one" }, { id: "target two" }],
    links: [{ id: "route", source: "source one", target: "target two", value: 5 }],
  };
  const config = {
    "source one": { label: "Source", color: "red" },
    "target two": { label: "Target", color: "blue" },
  };
  assert.match(
    render(h(Chart.SankeyChart, { config, data, "aria-label": "Flows" }, null)),
    /data-kind-ui="chart"/,
  );
});
test("compound HTML parts fail clearly outside owned family frames", () => {
  assert.throws(
    () => render(h(Chart.Root, { config }, h(Chart.BarChart.Legend))),
    /require a chart-family root/,
  );
  assert.throws(() => render(h(Chart.SankeyChart.Nodes)), /require SankeyChart with config/);
});

test("owned Sankey rejects competing native renderers and compound parts reject missing scopes", () => {
  const data = { nodes: [], links: [] };
  for (const option of [{ node: h("g") }, { link: h("g") }, { nodeConfig: {} }])
    assert.throws(
      () => render(h(Chart.SankeyChart, { config, data, "aria-label": "Flows", ...option }, null)),
      /uses Nodes and Links parts/,
    );
  assert.throws(() => render(h(Chart.SankeyChart.Nodes)), /require SankeyChart with config/);
  assert.throws(() => render(h(Chart.ActivityRings.Series)), /requires ActivityRings/);
  assert.throws(() => render(h(Chart.HistogramChart.XAxis)), /requires HistogramChart/);
});
