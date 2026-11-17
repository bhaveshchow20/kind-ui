import { readFileSync } from "node:fs";

// Each item ships one docs example byte-for-byte; the names are the public install addresses.
export const registryItems = [
  {
    name: "area-chart",
    title: "Area Chart",
    description: "Monthly visitors as one filled area, with a tooltip and legend.",
    source: "apps/docs/examples/area/basic.tsx",
  },
  {
    name: "bar-chart",
    title: "Bar Chart",
    description: "Weekly orders across five locations, dimming the other bars on hover.",
    source: "apps/docs/examples/bar/basic.tsx",
  },
  {
    name: "box-plot-chart",
    title: "Box Plot",
    description: "Response times for three pages, with quartiles, whiskers and outliers.",
    source: "apps/docs/examples/box-plot/basic.tsx",
  },
  {
    name: "combo-chart",
    title: "Combo Chart",
    description: "Shipped units as bars, with capacity as an area and a dashed target line.",
    source: "apps/docs/examples/combo/basic.tsx",
  },
  {
    name: "heatmap-chart",
    title: "Heatmap",
    description: "Support requests by day and hour, with a color legend and tooltip.",
    source: "apps/docs/examples/heatmap/basic.tsx",
  },
  {
    name: "histogram-chart",
    title: "Histogram",
    description: "Response times counted into five 40 ms intervals.",
    source: "apps/docs/examples/histogram/basic.tsx",
  },
  {
    name: "line-chart",
    title: "Line Chart",
    description: "Monthly visitors as one smooth line, with a tooltip and legend.",
    source: "apps/docs/examples/line/basic.tsx",
  },
  {
    name: "pie-chart",
    title: "Pie Chart",
    description:
      "A team's hours split across four areas, with share labels, a tooltip and a legend.",
    source: "apps/docs/examples/pie/basic.tsx",
  },
  {
    name: "radar-chart",
    title: "Radar Chart",
    description: "Two products scored on six traits out of 100, with a tooltip and a legend.",
    source: "apps/docs/examples/radar/basic.tsx",
  },
  {
    name: "radial-chart",
    title: "Radial Chart",
    description: "Three project stages as rings out of 100%, with labels along each arc.",
    source: "apps/docs/examples/radial/basic.tsx",
  },
  {
    name: "sankey-chart",
    title: "Sankey Chart",
    description: "Energy flowing from two sources through two zones to two uses.",
    source: "apps/docs/examples/sankey/basic.tsx",
  },
  {
    name: "scatter-chart",
    title: "Scatter Chart",
    description: "Task latency against acceptance rate for two groups of points.",
    source: "apps/docs/examples/scatter/basic.tsx",
  },
  {
    name: "waterfall-chart",
    title: "Waterfall Chart",
    description: "Cash moving from a $120k opening balance to a $95k close.",
    source: "apps/docs/examples/waterfall/basic.tsx",
  },
  {
    name: "activity-rings",
    title: "Activity Rings",
    description: "Move, exercise and stand goals as three rings, each against its own target.",
    source: "apps/docs/examples/radial/activity.tsx",
  },
];

export const coreVersion = JSON.parse(
  readFileSync(new URL("../packages/charts/package.json", import.meta.url), "utf8"),
).version;
export const registryHomepage = "https://github.com/kind-ui/charts";
export const registryEndpoint = "https://kindui.dev/r/";
export const sourcePaths = [
  "../node_modules/@kind-ui/charts/dist",
  "../../node_modules/@kind-ui/charts/dist",
  "../../../node_modules/@kind-ui/charts/dist",
];
export const registryCss = Object.fromEntries(sourcePaths.map((path) => [`@source "${path}"`, {}]));
