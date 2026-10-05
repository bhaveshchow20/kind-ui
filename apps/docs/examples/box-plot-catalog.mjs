export const boxPlotExamples = [
  {
    id: "box-plot-edge-cases",
    title: "Collapsed and missing summaries",
    notes: "Equal quartiles, zero, null and negative values retain their native semantics.",
    acceptance:
      "Stable and Zero are line-only, Pending has no mark, and Variable includes both outliers.",
  },
  {
    id: "box-plot-horizontal",
    title: "Horizontal distributions",
    notes: "Response time summaries mapped to a numeric X axis.",
    acceptance: "All three summaries retain the same numeric values in horizontal geometry.",
  },
  {
    id: "box-plot-materials",
    title: "Materials",
    notes: "Plain, paper, clay and glow finishes preserve summary coordinates.",
    acceptance: "Selected material, complete source and copied source agree.",
  },
];
const latencyLabels = {
  caption: "Caller-computed response time summaries, in milliseconds",
  columns: {
    period: "Endpoint",
    lowerWhisker: "Lower whisker (ms)",
    q1: "Q1 (ms)",
    median: "Median (ms)",
    q3: "Q3 (ms)",
    upperWhisker: "Upper whisker (ms)",
    outlier: "Outlier (ms)",
  },
};
export const boxPlotDataLabels = {
  "box-plot-edge-cases": {
    caption: "Caller-computed change summaries, in percentage points; missing values are not zero",
    columns: { period: "Group", summary: "Summary (percentage points)" },
    rows: [
      {
        period: "Stable",
        summary: "Lower whisker, Q1, median, Q3 and upper whisker: 5. No outliers.",
      },
      {
        period: "Zero",
        summary: "Lower whisker, Q1, median, Q3 and upper whisker: 0. No outliers.",
      },
      { period: "Pending", summary: "Missing summary; no mark." },
      {
        period: "Variable",
        summary:
          "Lower whisker: -12; Q1: -5; median: 1; Q3: 8; upper whisker: 18; outliers: -20, 24.",
      },
    ],
  },
  "box-plot": latencyLabels,
  "box-plot-horizontal": latencyLabels,
  "box-plot-materials": latencyLabels,
};
export const boxPlotVariants = {
  "box-plot-materials": {
    control: "Material",
    prop: "material",
    default: "paper",
    options: [
      { value: "paper", label: "Paper" },
      { value: "plain", label: "Plain" },
      { value: "clay", label: "Clay" },
      { value: "glow", label: "Glow" },
    ],
  },
};
export const boxPlotPrimary = {
  id: "box-plot",
  title: "BoxPlot",
  notes: "Compare three caller-computed response time distributions, in milliseconds.",
  acceptance: "Quartiles, whiskers and outliers match the complete source and hidden data table.",
};

export const family = {
  id: "box-plot",
  examples: [boxPlotPrimary, ...boxPlotExamples],
  dataLabels: boxPlotDataLabels,
  variants: boxPlotVariants,
};
