export const examples = [
  {
    id: "line",
    title: "Line Chart",
    source: "line-recipes.tsx",
    acceptance:
      "A measured zero remains visible; the missing Thursday observation is a gap; the selected native curve and finish match the source.",
    notes:
      "A native category axis and explicit 0–60 numeric domain frame daily tasks. connectNulls is false; null is missing and zero is measured.",
  },
  {
    id: "area",
    title: "Area Chart",
    source: "area-recipes.tsx",
    acceptance:
      "The area keeps a zero baseline and a missing-value gap; curve and finish reproduce the selected preview.",
    notes:
      "This single-series area uses the same daily tasks as Line. Its fill encodes height above zero; it does not infer stacked or normalized data.",
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
      "Two native axes keep tasks and milliseconds separate; each legend item toggles only its series; zero remains a real observation.",
    notes:
      "Area, bar and line share a ComboChart. Each mark chooses its own dataKey and yAxisId; the host defines axis domains and units.",
  },
  {
    id: "donut",
    title: "Pie Chart",
    source: "pie-recipes.tsx",
    acceptance:
      "Category filtering changes rows and Cells together; included total and shares update; zero and all-hidden remain truthful.",
    notes:
      "hours is the magnitude field. id is category identity. Root visibility requests are applied by the example to rows and matching Cells. A zero innerRadius makes a pie; there is no separate DonutChart export.",
  },
  {
    id: "scatter",
    title: "Scatter Chart",
    source: "scatter-recipes.tsx",
    acceptance:
      "Circle and diamond legend icons match explicit series shapes; x/y keep their units; a measured z zero differs from a missing count; both cohorts appear in the table.",
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
      "Raw samples report accepted, missing, nonfinite and out-of-range observations; unequal intervals use density so rectangle area encodes probability.",
    notes:
      "binHistogram takes explicit edges. The final upper edge is included. Pre-binned unequal widths use count divided by total and interval width, with units ms⁻¹.",
  },
  {
    id: "box-plot",
    title: "Box Plot",
    source: "box-plots.tsx",
    acceptance:
      "Supplied five-number summaries and outliers stay visible in both layouts; exact/zero summaries collapse truthfully; missing summaries draw no mark.",
    notes:
      "The caller supplies quartiles, whiskers and outliers. boxPlotExtent helps set the native axis domain; the package does not choose a statistical convention.",
  },
  {
    id: "waterfall",
    title: "Waterfall",
    source: "waterfall-recipes.tsx",
    acceptance:
      "Signed changes reach −30 then recover to 40; the subtotal is not double counted; zero stays zero; checkpoint and connector geometry follows computed data.",
    notes:
      "computeWaterfallData distinguishes starts, deltas, subtotals and explicit end checkpoints. Native cells and axes style signed balances without changing arithmetic.",
  },
  {
    id: "sankey",
    title: "Sankey",
    source: "sankeys.tsx",
    acceptance:
      "Acyclic flows conserve 100 units through the source; the zero-flow link stays in the table; focus/selection exposes exact flow amounts.",
    notes:
      "Nodes and links are caller-owned. SankeyFinish decorates maintained node/link shapes separately from SankeyLink paint mode. This example provides a keyboard data alternative.",
  },
  {
    id: "heatmap",
    title: "Heatmap",
    source: "heatmap-recipes.tsx",
    acceptance:
      "All 25 coordinates, four measured zeros and three missing samples remain distinct; the fixed −20–20 scale and Paper center colors retain their numeric meaning.",
    notes:
      "Heatmap uses native HTML grid/table contracts outside Chart.Root. The numeric scale is explicit; finishes decorate only the rim, preserving the opaque encoded center.",
  },
];
