export const sankeyExamples = [
  {
    id: "sankey",
    title: "Energy allocation",
    notes: "180 MWh across nine nodes, three stages and eighteen balanced flows.",
    acceptance:
      "All eighteen routes retain their IDs; selection, tooltip units and hidden data alternative agree.",
  },
  {
    id: "sankey-config",
    title: "Configured flows",
    notes: "One node-ID metadata map supplies default node/source-link colors and a static legend.",
    acceptance:
      "Four named nodes and four flows share configured paint, tooltip values and the complete data alternative.",
  },
  {
    id: "sankey-finishes",
    title: "Flow finishes",
    notes: "Default, Clay and Glow on native gradient flow geometry.",
    acceptance: "Selected finish matches the preview, complete source and copied prompt.",
  },
];
const rows = [
  {
    id: "solar-north",
    source: "solar",
    target: "north",
    value: 30,
  },
  {
    id: "solar-central",
    source: "solar",
    target: "central",
    value: 20,
  },
  {
    id: "solar-south",
    source: "solar",
    target: "south",
    value: 10,
  },
  {
    id: "wind-north",
    source: "wind",
    target: "north",
    value: 20,
  },
  {
    id: "wind-central",
    source: "wind",
    target: "central",
    value: 30,
  },
  {
    id: "wind-south",
    source: "wind",
    target: "south",
    value: 30,
  },
  {
    id: "hydro-north",
    source: "hydro",
    target: "north",
    value: 20,
  },
  {
    id: "hydro-central",
    source: "hydro",
    target: "central",
    value: 10,
  },
  {
    id: "hydro-south",
    source: "hydro",
    target: "south",
    value: 10,
  },
  {
    id: "north-homes",
    source: "north",
    target: "homes",
    value: 35,
  },
  {
    id: "north-industry",
    source: "north",
    target: "industry",
    value: 25,
  },
  {
    id: "north-services",
    source: "north",
    target: "services",
    value: 10,
  },
  {
    id: "central-homes",
    source: "central",
    target: "homes",
    value: 15,
  },
  {
    id: "central-industry",
    source: "central",
    target: "industry",
    value: 30,
  },
  {
    id: "central-services",
    source: "central",
    target: "services",
    value: 15,
  },
  {
    id: "south-homes",
    source: "south",
    target: "homes",
    value: 10,
  },
  {
    id: "south-industry",
    source: "south",
    target: "industry",
    value: 15,
  },
  {
    id: "south-services",
    source: "south",
    target: "services",
    value: 25,
  },
];
export const sankeyDataLabels = {
  "sankey-config": {
    caption: "Configured energy allocation (MWh)",
    columns: { id: "Flow", source: "Source ID", target: "Target ID", value: "MWh" },
    rows: [
      { id: "solar-homes", source: "solar", target: "homes", value: 35 },
      { id: "solar-industry", source: "solar", target: "industry", value: 25 },
      { id: "wind-homes", source: "wind", target: "homes", value: 15 },
      { id: "wind-industry", source: "wind", target: "industry", value: 25 },
    ],
  },
  sankey: {
    caption: "Illustrative energy allocation (MWh)",
    columns: { id: "Flow", source: "Source ID", target: "Target ID", value: "MWh" },
    rows,
  },
  "sankey-finishes": {
    caption: "Illustrative energy allocation (MWh)",
    columns: { id: "Flow", source: "Source ID", target: "Target ID", value: "MWh" },
    rows,
  },
};
export const sankeyVariants = {
  "sankey-finishes": {
    control: "Finish",
    prop: "finish",
    default: "plain",
    options: [
      { value: "plain", label: "Default" },
      { value: "clay", label: "Clay" },
      { value: "glow", label: "Glow" },
    ],
  },
};

export const family = {
  id: "sankey",
  examples: sankeyExamples,
  dataLabels: sankeyDataLabels,
  variants: sankeyVariants,
};
