# Compact line recipes

Run `npm ci` and `npm run dev:chart`, then open `/recipes.html`. The page offers a compact trend, a target line and a controlled two-series comparison. These are copyable application components, not new package exports.

Copy `line-recipes.tsx`, `use-reduced-motion.ts` and the relevant rules from `recipes.css` into your React 19 host. Import `@kind-ui/charts/styles.css` once. Supply your host's `--chart-1`, `--chart-2`, `--card`, `--border`, `--muted-foreground`, `--accent` and `--ring` tokens. The example's `style.css` provides Geist and monochrome/color tokens; neither Tailwind nor Geist is required by the package.

| Recipe | Data | Use |
| --- | --- | --- |
| `TrendLine` | `TrendPoint[]` | A short single-series history without a visible value axis |
| `TargetLine` | `TrendPoint[]`, `target`, `targetLabel` | A history with a dashed threshold; the threshold extends the value domain |
| `ComparisonLine` | `ComparisonPoint[]`, config and controlled visibility | Current versus previous values, distinguished by solid/filled and dashed/hollow marks |

`TrendPoint` is `{ period: string; value: number | null }`. `ComparisonPoint` has `period`, `current` and `previous`. Pass chronologically ordered points with distinct period labels. These categorical recipes assume one equally spaced point per period; use Recharts' numeric/time axes directly for irregular timestamps. Values should be finite numbers or `null`. Use `null` for missing data, never zero-fill it. Lines keep gaps and tooltips/table alternatives retain zero. Single observations remain visible as dots.

```tsx
<TrendLine
  data={dailyCounts}
  label="Completed tasks"
  formatValue={(value) => `${value} tasks`}
/>
```

The host in `recipes.tsx` owns titles, summary metrics, input data, empty states and native expandable data tables. Keep that text alternative in your host when adapting a recipe. Hidden comparison series remain in its table. `ComparisonLine` handles all-hidden selection separately from an empty dataset. These examples do not fetch data or model loading/streaming state.

## Motion controls

Motion is off by default. The host toggle enables a coordinated Motion SVG clip reveal of each Recharts line group (stroke and resting dots together). Axes and tooltips stay still. The recipe-local `reveal` option sets timing; it does not add a package API:

```tsx
<TrendLine {...props} /> // explicit static path: omit reveal
<TrendLine {...props} reveal={{ durationMs: 500, easing: [0.22, 1, 0.36, 1] }} />
```

The recipe subscribes to the operating-system motion preference; the stylesheet also disables clipping under `prefers-reduced-motion: reduce`. The host also responds to preference changes. Keyboard focus completes the reveal for the mounted chart so values remain available after focus moves away. Newly mounted charts reveal; ordinary palette, visibility and tooltip updates do not replay it. Removing data interrupts the reveal; restoring it mounts fresh lines. Legend hover/focus uses a subtle background change, with a 120ms transition only when motion is enabled and reduced motion is off.

Recharts owns geometry. Its `Line` supports `isAnimationActive`, `animationBegin`, `animationDuration`, `animationEasing`, `dot`, `activeDot` and `shape` in the tested 3.10.1 version. Edit the composition directly if you want engine interpolation instead: remove the recipe reveal and supply those engine props. Avoid two animation systems controlling the same marks. Custom dot/shape rendering requires consumer implementation and testing; this PR does not supply arbitrary path morphing.

## Optional Motion composition

`motion.create(Root)` and `motion.create(Legend)` accept Motion props while retaining native props and React 19 refs. Create these components outside render:

```tsx
import { Root, Legend } from "@kind-ui/charts";
import { motion, MotionConfig } from "motion/react";
const MotionRoot = motion.create(Root);
const MotionLegend = motion.create(Legend);

<MotionConfig reducedMotion="user">
  <MotionRoot config={config} initial={false} animate={{ opacity: 1 }}>
    <MotionLegend initial={false} animate={{ opacity: 1 }} />
    {/* Compose Recharts here; MotionRoot animates the outer div, not line paths. */}
  </MotionRoot>
</MotionConfig>
```

Plain `Root`/`Legend` do not themselves accept `animate`, `variants` or `exit`. Motion is a workspace development dependency used by the optional recipes and a packed-consumer compatibility fixture. It is absent from package dependencies; all hosts copying this recipe file must install Motion, including when `reveal` is omitted. The fixture checks Motion 13.4.6 with React 19.3.0; it does not promise every Motion gesture/layout/exit combination. Motion can still animate opacity under its reduced-motion setting, so hosts needing no animation at all must explicitly disable it.

`npm run check` checks strict packed consumers, component contracts and browser behavior. CI saves real screenshots and a short motion recording in the chart artifacts. Chromium checks are not a screen-reader conformance claim.
