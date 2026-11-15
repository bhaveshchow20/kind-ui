export const family = {
  id: "funnel",
  examples: [
    {
      id: "funnel",
      title: "Funnel Chart",
      notes: "Checkout sessions in one cohort, measured against its 2,400 starters.",
      acceptance:
        "Original stage order, numeric readouts and first-stage denominators agree across ready and loading variants.",
    },
    {
      id: "funnel-pipeline",
      title: "Weighted pipeline snapshot",
      notes:
        "Current weighted USD amounts can grow between stages; missing, zero and duration metadata remain distinct.",
      acceptance:
        "Generic original records preserve decimal amounts and duration metadata without presenting snapshot ratios as conversion.",
    },
    {
      id: "funnel-comparison",
      title: "Compare cohorts",
      notes:
        "Two signup cohorts share a 1,600-user scale and keep their own starting denominators.",
      acceptance:
        "Matching values have the same cross width; percentage readouts use each cohort's own starter population.",
    },
    {
      id: "funnel-orientation",
      title: "Application workflow",
      notes:
        "Historical application stages use current-to-next boundary taper in either orientation.",
      acceptance:
        "Horizontal and vertical variants retain stage order, boundary widths and immediate-previous denominator readouts.",
    },
  ],
  dataLabels: {
    funnel: {
      caption: "June checkout cohort: sessions and share of starting sessions",
      columns: {
        label: "Stage",
        value: "Sessions",
        denominator: "Starting sessions",
        ratio: "Share of starters (%)",
      },
      rows: [
        { id: "started", label: "Started checkout", value: 2400, denominator: 2400, ratio: 100 },
        { id: "details", label: "Contact details", value: 1800, denominator: 2400, ratio: 75 },
        { id: "delivery", label: "Delivery selected", value: 1440, denominator: 2400, ratio: 60 },
        { id: "payment", label: "Reached payment", value: 1080, denominator: 2400, ratio: 45 },
        { id: "ordered", label: "Placed order", value: 900, denominator: 2400, ratio: 37.5 },
      ],
    },
    "funnel-pipeline": {
      caption: "Current pipeline snapshot: supplied weighted USD and median stage days",
      columns: {
        title: "Stage",
        weightedUsd: "Weighted amount (USD)",
        medianDays: "Median stage days",
      },
      rows: [
        { key: "discovery", title: "Discovery", weightedUsd: 84250.5, medianDays: 3.5 },
        { key: "evaluation", title: "Evaluation", weightedUsd: 126500.75, medianDays: 8 },
        {
          key: "proposal",
          title: "Proposal",
          weightedUsd: "Not reported",
          medianDays: "Unknown duration",
        },
        { key: "negotiation", title: "Negotiation", weightedUsd: 0, medianDays: 0 },
        { key: "committed", title: "Committed", weightedUsd: 63000.25, medianDays: 11 },
      ],
    },
    "funnel-comparison": {
      caption: "Signup cohort comparison: users, shared scale 1,600, each cohort's own starters",
      columns: {
        cohort: "Cohort",
        label: "Stage",
        value: "Users",
        denominator: "Cohort starters",
        ratio: "Share of cohort starters (%)",
      },
      rows: [
        {
          cohort: "June",
          id: "started",
          label: "Started",
          value: 1200,
          denominator: 1200,
          ratio: 100,
        },
        {
          cohort: "June",
          id: "verified",
          label: "Verified",
          value: 840,
          denominator: 1200,
          ratio: 70,
        },
        {
          cohort: "June",
          id: "activated",
          label: "Activated",
          value: 504,
          denominator: 1200,
          ratio: 42,
        },
        {
          cohort: "July",
          id: "started",
          label: "Started",
          value: 1600,
          denominator: 1600,
          ratio: 100,
        },
        {
          cohort: "July",
          id: "verified",
          label: "Verified",
          value: 1040,
          denominator: 1600,
          ratio: 65,
        },
        {
          cohort: "July",
          id: "activated",
          label: "Activated",
          value: 728,
          denominator: 1600,
          ratio: 45.5,
        },
      ],
    },
    "funnel-orientation": {
      caption:
        "Historical application cohort: applications and share of the immediately previous stage",
      columns: {
        label: "Stage",
        value: "Applications",
        denominator: "Previous stage",
        ratio: "Share of previous stage (%)",
      },
      rows: [
        { id: "submitted", label: "Submitted", value: 180, denominator: "—", ratio: "—" },
        { id: "screened", label: "Screened", value: 120, denominator: 180, ratio: 66.7 },
        { id: "interviewed", label: "Interviewed", value: 75, denominator: 120, ratio: 62.5 },
        { id: "offered", label: "Offered", value: 45, denominator: 75, ratio: 60 },
      ],
    },
  },
  variants: {
    funnel: {
      control: "State",
      prop: "state",
      default: "ready",
      options: [
        { value: "ready", label: "Ready" },
        { value: "loading", label: "Loading" },
      ],
    },
    "funnel-orientation": {
      control: "Orientation",
      prop: "orientation",
      default: "horizontal",
      options: [
        { value: "horizontal", label: "Horizontal" },
        { value: "vertical", label: "Vertical" },
      ],
    },
  },
};
