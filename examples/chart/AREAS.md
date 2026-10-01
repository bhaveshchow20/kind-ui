# Area recipes

Run `npm ci` and `npm run dev:chart`, then open `/areas.html`. Eight compact examples cover these useful area patterns: smooth, linear, and step interpolation; gradient fill; a threshold; complete stacked areas; percent stacked areas; and a controlled interactive legend. The gallery also includes axes and a data table. Icons use the normal text legend so series names stay visible.

Copy `area-recipes.tsx`, `recipe-motion.tsx`, `use-reduced-motion.ts`, and the area clip rules in `recipes.css`. Import `@kind-ui/charts/styles.css` once. Supply `--chart-1`, `--chart-2`, `--card`, `--border`, `--muted-foreground`, `--ring`, and `--accent` host tokens. The chart, data, series visibility, table, and surrounding copy stay with the host.

`AreaPoint` is `{ period: string; value: number | null }`. `null` leaves a gap in the filled path and stays missing in the tooltip and table. Zero remains zero. `StackedAreaPoint` requires complete numeric `desktop` and `mobile` values: incomplete segments do not define an honest stack. `PercentArea` uses Recharts' `expand` stack offset, percentage ticks, and normalized tooltip entries while leaving host data untouched. Supply nonnegative finite values; an all-zero period has no meaningful share. `InteractiveArea` controls series visibility and lets the remaining areas renormalize.

Motion is optional and off by default. When enabled, one plot clip reveals each area and its outline from left to right. Recharts still owns the area geometry and stack calculation. Pointer movement completes the reveal; focus and reduced-motion behavior follow the existing line and bar recipes. Turn Motion off or respond to reduced-motion preference changes to settle immediately. Tooltip positioning, keyboard fallback, and chart-boundary clamping are shared with the line and bar examples.

The examples keep their Recharts mark props editable and use Kind UI data and copy. Browser checks exercise all eight recipes in static, animated, and reduced-motion modes, plus missing/zero points, percentage stacks, controlled visibility, keyboard tooltips, and 320px layout.
