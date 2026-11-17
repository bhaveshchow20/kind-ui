// Each item ships one docs example byte-for-byte; the names are the public install addresses.
export const registryItems = [
  {
    name: "area-chart",
    title: "Area Chart",
    description: "A single area with complete monthly visitor data.",
    source: "apps/docs/examples/area/example.tsx",
  },
  {
    name: "bar-chart",
    title: "Bar Chart",
    description: "Weekly pickup orders across five locations with opt-in category emphasis.",
    source: "apps/docs/examples/bar/example.tsx",
  },
  {
    name: "box-plot-chart",
    title: "BoxPlot",
    description: "Compare three caller-computed response time distributions, in milliseconds.",
    source: "apps/docs/examples/box-plot/example.tsx",
  },
  {
    name: "combo-chart",
    title: "Production and capacity",
    description: "Shipped units, available capacity and a production target on one numeric scale.",
    source: "apps/docs/examples/combo/example.tsx",
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
    description: "Counts across explicit equal-width response-time intervals.",
    source: "apps/docs/examples/histogram/example.tsx",
  },
  {
    name: "line-chart",
    title: "Line Chart",
    description: "Monthly visitors as one smooth line, with a tooltip and legend.",
    source: "apps/docs/examples/line/basic.tsx",
  },
  {
    name: "pie-chart",
    title: "Pie and Donut",
    description:
      "A complete 1,000-hour team allocation with category labels and percentage labels.",
    source: "apps/docs/examples/pie/example.tsx",
  },
  {
    name: "radar-chart",
    title: "Radar Chart",
    description: "Six comparable research dimensions for two products on a fixed 0–100 scale.",
    source: "apps/docs/examples/radar/example.tsx",
  },
  {
    name: "radial-chart",
    title: "Radial Chart",
    description: "Three project stages share an explicit 0–100 percent scale.",
    source: "apps/docs/examples/radial/example.tsx",
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
    description: "Cash rises from $120k to $180k before costs and tax leave $95k.",
    source: "apps/docs/examples/waterfall/example.tsx",
  },
  {
    name: "activity-rings",
    title: "Activity rings",
    description:
      "Three original values use their own domains; tracks, tooltip and static legend come from ActivityRings.",
    source: "apps/docs/examples/radial-activity/example.tsx",
  },
];

export const coreVersion = "0.5.0";
export const registryHomepage = "https://github.com/kind-ui/charts";
export const registryEndpoint = "https://kindui.dev/r/";
export const sourcePaths = [
  "../node_modules/@kind-ui/charts/dist",
  "../../node_modules/@kind-ui/charts/dist",
  "../../../node_modules/@kind-ui/charts/dist",
];
export const registryCss = Object.fromEntries(sourcePaths.map((path) => [`@source "${path}"`, {}]));
