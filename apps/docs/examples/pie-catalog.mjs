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
    acceptance: "Legend buttons filter rows; category colors and tooltip identity match config.",
  },
  {
    id: "pie-materials",
    title: "Pie materials",
    notes: "Native donut sectors with Default, Clay or Glow finishes.",
    acceptance: "Selected finish matches full source and preview.",
  },
  {
    id: "pie-rounded",
    title: "Rounded and petal sectors",
    notes:
      "Native cornerRadius and paddingAngle produce rounded pies, rounded donuts and a petal donut without custom shapes.",
    acceptance:
      "Geometry selection matches copied source; category identity and the 1,000-hour data alternative remain unchanged.",
  },
  {
    id: "pie-interaction",
    title: "Category focus and initial inspection",
    notes:
      "A Root-bound donut starts with Default paint and initially inspects Service. Choose Selective glow for its halo. Activate a slice or legend to focus; Escape clears focus.",
    acceptance:
      "Original category IDs drive Root binding, shared focus, the initial tooltip and selective glow. Loading preserves layout.",
  },
];
export const pieDataLabels = Object.fromEntries(
  pieExamples.map(({ id }) => [
    id,
    id === "pie-interaction"
      ? { caption: "Allocation", columns: { id: "Category", value: "Allocation" } }
      : {
          caption: "Team allocation (1,000 hours)",
          columns: { key: "Team", hours: "Hours", share: "Share of total" },
        },
  ]),
);
export const pieVariants = {
  "pie-interaction": {
    control: "State",
    prop: "status",
    default: "ready",
    options: [
      { value: "ready", label: "Ready" },
      { value: "loading", label: "Loading" },
      { value: "selective-glow", label: "Selective glow" },
    ],
  },
  "pie-rounded": {
    control: "Geometry",
    prop: "geometry",
    default: "rounded-donut",
    options: [
      { value: "rounded-pie", label: "Rounded pie" },
      { value: "rounded-donut", label: "Rounded donut" },
      { value: "petal-donut", label: "Petal donut" },
    ],
  },
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
    default: "plain",
    options: [
      { value: "plain", label: "Default" },
      { value: "clay", label: "Clay" },
      { value: "glow", label: "Glow" },
    ],
  },
};

export const family = {
  id: "pie",
  examples: pieExamples,
  dataLabels: pieDataLabels,
  variants: pieVariants,
};
