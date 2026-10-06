# Combo recipes

Open `/combos.html` with `npm run dev:chart`. These concise recipes import only
public `@kind-ui/charts` components plus native Recharts axes/grid/reference
lines. Geometry, animation and tooltip internals are not copied into recipes.

- **Workload & latency:** bars for completed tasks, area for queued tasks, and a
  line for milliseconds. Independent named left/right axes keep units distinct.
- **Net cash against plan:** two signed bar stacks and a dashed plan line.
  Wednesday is recorded zero. Thursday is missing and remains a gap.
- **Actuals & forecast:** actual bars stop after March; a step area represents
  capacity and a dashed line with native diamond marks identifies the forecast.

Every chart has its own controlled legend, a shared category tooltip, keyboard
selection and an all-series data table. Legends do not change the source table.
The Motion control uses independent line/area/bar entrance durations. Toggling
Motion deliberately remounts only the recipe plot to demonstrate an entrance;
controlled legend visibility remains mounted. Ordinary hover or color updates
preserve plot DOM and finish an active entrance without replay. Bar
entrance can be disabled separately; reduced motion disables all Kind Motion.
The chart height is explicit and responsive.
No new material styles or dependencies are introduced.

The isolated tarball fixture compares actual mixed SVG geometry to native
Recharts ComposedChart for signed/zero/missing rows, axis IDs, stacks, resize,
data and domain updates. Browser checks exercise shared tooltip/legend/ref/
handlers, keyboard selection, family clips and interruption behavior. Recipes
are also checked at phone width. Evidence is Chromium-specific; these checks do
not establish assistive-technology conformance or broad framework support.
