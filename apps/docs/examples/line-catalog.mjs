export const lineExamples = [
  {
    id: "line-smooth",
    title: "Curve types",
    source: "line-recipes.tsx",
    acceptance: "Straight lines renders all 12 observations; code, legend and data table agree.",
    notes: "Linear curve override.",
  },
  {
    id: "line-comparison",
    title: "Multiple series",
    source: "line-recipes.tsx",
    acceptance: "Multiple series renders all 12 observations; code, legend and data table agree.",
    notes: "Multiple series line composition.",
  },
  {
    id: "line-markers",
    title: "Dots and labels",
    source: "line-recipes.tsx",
    acceptance: "Dots and labels renders all 7 observations; code, legend and data table agree.",
    notes: "Dots and labels line composition.",
  },
  {
    id: "line-paper",
    title: "Materials",
    source: "line-recipes.tsx",
    acceptance: "Paper renders all 12 observations; code, legend and data table agree.",
    notes: "Paper line composition.",
  },
];

export const lineDataLabels = {
  line: { caption: "Visitors", columns: { period: "Month", visitors: "Visitors" } },
  "line-smooth": { caption: "Visitors", columns: { period: "Month", visitors: "Visitors" } },
  "line-comparison": {
    caption: "Revenue and target ($ thousands)",
    columns: { period: "Month", actual: "Revenue ($k)", target: "Target ($k)" },
  },
  "line-markers": {
    caption: "Response time (milliseconds)",
    columns: { period: "Day", response: "Response time (ms)" },
  },
  "line-paper": { caption: "Visitors", columns: { period: "Month", visitors: "Visitors" } },
};

export const lineVariants = {
  "line-smooth": {
    control: "Curve",
    prop: "curve",
    default: "monotone",
    options: [
      { value: "monotone", label: "Smooth" },
      { value: "linear", label: "Linear" },
      { value: "stepAfter", label: "Step after" },
    ],
  },
  "line-paper": {
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
