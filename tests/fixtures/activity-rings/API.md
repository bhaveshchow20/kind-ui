# ActivityRings API handoff

```tsx
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
/>
```

`ActivityRings` owns Root and uses the shared RadialBarChart category identity/color seam. Required chart naming is `aria-label` or `aria-labelledby`; `aria-describedby` is appended to an original-value data alternative. Config labels, icons, colors and value formatters keep their existing contracts. Native tooltip payload retains `value` and adds `progress` (0–100). Default tooltip displays the original value; `tooltip={false}` disables it and a custom content option owns rendering.

Defaults: domain `[0,100]`, clockwise full sweep from 90 to -270 degrees, inner radius 30%, outer radius 90%, category gap 15%, tracks and rounded ends, height 300, responsive width, animation disabled (native default), static legend, visual labels off. Ring order follows array order, from inner to outer. Finite values outside each finite increasing domain clamp visually while retaining the original value; invalid values/domains and duplicate/unknown keys throw actionable errors. Empty arrays are valid.

Native chart props override radii, center, angles, gaps, dimensions and motion. `series` overrides native series paint/shape/background/geometry; `labels` accepts native LabelList options (default content uses RadialBarLabel). Per-ring `cellProps` preserves native Cell paint/handlers. Explicit series fill wins over category defaults, and Cell fill wins last. Custom paint need not match the config legend: consumers own that choice or pass `legend={false}`/custom legend content.

For full native data, axis/domain, tooltip, child composition or inter-chart choreography, continue using `Root`, `RadialBarChart`, axes, `RadialBarSeries`, `Cell` and `RadialBarLabel`. Their composition contracts are unchanged. No universal radial schema or new dependency is introduced.
