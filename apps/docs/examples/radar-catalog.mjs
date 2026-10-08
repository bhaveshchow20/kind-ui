export const radarExamples = [
  {
    id: "radar",
    title: "Radar Chart",
    notes: "Six comparable research dimensions for two products on a fixed 0–100 scale.",
    acceptance: "Distinct Studio and Field series retain the complete data and numeric domain.",
  },
  {
    id: "radar-selection",
    title: "Series selection",
    notes: "Controlled persistent selection, independent of native spoke inspection.",
    acceptance:
      "Click, Enter and Space toggle series; Escape clears selection without changing visibility.",
  },
  {
    id: "radar-materials",
    title: "Materials",
    notes: "Default, Clay and Glow on native radar polygons.",
    acceptance: "Selected finish agrees with complete source and preview.",
  },
];
export const radarDataLabels = Object.fromEntries(
  radarExamples.map(({ id }) => [
    id,
    {
      caption: "Product research scores out of 100",
      columns: { period: "Dimension", studio: "Studio", field: "Field" },
    },
  ]),
);
export const radarVariants = {
  "radar-materials": {
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
  id: "radar",
  examples: radarExamples,
  dataLabels: radarDataLabels,
  variants: { ...radarVariants, radar: primaryLoading },
};
