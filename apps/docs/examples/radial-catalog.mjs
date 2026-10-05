export const family = {
  id: "radial",
  examples: [
    {
      id: "radial",
      title: "Radial Chart",
      notes: "Three project stages share an explicit 0–100 percent scale.",
      acceptance:
        "Three category-colored rings show 92%, 76% and 58%; labels and hidden data agree.",
    },
    {
      id: "radial-gauge",
      title: "Capacity gauge",
      notes:
        "A semicircular gauge uses the exported RadialBar components with consumer-owned center text.",
      acceptance:
        "72 of 100 GB fills the same arc in both entrance directions; selected source and preview agree.",
    },
    {
      id: "radial-stacked",
      title: "Stacked capacity",
      notes: "64 committed and 22 reserved hours stack on a fixed 100-hour scale.",
      acceptance:
        "Keyboard legend toggles change consumer-owned visibility and native stack allocation.",
    },
  ],
  dataLabels: {
    radial: {
      caption: "Project completion",
      columns: { period: "Stage", progress: "Complete (%)" },
    },
    "radial-gauge": {
      caption: "Storage capacity (100 GB)",
      columns: { period: "Resource", used: "Used (GB)" },
    },
    "radial-stacked": {
      caption: "Team capacity (100 hours)",
      columns: { period: "Month", committed: "Committed hours", reserved: "Reserved hours" },
    },
  },
  variants: {
    "radial-gauge": {
      control: "Entrance direction",
      prop: "direction",
      default: "clockwise",
      options: [
        { value: "clockwise", label: "Clockwise" },
        { value: "anticlockwise", label: "Anticlockwise" },
      ],
    },
  },
};
