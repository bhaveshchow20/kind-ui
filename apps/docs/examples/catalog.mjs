export const examples = [
  {
    id: "line",
    title: "Line Chart",
    source: "line-recipes.tsx",
    acceptance:
      "Twelve monthly visitor observations use a linear curve; legend visibility, source and data table agree.",
    notes: "A single linear series with complete monthly visitor data.",
  },
  {
    id: "area",
    title: "Area Chart",
    source: "area-recipes.tsx",
    acceptance:
      "Seven complete daily observations retain a zero baseline and native monotone curve; source and data table match.",
    notes:
      "This single-series area uses daily task observations. Its fill encodes height above zero; it does not infer stacked or normalized data.",
  },
  {
    id: "bar",
    title: "Bar Chart",
    source: "bar-recipes.tsx",
    acceptance:
      "Four positive categories keep the same geometry during supported category emphasis. Legend filtering controls the sales series; the table remains available.",
    notes:
      "Automatic category emphasis is explicitly opted in on BarChart. This whole-plot positive, scalar, single-axis dataset is eligible; unsupported arrangements are not promised.",
  },
  {
    id: "combo",
    title: "Combo Chart",
    source: "combo-recipes.tsx",
    acceptance:
      "Two native axes keep tasks and milliseconds separate; each legend item toggles only its series; all six hourly observations remain in the data table.",
    notes:
      "Area, bar and line share a ComboChart. Each mark chooses its own dataKey and yAxisId; the host defines axis domains and units.",
  },
  {
    id: "donut",
    title: "Pie Chart",
    source: "pie-recipes.tsx",
    acceptance:
      "Category filtering changes rows and Cells together; included total and shares update; all-hidden retains a truthful empty status.",
    notes:
      "hours is the magnitude field. id is category identity. Root visibility requests are applied by the example to rows and matching Cells. A zero innerRadius makes a pie; there is no separate DonutChart export.",
  },
  {
    id: "scatter",
    title: "Scatter Chart",
    source: "scatter-recipes.tsx",
    acceptance:
      "Circle and diamond legend icons match explicit series shapes; x/y keep their units; all seven supplied z counts are preserved; both cohorts appear in the table.",
    notes:
      "Consumer data supplies x latency, y acceptance and optional z sample count. Native ZAxis controls marker area; ScatterTooltip receives explicit zDimension metadata. Bubble is this composition, not a separate export.",
  },
  {
    id: "radar",
    title: "Radar Chart",
    source: "polar-recipes.tsx",
    acceptance:
      "Actual and target use a fixed 0–100 scale across five dimensions; legend selections reproduce in source; all five rows remain available.",
    notes:
      "Native polar axes choose category placement and numeric domain. These scores are comparable on one scale, not an additive total.",
  },
  {
    id: "radial-bar",
    title: "Radial Bar Chart",
    source: "polar-recipes.tsx",
    acceptance:
      "Three dimensions form paired actual/target rings on a fixed 0–100 angle scale; the table includes all five source dimensions and marks the plotted subset.",
    notes:
      "The caller chooses a three-row subset for readable paired bands. Native polar axes and start/end angles define the comparison; series visibility is controlled.",
  },
  {
    id: "histogram",
    title: "Histogram",
    source: "histograms.tsx",
    acceptance:
      "Six explicit unequal intervals use density so rectangle area encodes probability; interval counts and densities match the table.",
    notes:
      "binHistogram takes explicit edges. The final upper edge is included. Pre-binned unequal widths use count divided by total and interval width, with units ms⁻¹.",
  },
  {
    id: "box-plot",
    title: "Box Plot",
    source: "box-plots.tsx",
    acceptance:
      "Three supplied latency summaries and outliers are visible on a milliseconds axis; every supplied statistic remains in the table.",
    notes:
      "The caller supplies quartiles, whiskers and outliers. boxPlotExtent helps set the native axis domain; the package does not choose a statistical convention.",
  },
  {
    id: "waterfall",
    title: "Waterfall",
    source: "waterfall-recipes.tsx",
    acceptance:
      "Signed changes reach −30 then recover to 40; the subtotal is not double counted; the refund subtracts12 and recovery adds82; checkpoint and connector geometry follows computed data.",
    notes:
      "computeWaterfallData distinguishes starts, deltas, subtotals and explicit end checkpoints. Native cells and axes style signed balances without changing arithmetic.",
  },
  {
    id: "sankey",
    title: "Sankey",
    source: "sankeys.tsx",
    acceptance:
      "The140 MWh supply splits into120 MWh processing and20 MWh reserve; processing outputs90 useful and30 loss; inspection exposes exact amounts.",
    notes:
      "Nodes and links are caller-owned. SankeyFinish decorates maintained node/link shapes separately from SankeyLink paint mode. This example provides a keyboard data alternative.",
  },
  {
    id: "heatmap",
    title: "Heatmap",
    source: "heatmap-recipes.tsx",
    acceptance:
      "All25 complete coordinates preserve signed latency values and measured zeros on the fixed−20–20 scale; Plain center colors retain numeric meaning.",
    notes:
      "Heatmap uses native HTML grid/table contracts outside Chart.Root. The numeric scale is explicit; finishes decorate only the rim, preserving the opaque encoded center.",
  },
];
