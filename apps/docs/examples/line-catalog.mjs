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
    id: "line-materials",
    title: "Materials",
    source: "line-recipes.tsx",
    acceptance: "All materials render all 12 observations; code, legend and data table agree.",
    notes: "Default, Clay and Glow line composition.",
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
  "line-materials": { caption: "Visitors", columns: { period: "Month", visitors: "Visitors" } },
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
  "line-materials": {
    control: "Material",
    prop: "appearance",
    default: "default",
    options: [
      { value: "default", label: "Default" },
      { value: "clay", label: "Clay" },
      { value: "glow", label: "Glow" },
    ],
  },
};

// Native chart loading uses the same source in Preview, Code and Copy prompt.
const primaryLoading = {
  control: "State",
  prop: "state",
  default: "ready",
  options: [
    { value: "ready", label: "Ready" },
    { value: "loading", label: "Loading" },
  ],
};
export const family = {
  id: "line",
  examples: [
    {
      id: "line",
      title: "Line Chart",
      source: "line-recipes.tsx",
      acceptance:
        "Twelve monthly visitor observations use a smooth curve; legend visibility, source and data table agree.",
      notes: "A single smooth series with complete monthly visitor data.",
    },
    ...lineExamples,
  ],
  dataLabels: lineDataLabels,
  variants: { ...lineVariants, line: primaryLoading },
};
