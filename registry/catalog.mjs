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
    description: "Support demand across four days and six two-hour intervals.",
    source: "apps/docs/examples/heatmap/example.tsx",
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
    title: "Energy allocation",
    description: "180 MWh across nine nodes, three stages and eighteen balanced flows.",
    source: "apps/docs/examples/sankey/example.tsx",
  },
  {
    name: "scatter-chart",
    title: "Scatter Chart",
    description: "Eight task observations on numeric latency and acceptance axes.",
    source: "apps/docs/examples/scatter/example.tsx",
  },
  {
    name: "waterfall-chart",
    title: "Waterfall Chart",
    description: "Cash rises from $120k to $180k before costs and tax leave $95k.",
    source: "apps/docs/examples/waterfall/example.tsx",
  },
  {
    name: "activity-rings",
    title: "Activity Rings",
    description: "Move, exercise and stand goals as three rings, each against its own target.",
    source: "apps/docs/examples/radial/activity.tsx",
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
