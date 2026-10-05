export const histogramExamples = [
  {
    id: "histogram-density",
    title: "Unequal-width density",
    notes: "Probability density across explicit unequal-width response-time intervals.",
    acceptance: "Bin widths follow numeric edges and density area sums to one.",
  },
  {
    id: "histogram-materials",
    title: "Materials",
    notes: "Plain, paper, clay and glow on quantitative histogram rectangles.",
    acceptance: "Selected material matches preview, complete source and copy.",
  },
];
const countRows = [
  { period: "[0, 40)", count: 12 },
  { period: "[40, 80)", count: 15 },
  { period: "[80, 120)", count: 5 },
  { period: "[120, 160)", count: 2 },
  { period: "[160, 200]", count: 2 },
];
const densityRows = [
  { period: "[0, 25)", count: 3, density: 3 / 36 / 25 },
  { period: "[25, 50)", count: 15, density: 15 / 36 / 25 },
  { period: "[50, 100)", count: 12, density: 12 / 36 / 50 },
  { period: "[100, 200]", count: 6, density: 6 / 36 / 100 },
];
export const histogramDataLabels = {
  histogram: {
    caption:
      "Response-time bins in milliseconds; [ includes an edge and ) excludes it. 36 accepted, 1 missing, 0 nonfinite, 1 out of range.",
    columns: { period: "Interval (ms)", count: "Requests" },
    rows: countRows,
  },
  ...Object.fromEntries(
    ["histogram-density", "histogram-materials"].map((id) => [
      id,
      {
        caption:
          "Response-time density; [ includes an edge and ) excludes it. 36 accepted, 1 missing, 0 nonfinite, 1 out of range.",
        columns: { period: "Interval (ms)", count: "Requests", density: "Probability per ms" },
        rows: densityRows,
      },
    ]),
  ),
};
export const histogramVariants = {
  "histogram-materials": {
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

export const family = {
  id: "histogram",
  examples: [
    {
      id: "histogram",
      title: "Histogram",
      notes: "Counts across explicit equal-width response-time intervals.",
      acceptance:
        "All 36 accepted observations and two discarded readings agree with the numeric bins.",
    },
    ...histogramExamples,
  ],
  dataLabels: histogramDataLabels,
  variants: histogramVariants,
};
