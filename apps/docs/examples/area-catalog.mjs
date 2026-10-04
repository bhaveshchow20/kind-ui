export const areaExamples = [
  {
    id: "area-curves",
    title: "Curve types",
    notes: "Smooth, linear and step-after areas.",
    acceptance: "All twelve observations and selected curve match the complete source.",
  },
  {
    id: "area-stacked",
    title: "Stacked series",
    notes: "Monthly desktop and mobile visitors with consumer-owned legend toggles.",
    acceptance:
      "Both series stack across twelve months; keyboard legend toggles update visibility.",
  },
  {
    id: "area-materials",
    title: "Materials",
    notes: "Plain, paper, clay and glow finishes on native area geometry.",
    acceptance: "The selected material matches the complete source and preview.",
  },
];
export const areaDataLabels = {
  area: { caption: "Visitors", columns: { period: "Month", visitors: "Visitors" } },
  "area-curves": { caption: "Visitors", columns: { period: "Month", visitors: "Visitors" } },
  "area-stacked": {
    caption: "Visitors by device",
    columns: { period: "Month", desktop: "Desktop", mobile: "Mobile" },
  },
  "area-materials": { caption: "Visitors", columns: { period: "Month", visitors: "Visitors" } },
};
export const areaVariants = {
  "area-curves": {
    control: "Curve",
    prop: "curve",
    default: "monotone",
    options: [
      { value: "monotone", label: "Smooth" },
      { value: "linear", label: "Linear" },
      { value: "stepAfter", label: "Step after" },
    ],
  },
  "area-materials": {
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
