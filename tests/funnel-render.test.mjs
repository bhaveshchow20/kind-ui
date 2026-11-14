import assert from "node:assert/strict";
import test from "node:test";
import {
  createHeatmapScale,
  FunnelChart,
  FunnelContent,
  FunnelDataTable,
  FunnelLabels,
  FunnelLegend,
  FunnelStages,
  FunnelTooltip,
  HeatmapChart,
} from "@kind-ui/charts";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const data = [
  { id: "entered", label: "Entered", value: 100 },
  { id: "active", label: "Active", value: 150 },
  { id: "unknown", label: "Unknown", value: null },
];
const config = Object.fromEntries(data.map((row) => [row.id, { color: "blue", label: row.label }]));
const defaults = { data, config, "aria-label": "Ordered stages", width: 400, height: 300 };
test("funnel owns exactly one named frame and generates no omitted parts", () => {
  const html = render(h(FunnelChart, defaults, null));
  assert.equal((html.match(/data-kind-ui="chart"/g) ?? []).length, 1);
  assert.doesNotMatch(
    html,
    /funnel-mark|funnel-labels|funnel-tooltip|funnel-data-table|chart-legend/,
  );
});
test("funnel supports all explicit parts and consumer frame sizing", () => {
  const html = render(
    h(
      FunnelChart,
      { ...defaults, frameProps: { id: "funnel-frame", className: "font-serif" } },
      h(FunnelStages),
      h(FunnelLabels),
      h(FunnelTooltip),
      h(FunnelDataTable, { caption: "Stage values" }),
      h(FunnelLegend),
      h(FunnelContent, null, "Additional context"),
    ),
  );
  assert.match(html, /id="funnel-frame"/);
  assert.match(html, /font-serif/);
  assert.match(html, /width:400px;height:300px/);
});
for (const [name, props, error] of [
  ["malformed standard datum", { data: [null] }, /data|datum|stage/i],
  ["null accessors", { accessors: null }, /accessors/i],
  ["missing name", { "aria-label": undefined }, /requires aria-label/],
  ["missing config", { config: undefined }, /requires config/],
  ["missing stage color", { config: { entered: { color: "red" } } }, /config requires stage/],
  ["invalid orientation", { orientation: "diagonal" }, /orientation/],
  ["invalid duration", { animate: { revealDurationMs: -1 } }, /duration/i],
  ["controlled inspection without callback", { activeId: "entered" }, /callback/],
  [
    "mixed inspection ownership",
    { activeId: "entered", defaultActiveId: "active", onActiveIdChange() {} },
    /controlled|default/,
  ],
  [
    "visibility interaction",
    { interaction: { kind: "category", mode: "visibility", eligibleKeys: ["entered"] } },
    /focus/,
  ],
  ["obsolete rootProps", { rootProps: {} }, /rootProps/],
])
  test(`funnel rejects ${name}`, () =>
    assert.throws(() => render(h(FunnelChart, { ...defaults, ...props }, null)), error));
test("funnel requires explicit children", () =>
  assert.throws(() => render(h(FunnelChart, defaults)), /explicit children/));
for (const Part of [
  FunnelStages,
  FunnelLabels,
  FunnelTooltip,
  FunnelDataTable,
  FunnelLegend,
  FunnelContent,
])
  test(`${Part.name} requires FunnelChart`, () =>
    assert.throws(() => render(h(Part, { caption: "Data" })), /FunnelChart/));
test("funnel rejects nested families", () =>
  assert.throws(
    () =>
      render(
        h(
          HeatmapChart,
          {
            config,
            rows: [],
            columns: [],
            data: [],
            scale: createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#0000ff"] }),
            "aria-label": "Outer",
          },
          h(FunnelChart, defaults, null),
        ),
      ),
    /nest/,
  ));

test("FunnelChart exposes its explicit parts in the public compound contract", () => {
  assert.equal(FunnelChart.Stages, FunnelStages);
  assert.equal(FunnelChart.Labels, FunnelLabels);
  assert.equal(FunnelChart.Tooltip, FunnelTooltip);
  assert.equal(FunnelChart.DataTable, FunnelDataTable);
  assert.equal(FunnelChart.Legend, FunnelLegend);
  assert.equal(FunnelChart.Content, FunnelContent);
  assert.equal(FunnelChart.Root, undefined);
  assert.equal(FunnelChart.Plot, undefined);
});

test("funnel inspection-only marks omit highlight key instructions", () => {
  const html = render(
    h(FunnelChart, { ...defaults, interaction: { markActivation: "none" } }, null),
  );
  assert.match(html, /Use arrow keys, Home and End to inspect stages/);
  assert.doesNotMatch(html, /Enter or Space highlights a stage/);
});

test("funnel label fallback preserves structural color getters", () => {
  class StageColor {
    get color() {
      return "#123456";
    }
  }
  const colors = Object.fromEntries(data.map((row) => [row.id, new StageColor()]));
  const html = render(h(FunnelChart, { ...defaults, config: colors }, null));
  assert.match(html, /#123456/);
});
test("funnel label fallback preserves nonenumerable color metadata", () => {
  const colors = Object.fromEntries(
    data.map((row) => [row.id, Object.defineProperty({}, "color", { value: "#abcdef" })]),
  );
  const html = render(h(FunnelChart, { ...defaults, config: colors }, null));
  assert.match(html, /#abcdef/);
});

test("funnel validates unused config colors", () => {
  assert.throws(
    () =>
      render(h(FunnelChart, { ...defaults, config: { ...config, stale: { color: [] } } }, null)),
    /color|nonempty|empty/i,
  );
});
