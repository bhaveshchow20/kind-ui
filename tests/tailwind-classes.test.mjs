import assert from "node:assert/strict";
import test from "node:test";
import {
  createHeatmapScale,
  HeatmapChart,
  HeatmapGrid,
  Legend,
  LineChart,
  Root,
  TooltipContent,
} from "@kind-ui/charts";
import { createElement as h } from "react";
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
  render(h(Root, { config }, h(TooltipContent, { tooltip, ...props })));
const configuredHtml = (props = {}) =>
  render(
    h(LineChart, {
      config,
      data: [],
      xDataKey: "day",
      "aria-label": "Totals",
      ...props,
    }),
  );
function classes(html, marker) {
  const tag = html.match(/<[^>]+>/g)?.find((item) => item.includes(marker));
  assert.ok(tag, `Expected a rendered element containing ${marker}`);
  return tag.match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
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

test("configured chart font and height accept standard Tailwind overrides", () => {
  const html = configuredHtml({
    rootProps: { className: "font-serif consumer-root" },
    className: "h-[360px] consumer-plot",
  });
  const root = classes(html, "kind-ui-configured-line-root");
  assert.ok(root.includes("font-serif"));
  assert.ok(root.includes("consumer-root"));
  assert.ok(!root.includes("font-sans"));
  const plot = classes(html, "kind-ui-configured-line-chart");
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
    render(h(Root, { config }, h(Legend, { className: "gap-4 m-6" }))),
    'data-kind-ui="chart-legend"',
  );
  assert.ok(legend.includes("gap-4"));
  assert.ok(legend.includes("m-6"));
  for (const value of ["gap-2", "mx-0", "mt-1", "mb-2"]) assert.ok(!legend.includes(value));
});

test("Root width and color utilities override defaults", () => {
  const values = classes(
    render(h(Root, { config, className: "w-[240px] min-w-24 text-red-500" })),
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
        rows: ["A"],
        columns: ["X"],
        data: [{ row: "A", column: "X", value: 1 }],
        scale: createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] }),
      },
      h(HeatmapGrid, {
        caption: "Matrix",
        className: "border-spacing-6",
        material: "clay",
        cellProps: () => ({ className: "bg-none" }),
      }),
    ),
  );
  const grid = classes(html, 'data-kind-ui="heatmap-grid"');
  assert.ok(grid.includes("border-spacing-6"));
  assert.ok(!grid.some((value) => value.startsWith("border-spacing-[")));
  const cell = classes(html, 'data-material="clay"');
  assert.ok(cell.includes("bg-none"));
  assert.ok(!cell.some((value) => value.startsWith("bg-[url(")));
  assert.ok(cell.includes("bg-size-[100%_100%]"));
});
