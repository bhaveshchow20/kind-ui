export const comboExamples = [
  {
    id: "combo",
    title: "Production and capacity",
    notes: "Shipped units, available capacity and a production target on one numeric scale.",
    acceptance:
      "Six monthly observations agree across the three composed families, source and hidden data alternative.",
  },
  {
    id: "combo-stacked",
    title: "Revenue and margin",
    notes:
      "Stacked retail and wholesale revenue in USD, with margin percentage on a separate right axis.",
    acceptance:
      "Native stacks and axis IDs remain explicit; controlled legend buttons update marks and tooltip rows.",
  },
  {
    id: "combo-motion",
    extraFiles: { "src/examples/combo-motion/options.tsx": "examples/combo-motion/options.tsx" },
    title: "Family entrances",
    notes: "Independent, shared or line-only entrances with chart-owned motion.",
    acceptance:
      "Selected entrance, complete code and copied source agree; reduced motion displays final geometry.",
  },
  {
    id: "combo-presentation",
    title: "Presentation options",
    notes: "Focus a series through its legend or marks; June is projected.",
    acceptance:
      "Ready and Loading previews match copied source; series patterns, target icon, projected June, point styles and dashed motion remain public composition.",
  },
];
const production = {
  caption: "Monthly production in units",
  columns: {
    period: "Month",
    capacity: "Capacity (units)",
    shipped: "Shipped (units)",
    target: "Target (units)",
  },
};
export const comboDataLabels = {
  combo: production,
  "combo-stacked": {
    caption: "Monthly revenue and margin",
    columns: {
      period: "Month",
      retail: "Retail (USD)",
      wholesale: "Wholesale (USD)",
      margin: "Margin (%)",
    },
  },
  "combo-motion": production,
  "combo-presentation": {
    ...production,
    columns: {
      month: "Month",
      capacity: "Capacity (units)",
      shipped: "Shipped (units)",
      target: "Target (units)",
    },
  },
};
const loadingVariants = {
  control: "State",
  prop: "status",
  default: "ready",
  options: [
    { value: "ready", label: "Ready" },
    { value: "loading", label: "Loading" },
  ],
};
export const comboVariants = {
  "combo-presentation": loadingVariants,

  "combo-motion": {
    control: "Entrance",
    prop: "entrance",
    default: "independent",
    options: [
      { value: "independent", label: "Independent" },
      { value: "together", label: "Together" },
      { value: "lineOnly", label: "Line only" },
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
  id: "combo",
  examples: comboExamples,
  dataLabels: comboDataLabels,
  variants: { ...comboVariants, combo: primaryLoading },
};
