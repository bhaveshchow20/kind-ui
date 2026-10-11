# ActivityRings API handoff

```tsx
import { ActivityRings } from "@kind-ui/charts";

<ActivityRings
  aria-label="Daily activity"
  config={{
    move: { label: "Move", color: "#ff2266" },
    exercise: { label: "Exercise", color: "#33aa44" },
    stand: { label: "Stand", color: "#2288ff" },
  }}
  rings={[
    { key: "move", value: 350, domain: [0, 500] },
    { key: "exercise", value: 30, domain: [0, 60] },
    { key: "stand", value: 9, domain: [0, 12] },
  ]}
>
  <ActivityRings.Series>
    <ActivityRings.Labels />
  </ActivityRings.Series>
  <ActivityRings.Tooltip />
  <ActivityRings.Legend />
</ActivityRings>;
```

`ActivityRings` owns its metadata, frame and interaction context. It requires `config`, an accessible name (`aria-label` or `aria-labelledby`) and explicit children. Compose `Series`, `Labels`, `Tooltip` and `Legend` as needed; omitting a part leaves it out. Use `ActivityRings.Content` for custom HTML controls or data alternatives that need the chart context. Interaction, emphasis, nonce and visibility props belong directly on the chart; `frameProps` supplies outer HTML attributes, handlers and refs.

`aria-describedby` includes an original-value data alternative. Config labels, icons, colors and value formatters retain their contracts. Native tooltip sector payload preserves `rawValue` and `progress` (0–100); Recharts uses its `value` field for normalized geometry. The original nested datum also retains `value`. `ActivityRings.Tooltip` displays the original value and accepts native tooltip options, including custom content. Omit the part to disable the tooltip.

Geometry defaults are domain `[0,100]`, a clockwise full sweep from 90 to -270 degrees, inner radius 30%, outer radius 90%, category gap 15%, height 300 and responsive width. Explicit dimensions and styles take precedence. `ActivityRings.Series` supplies tracks and rounded ends; `ActivityRings.Labels` uses `RadialBarLabel` unless custom content is supplied. Ring order follows array order, from inner to outer. Finite values outside each finite increasing domain clamp visually while retaining the original value; invalid values/domains and duplicate/unknown keys throw actionable errors. Empty arrays are valid.

Native chart props control radii, center, angles, gaps, dimensions and motion. Put native series paint, shape, background and geometry props on `ActivityRings.Series`, and native LabelList options on `ActivityRings.Labels`. Per-ring `cellProps` preserves native Cell paint and handlers. Explicit series fill wins over category defaults, and Cell fill wins last. Consumers can omit `ActivityRings.Legend` or supply its custom content when their paint differs from config colors.

For custom radial data and axis domains, use `RadialBarChart` with its required config, accessible name and explicit axes, `RadialBarSeries`, `Cell` and `RadialBarLabel` children. Each chart owns its context; inter-chart coordination uses consumer-controlled state.
