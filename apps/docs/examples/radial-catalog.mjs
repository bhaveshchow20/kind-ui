export const family = {
  id: "radial",
  examples: [
    {
      id: "radial",
      title: "Radial Chart",
      notes: "Three project stages share an explicit 0–100 percent scale.",
      acceptance:
        "Three category-colored rings retain 92%, 76% and 58% in tooltip and hidden data; optional labels agree.",
    },
    {
      id: "radial-activity",
      title: "Activity rings",
      notes:
        "Three original values use their own domains; tracks, tooltip and static legend come from ActivityRings.",
      acceptance:
        "Move350/500, Exercise30/60 and Stand9/12 normalize to70%,50%,75% while retaining original units and motion-off defaults.",
    },
    {
      id: "radial-gauge",
      title: "Capacity gauge",
      notes:
        "A semicircular gauge uses the exported RadialBar components with optional consumer-owned center text.",
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
    "radial-activity": {
      caption: "Daily activity: Move (kcal), Exercise (minutes), Stand (hours)",
      columns: { key: "Activity", value: "Original value" },
      rows: [
        { key: "move", value: 350 },
        { key: "exercise", value: 30 },
        { key: "stand", value: 9 },
      ],
    },
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
    "radial-activity": {
      control: "State",
      prop: "state",
      default: "ready",
      options: [
        { value: "ready", label: "Ready" },
        { value: "loading", label: "Loading" },
      ],
    },
    radial: {
      control: "Labels",
      prop: "labels",
      default: "hidden",
      options: [
        { value: "hidden", label: "Hidden" },
        { value: "visible", label: "Visible" },
        { value: "loading", label: "Loading" },
      ],
    },
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
