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
function assertNoPropertyClass(values, property) {
  assert.equal(
    values.some((value) => value.startsWith(`[${property}:`)),
    false,
    `Unexpected default ${property} class: ${values.join(" ")}`,
  );
}

test("default tokens and gradient swatches survive without consumer overrides", () => {
  const html = tooltipHtml();
  const values = classes(html, 'data-kind-ui="chart-tooltip"');
  assert.ok(values.includes("[background:var(--kind-ui-chart-popover,var(--popover,Canvas))]"));
  assert.ok(values.includes("px-[8px]"));
  assert.ok(values.includes("py-[6px]"));
  const indicator = classes(html, 'data-kind-ui="chart-indicator"');
  assert.ok(
    indicator.includes(
      "[background:var(--kind-ui-chart-indicator-background,var(--kind-ui-chart-indicator-color,currentColor))]",
    ),
  );
  assert.match(html, /linear-gradient/);
});

for (const override of ["bg-red-500", "bg-none", "bg-[url(/texture.svg)]"]) {
  test(`consumer ${override} replaces the tooltip background shorthand`, () => {
    const values = classes(tooltipHtml({ className: override }), 'data-kind-ui="chart-tooltip"');
    assert.ok(values.includes(override));
    assertNoPropertyClass(values, "background");
    assert.ok(values.includes("px-[8px]"));
  });
}

test("a later background shorthand replaces earlier color and image utilities", () => {
  const values = classes(
    tooltipHtml({ className: "bg-red-500 bg-[url(/texture.svg)] [background:navy]" }),
    'data-kind-ui="chart-tooltip"',
  );
  assert.ok(values.includes("[background:navy]"));
  assert.ok(!values.includes("bg-red-500"));
  assert.ok(!values.includes("bg-[url(/texture.svg)]"));
});

test("configured font utilities replace the inherited token font in either order", () => {
  const defaults = classes(configuredHtml(), "kind-ui-configured-line-root");
  assert.ok(
    defaults.includes("[font-family:var(--kind-ui-chart-font,ui-sans-serif,system-ui,sans-serif)]"),
  );
  const values = classes(
    configuredHtml({ rootProps: { className: "font-serif consumer-root" } }),
    "kind-ui-configured-line-root",
  );
  assert.ok(values.includes("font-serif"));
  assert.ok(values.includes("consumer-root"));
  assertNoPropertyClass(values, "font-family");
  const arbitrary = classes(
    configuredHtml({ rootProps: { className: "font-serif [font-family:Georgia]" } }),
    "kind-ui-configured-line-root",
  );
  assert.ok(arbitrary.includes("[font-family:Georgia]"));
  assert.ok(!arbitrary.includes("font-serif"));
});

test("height, gap and padding utilities replace matching defaults and retain custom classes", () => {
  const chart = classes(
    configuredHtml({ className: "h-96 consumer-chart" }),
    "kind-ui-configured-line-chart",
  );
  assert.ok(chart.includes("h-96"));
  assert.ok(chart.includes("consumer-chart"));
  assert.ok(!chart.includes("h-[var(--kind-ui-chart-height,280px)]"));
  const legend = classes(
    render(h(Root, { config }, h(Legend, { className: "gap-4 consumer-legend" }))),
    'data-kind-ui="chart-legend"',
  );
  assert.ok(legend.includes("gap-4"));
  assert.ok(legend.includes("consumer-legend"));
  assert.ok(!legend.includes("gap-[8px]"));
  const tip = classes(
    tooltipHtml({
      className: "px-4 py-3 hover:px-4 hover:px-5 hover:py-4 hover:py-6 consumer-tooltip",
    }),
    'data-kind-ui="chart-tooltip"',
  );
  for (const value of ["px-4", "py-3", "hover:px-5", "hover:py-6", "consumer-tooltip"]) {
    assert.ok(tip.includes(value));
  }
  assert.ok(!tip.includes("px-[8px]"));
  assert.ok(!tip.includes("py-[6px]"));
  assert.ok(!tip.includes("hover:px-4"));
  assert.ok(!tip.includes("hover:py-4"));
});

test("background and font conflicts respect variants and leave base defaults intact", () => {
  const tip = classes(
    tooltipHtml({
      className: "hover:[background:red] hover:bg-blue-500 focus:[background:green]",
    }),
    'data-kind-ui="chart-tooltip"',
  );
  assert.ok(tip.includes("hover:bg-blue-500"));
  assert.ok(tip.includes("focus:[background:green]"));
  assert.ok(!tip.includes("hover:[background:red]"));
  assert.ok(tip.includes("[background:var(--kind-ui-chart-popover,var(--popover,Canvas))]"));
  const root = classes(
    configuredHtml({ rootProps: { className: "md:[font-family:Georgia] md:font-serif" } }),
    "kind-ui-configured-line-root",
  );
  assert.ok(root.includes("md:font-serif"));
  assert.ok(!root.includes("md:[font-family:Georgia]"));
  assert.ok(root.some((value) => value.startsWith("[font-family:")));
});

test("consumer inline styles remain attached alongside resolved class overrides", () => {
  const html = tooltipHtml({
    className: "bg-red-500",
    style: { background: "purple", padding: "17px" },
  });
  const tag = html.match(/<[^>]+>/g)?.find((item) => item.includes('data-kind-ui="chart-tooltip"'));
  assert.match(tag, /style="background:purple;padding:17px"/);
  assert.ok(classes(html, 'data-kind-ui="chart-tooltip"').includes("bg-red-500"));
});

test("typed token text colors resolve against consumer color utilities", () => {
  const values = classes(
    tooltipHtml({ className: "text-indigo-600 consumer-tooltip" }),
    'data-kind-ui="chart-tooltip"',
  );
  assert.ok(values.includes("text-indigo-600"));
  assert.ok(values.includes("text-[12px]"));
  assert.ok(!values.some((value) => value.startsWith("text-[color:")));
});

const heatmapHtml = (props = {}) =>
  render(
    h(
      HeatmapChart,
      {
        rows: ["A"],
        columns: ["X"],
        data: [{ row: "A", column: "X", value: 1 }],
        scale: createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] }),
      },
      h(HeatmapGrid, { caption: "Matrix", ...props }),
    ),
  );

test("arbitrary Root width, minimum width and text color replace token utilities", () => {
  const values = classes(
    render(h(Root, { config, className: "[width:400px] [min-width:100px] [color:red]" })),
    'data-kind-ui="chart"',
  );
  for (const value of ["[width:400px]", "[min-width:100px]", "[color:red]"]) {
    assert.ok(values.includes(value));
  }
  assert.ok(!values.includes("w-full"));
  assert.ok(!values.includes("min-w-0"));
  assert.ok(!values.some((value) => value.startsWith("text-[color:")));
});

test("arbitrary configured height replaces default sizing", () => {
  const values = classes(
    configuredHtml({ className: "[height:360px]" }),
    "kind-ui-configured-line-chart",
  );
  assert.ok(values.includes("[height:360px]"));
  assert.ok(!values.includes("h-[var(--kind-ui-chart-height,280px)]"));
});

test("arbitrary padding shorthand replaces both tooltip padding axes", () => {
  const values = classes(
    tooltipHtml({ className: "[padding:24px]" }),
    'data-kind-ui="chart-tooltip"',
  );
  assert.ok(values.includes("[padding:24px]"));
  assert.ok(!values.includes("px-[8px]"));
  assert.ok(!values.includes("py-[6px]"));
});

test("arbitrary spacing axes replace their own defaults and preserve unrelated edges", () => {
  const tip = classes(
    tooltipHtml({ className: "[padding-inline:24px]" }),
    'data-kind-ui="chart-tooltip"',
  );
  assert.ok(tip.includes("[padding-inline:24px]"));
  assert.ok(!tip.includes("px-[8px]"));
  assert.ok(tip.includes("py-[6px]"));
  const legend = classes(
    render(h(Root, { config }, h(Legend, { className: "[margin-inline:24px] [margin-top:12px]" }))),
    'data-kind-ui="chart-legend"',
  );
  assert.ok(legend.includes("[margin-inline:24px]"));
  assert.ok(legend.includes("[margin-top:12px]"));
  assert.ok(!legend.includes("mx-0"));
  assert.ok(!legend.includes("mt-[4px]"));
  assert.ok(legend.includes("mb-[8px]"));
});

test("arbitrary margin shorthand replaces legend axes and edges", () => {
  const values = classes(
    render(h(Root, { config }, h(Legend, { className: "[margin:24px]" }))),
    'data-kind-ui="chart-legend"',
  );
  assert.ok(values.includes("[margin:24px]"));
  assert.ok(!values.includes("mx-0"));
  assert.ok(!values.includes("mt-[4px]"));
  assert.ok(!values.includes("mb-[8px]"));
});

test("standard border spacing replaces the heatmap gap property", () => {
  const values = classes(
    heatmapHtml({ className: "border-spacing-6" }),
    'data-kind-ui="heatmap-grid"',
  );
  assert.ok(values.includes("border-spacing-6"));
  assertNoPropertyClass(values, "border-spacing");
});

test("arbitrary background image removes heatmap material paint without discarding its size", () => {
  const values = classes(
    heatmapHtml({ material: "clay", cellProps: () => ({ className: "[background-image:none]" }) }),
    'data-material="clay"',
  );
  assert.ok(values.includes("[background-image:none]"));
  assert.ok(!values.some((value) => value.startsWith("bg-[url(")));
  assert.ok(values.includes("bg-size-[100%_100%]"));
  assert.ok(values.includes("bg-no-repeat"));
});

test("property aliases resolve utility overrides in both orders within matching variants", () => {
  const values = classes(
    tooltipHtml({
      className:
        "[padding:24px] p-6 hover:[width:100px] hover:w-80 focus:[color:red] focus:text-blue-500 [background-image:none] bg-none",
    }),
    'data-kind-ui="chart-tooltip"',
  );
  for (const value of ["p-6", "hover:w-80", "focus:text-blue-500", "bg-none"]) {
    assert.ok(values.includes(value));
  }
  for (const value of [
    "[padding:24px]",
    "hover:[width:100px]",
    "focus:[color:red]",
    "[background-image:none]",
  ]) {
    assert.ok(!values.includes(value));
  }
});
