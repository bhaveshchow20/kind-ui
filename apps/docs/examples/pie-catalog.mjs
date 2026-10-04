export const pieExamples = [
  {
    id: "pie",
    title: "Pie and Donut",
    notes: "A complete 1,000-hour team allocation with category labels and percentage labels.",
    acceptance: "Shape, percentage labels, tooltip and source agree.",
  },
  {
    id: "pie-visibility",
    title: "Controlled categories",
    notes: "Consumer-owned category filtering and selected total.",
    acceptance: "Legend buttons filter rows and Cells; tooltip category identity matches config.",
  },
  {
    id: "pie-materials",
    title: "Pie materials",
    notes: "Native donut sectors with plain, paper, clay or glow finishes.",
    acceptance: "Selected finish matches full source and preview.",
  },
];
export const pieDataLabels = Object.fromEntries(
  pieExamples.map(({ id }) => [
    id,
    {
      caption: "Team allocation (1,000 hours)",
      columns: { key: "Team", hours: "Hours", share: "Share of total" },
    },
  ]),
);
export const pieVariants = {
  pie: {
    control: "Shape",
    prop: "shape",
    default: "pie",
    options: [
      { value: "pie", label: "Pie" },
      { value: "donut", label: "Donut" },
    ],
  },
  "pie-materials": {
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
