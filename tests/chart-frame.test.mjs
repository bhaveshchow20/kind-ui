import assert from "node:assert/strict";
import test from "node:test";
import { createHeatmapScale, HeatmapChart, LineChart } from "@kind-ui/charts";
import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const config = {
  total: { label: "Total", color: "red" },
  extra: { label: "Extra", color: "blue" },
};
const defaults = { config, data: [], "aria-label": "Totals" };
test("line owns one frame and never generates content from metadata", () => {
  const html = render(h(LineChart, { ...defaults, height: 280 }, null));
  assert.equal((html.match(/data-kind-ui="chart"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /chart-legend|<path|recharts-xAxis/);
});
test("explicit line sizing and consumer frame attributes remain available", () => {
  const html = render(
    h(
      LineChart,
      {
        ...defaults,
        width: 320,
        height: 180,
        frameProps: { id: "consumer-frame", className: "font-serif" },
      },
      null,
    ),
  );
  assert.match(html, /id="consumer-frame"/);
  assert.match(html, /font-serif/);
  assert.match(html, /width:320px;height:180px/);
});
for (const [label, props, message] of [
  ["missing config", { ...defaults, config: undefined }, /requires config/],
  ["missing name", { ...defaults, "aria-label": undefined }, /requires aria-label/],
  ["blank name", { ...defaults, "aria-label": " " }, /requires aria-label/],
  ["mixed visibility", { ...defaults, visibleSeries: [], defaultVisibleSeries: [] }, /both/],
  [
    "ownerless visibility callback",
    { ...defaults, onVisibleSeriesChange() {} },
    /requires visibleSeries|defaultVisibleSeries/,
  ],
])
  test(`line rejects ${label}`, () =>
    assert.throws(() => render(h(LineChart, props, null)), message));
test("line requires explicit children", () =>
  assert.throws(() => render(h(LineChart, defaults)), /requires explicit children/));
test("each family owns an independent provider boundary", () =>
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
            scale: createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] }),
            "aria-label": "Outer",
          },
          h(LineChart, defaults, null),
        ),
      ),
    /owns|nested/,
  ));
