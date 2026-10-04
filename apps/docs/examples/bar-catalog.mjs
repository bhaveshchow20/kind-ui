export const barExamples = [
  {
    id: "bar-comparison",
    title: "Grouped and stacked series",
    notes: "Print and digital library loans, with consumer-owned legend visibility.",
    acceptance:
      "Both series and selected arrangement agree with the complete source; legend buttons update visibility.",
  },
  {
    id: "bar-horizontal",
    title: "Horizontal bars",
    notes: "Workshop hours with a numeric X axis and categorical Y axis.",
    acceptance:
      "Five topic labels remain readable beside horizontal bars; source and hidden data agree.",
  },
  {
    id: "bar-materials",
    title: "Materials",
    notes: "Plain, paper, clay and glow on native rounded rectangles.",
    acceptance: "Selected finish agrees with complete source and preview.",
  },
];
export const barDataLabels = {
  bar: { caption: "Weekly pickup orders", columns: { period: "Location", orders: "Orders" } },
  "bar-comparison": {
    caption: "Library loans",
    columns: { period: "Subject", print: "Print", digital: "Digital" },
  },
  "bar-horizontal": { caption: "Workshop hours", columns: { period: "Topic", hours: "Hours" } },
  "bar-materials": {
    caption: "Weekly pickup orders",
    columns: { period: "Location", orders: "Orders" },
  },
};
export const barVariants = {
  "bar-comparison": {
    control: "Arrangement",
    prop: "arrangement",
    default: "grouped",
    options: [
      { value: "grouped", label: "Grouped" },
      { value: "stacked", label: "Stacked" },
    ],
  },
  "bar-materials": {
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
  id: "bar",
  examples: [
    {
      id: "bar",
      title: "Bar Chart",
      notes: "Weekly pickup orders across five locations with opt-in category emphasis.",
      acceptance:
        "Five locations agree with the complete source and accessible hidden data alternative.",
    },
    ...barExamples,
  ],
  dataLabels: barDataLabels,
  variants: barVariants,
};
