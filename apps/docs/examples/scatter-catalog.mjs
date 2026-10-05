export const scatterExamples = [
  {
    id: "scatter",
    title: "Scatter Chart",
    notes: "Eight task observations on numeric latency and acceptance axes.",
    acceptance:
      "Both cohorts retain quantitative coordinates; legend visibility and complete source agree.",
  },
  {
    id: "scatter-bubble",
    title: "Bubble size",
    notes: "Request volume adds a third dimension, including raw zero and missing measurements.",
    acceptance: "Native bubble areas vary; Classify reports 0k and Extract reports No data.",
  },
  {
    id: "scatter-materials",
    title: "Materials",
    notes: "Four finishes preserve native bubble geometry.",
    acceptance: "Selected material matches the preview, full source and copied prompt.",
  },
];
export const scatterDataLabels = {
  scatter: {
    caption: "Task latency and acceptance by cohort",
    columns: {
      period: "Task",
      cohort: "Cohort",
      latency: "Latency (ms)",
      acceptance: "Acceptance (%)",
    },
  },
  "scatter-bubble": {
    caption: "Task latency, acceptance and request volume",
    columns: {
      period: "Task",
      latency: "Latency (ms)",
      acceptance: "Acceptance (%)",
      requests: "Requests (k; blank means missing)",
    },
  },
  "scatter-materials": {
    caption: "Task latency, acceptance and request volume",
    columns: {
      period: "Task",
      latency: "Latency (ms)",
      acceptance: "Acceptance (%)",
      requests: "Requests (k; blank means missing)",
    },
  },
};
export const scatterVariants = {
  "scatter-materials": {
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
  id: "scatter",
  examples: scatterExamples,
  dataLabels: scatterDataLabels,
  variants: scatterVariants,
};
