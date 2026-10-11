import assert from "node:assert/strict";
import test from "node:test";
import * as Chart from "@kind-ui/charts";
import {
  createHeatmapScale,
  HeatmapChart,
  HeatmapGrid,
  Legend,
  LineChart,
  TooltipContent,
} from "@kind-ui/charts";
import { Fragment, createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";

const config = { total: { label: "Total", color: ["red", "blue"] } };
const tooltip = {
  active: true,
  payload: [{ dataKey: "total", name: "total", value: 12 }],
  label: "Monday",
  activeIndex: "0",
  accessibilityLayer: false,
};
const tooltipHtml = (props = {}) =>
  render(metadataChart({ config }, h(TooltipContent, { tooltip, ...props }, null)));
const chartHtml = (props = {}) =>
  render(h(LineChart, { config, data: [], "aria-label": "Totals", ...props }, null));
function classes(html, marker) {
  const tag = html.match(/<[^>]+>/g)?.find((item) => item.includes(marker));
  assert.ok(tag, `Expected a rendered element containing ${marker}`);
  return tag.match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
}

function metadataChart(options, ...children) {
  const {
    config,
    interaction,
    emphasis,
    nonce,
    visibleSeries,
    defaultVisibleSeries,
    onVisibleSeriesChange,
    ...frameProps
  } = options;
  return h(
    Chart.HeatmapChart,
    {
      rows: [],
      columns: [],
      data: [],
      scale: Chart.createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] }),
      config,
      "aria-label": "Metadata chart",
      interaction,
      emphasis,
      nonce,
      ...(visibleSeries !== undefined ? { visibleSeries } : {}),
      ...(defaultVisibleSeries !== undefined ? { defaultVisibleSeries } : {}),
      ...(onVisibleSeriesChange ? { onVisibleSeriesChange } : {}),
      frameProps,
    },
    ...children,
  );
}

test("default tooltip uses host semantic colors and direct gradient paint", () => {
  const html = tooltipHtml();
  const values = classes(html, 'data-kind-ui="chart-tooltip"');
  assert.ok(values.includes("bg-[color:var(--popover,Canvas)]"));
  assert.ok(values.includes("px-2"));
  assert.ok(values.includes("py-1.5"));
  assert.match(html, /style="background:var\(--kind-ui-series-/);
  assert.match(html, /linear-gradient/);
  assert.doesNotMatch(html, /--kind-ui-chart-/);
});

test("consumer color utilities replace defaults without discarding typography", () => {
  const values = classes(
    tooltipHtml({ className: "bg-red-500 text-indigo-600 consumer-tooltip" }),
    'data-kind-ui="chart-tooltip"',
  );
  for (const value of ["bg-red-500", "text-indigo-600", "text-xs", "consumer-tooltip"])
    assert.ok(values.includes(value));
  assert.ok(
    !values.some((value) => value.startsWith("bg-[color:") || value.startsWith("text-[color:")),
  );
});

test("chart font and height accept standard Tailwind overrides", () => {
  const html = chartHtml({
    frameProps: { className: "font-serif consumer-root" },
    className: "h-[360px] consumer-plot",
  });
  const root = classes(html, 'data-kind-ui="chart"');
  assert.ok(root.includes("font-serif"));
  assert.ok(root.includes("consumer-root"));
  assert.ok(!root.includes("font-sans"));
  const plot = classes(html, "recharts-wrapper");
  assert.ok(plot.includes("h-[360px]"));
  assert.ok(plot.includes("consumer-plot"));
  assert.ok(!plot.includes("h-[280px]"));
});

test("consumer spacing utilities replace defaults and preserve variants", () => {
  const values = classes(
    tooltipHtml({ className: "p-6 hover:px-4 hover:px-5 consumer-tooltip" }),
    'data-kind-ui="chart-tooltip"',
  );
  assert.ok(values.includes("p-6"));
  assert.ok(values.includes("hover:px-5"));
  assert.ok(values.includes("consumer-tooltip"));
  for (const value of ["px-2", "py-1.5", "hover:px-4"]) assert.ok(!values.includes(value));
  const legend = classes(
    render(metadataChart({ config }, h(Legend, { className: "gap-4 m-6" }, null))),
    'data-kind-ui="chart-legend"',
  );
  assert.ok(legend.includes("gap-4"));
  assert.ok(legend.includes("m-6"));
  for (const value of ["gap-2", "mx-0", "mt-1", "mb-2"]) assert.ok(!legend.includes(value));
});

test("Chart width and color utilities override defaults", () => {
  const values = classes(
    render(metadataChart({ config, className: "w-[240px] min-w-24 text-red-500" }, null)),
    'data-kind-ui="chart"',
  );
  for (const value of ["w-[240px]", "min-w-24", "text-red-500"]) assert.ok(values.includes(value));
  assert.ok(!values.includes("w-full"));
  assert.ok(!values.includes("min-w-0"));
  assert.ok(!values.some((value) => value.startsWith("text-[color:")));
});

test("explicit consumer styles remain attached alongside class overrides", () => {
  const html = tooltipHtml({
    className: "bg-red-500",
    style: { background: "purple", padding: "17px" },
  });
  const tag = html.match(/<[^>]+>/g)?.find((item) => item.includes('data-kind-ui="chart-tooltip"'));
  assert.match(tag, /style="background:purple;padding:17px"/);
  assert.ok(classes(html, 'data-kind-ui="chart-tooltip"').includes("bg-red-500"));
});

test("indicator variants retain data paint with a solid dashed border", () => {
  const dotted = classes(tooltipHtml({ indicator: "dot" }), 'data-kind-ui="chart-indicator"');
  assert.ok(dotted.includes("size-2"));
  assert.ok(!dotted.includes("w-[3px]"));
  assert.ok(!dotted.includes("h-3"));
  const dashed = tooltipHtml({ indicator: "dashed" });
  assert.match(dashed, /style="border-color:var\(--color-total\)"/);
  const values = classes(dashed, 'data-kind-ui="chart-indicator"');
  assert.ok(values.includes("border-dashed"));
  assert.ok(values.includes("w-0"));
});

test("heatmap spacing and material image accept standard utility overrides", () => {
  const html = render(
    h(
      HeatmapChart,
      {
        config: config,
        "aria-label": "Chart fixture",
        rows: ["A"],
        columns: ["X"],
        data: [{ row: "A", column: "X", value: 1 }],
        scale: createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] }),
      },
      h(
        HeatmapGrid,
        {
          caption: "Matrix",
          className: "border-spacing-6",
          material: "clay",
          cellProps: () => ({ className: "bg-none" }),
        },
        null,
      ),
    ),
  );
  const grid = classes(html, 'data-kind-ui="heatmap-grid"');
  assert.ok(grid.includes("border-spacing-6"));
  assert.ok(!grid.some((value) => value.startsWith("border-spacing-[")));
  const cell = classes(html, 'data-material="clay"');
  assert.ok(cell.includes("bg-none"));
  assert.ok(!cell.some((value) => value.startsWith("bg-[url(")));
  assert.ok(cell.includes("bg-[length:100%_100%]"));
});

test("explicit configured dimensions omit competing default utilities", () => {
  for (const props of [{ height: 180, width: 320 }, { style: { height: 180, width: 320 } }]) {
    const html = chartHtml(props);
    const plot = classes(html, "recharts-wrapper");
    assert.ok(!plot.includes("h-[280px]"));
    assert.ok(!plot.includes("w-full"));
    assert.match(html, /height:180px/);
    assert.match(html, /width:320px/);
  }
});

test("loading styles carry the consumer CSP nonce", () => {
  const html = render(
    h(
      Fragment,
      null,
      h(
        HeatmapChart,
        {
          "aria-label": "Chart fixture",
          config: {},
          nonce: "request-nonce",
          rows: [],
          columns: [],
          data: [],
          loading: true,
          scale: createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] }),
        },
        h(HeatmapGrid, { caption: "Matrix" }, null),
      ),
    ),
  );
  assert.match(html, /<style nonce="request-nonce">@keyframes kind-ui-loading-pulse/);
});
