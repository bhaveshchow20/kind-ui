# Compact bar recipes

Run `npm run dev:chart` and open `/bars.html`. Ten host compositions cover vertical, horizontal, grouped, stacked, labeled, custom-labeled, category-colored, highlighted, signed and interactive bars. They use public imports from `@kind-ui/charts`, Recharts. `BarChart` and `BarSeries` are maintained public package exports with the same `animate` contract as line. There are no new dependencies.

Use `BarChart`, `BarSeries` and `Tooltip` directly, or adapt the data/axes/labels from `bar-recipes.tsx`. No chart, motion or tooltip implementation needs copying. Import `@kind-ui/charts/styles.css` once and supply the theme tokens described in [the line recipe guide](RECIPES.md). The host owns headings, summaries, empty states and the accessible data table; keep an equivalent text alternative when adapting the recipes.

```tsx
import { VerticalBars, StackedBars } from "./bar-recipes";

<VerticalBars
  data={[{ category: "Mon", value: 12 }, { category: "Tue", value: null }]}
  label="Completed tasks"
  formatValue={(value) => `${value} tasks`}
/>

<StackedBars
  data={[{ category: "Mon", primary: 12, secondary: 2 }]}
  label="Task outcomes"
  config={{
    primary: { label: "Completed", color: "var(--chart-1)" },
    secondary: { label: "Retried", color: "var(--chart-2)" },
  }}
  motion={{ revealDurationMs: 1000 }}
/>
```

Use distinct category labels and finite values in the desired display order. Count and stacked recipes expect nonnegative inputs; `SignedBars` also accepts negative inputs. The count variants use a zero-based axis. `SignedBars` accepts finite positive and negative values, zero and null, includes a zero reference line, and reveals outward from the engine’s zero coordinate. Its gallery control exercises mixed signs, all-negative values and all-zero values. Use direct Recharts composition for another scale or signed stacks. `BarPoint` has `category` and nullable `value`; `GroupedBarPoint` has `category` and nullable `primary`/`secondary`. `StackedBarPoint` requires two numbers, because a missing segment cannot define a complete total. Exclude incomplete categories from a stack and explain them in the host, or use a grouped chart to show known and missing values separately. Types do not validate incoming JSON; validate external data before rendering.

Zero has no artificial minimum bar size. Null is absent geometry and remains “No data” in tables. Tooltips show missing series alongside available values; entirely missing categories show no tooltip. Zero remains available data. Grouped values are adjacent; stacked values share a baseline and sum. Both pair recipes require metadata for `primary` and `secondary`. The static legend identifies series; it does not filter them. Categories and tables retain their order on resize.

Motion is off when the recipe's `motion` prop is omitted. When enabled, one-second series plot clips reveals bars from the engine’s zero coordinate (bottom/left for positive counts, outward in both directions for signed values); Recharts still owns bar geometry. Stacked segments share chart timing and reveal from their axis zero coordinate. Tooltips follow both mouse coordinates and clamp to chart bounds, with engine coordinates as the keyboard fallback. Positions use the same retargetable spring as line recipes. `revealDurationMs`, `revealEasing` and `hoverTransition` customize public bar motion. Completed reveals remove their clip so resizing updates geometry immediately. Palette changes do not replay the reveal. Pointer interaction or focus completes it; removing a chart cancels its reveal and mounting fresh data starts a new one. Live reduced-motion changes or explicit off remove the clip and settle tooltip movement immediately. Motion is an established required charts peer, including static use.

Use left/right arrow keys after focusing a chart, including the horizontal variant (Left advances down its categories), and Escape to dismiss the tooltip (Recharts 3.10.1 behavior). Browser tests cover geometry, zero/missing keyboard tooltips, narrow layouts, interrupted reveals and the shared line/tooltip regressions. CI saves screenshots. No video recording is required; these tests do not establish screen-reader conformance.

For line recipes, see [the line recipe guide](RECIPES.md). For curves, stacked shares and area fills, see [the area recipe guide](AREAS.md).

## Additional compositions

| Component | Additional input | Behavior |
| --- | --- | --- |
| `LabeledBars` | Same as `VerticalBars` | Numeric labels above bars, including zero |
| `CustomLabelBars` | Same as `HorizontalBars` | Category labels inside wide bars or above short bars; numeric values outside |
| `CategoryBars` | `ColoredBarPoint[]`: `BarPoint` plus CSS `color` | Per-category colors with matching tooltip indicators |
| `HighlightedBars` | `highlightedCategory: string | null` | A persistent outlined category; selection stays in the host |
| `SignedBars` | `BarPoint[]`, including negative values | Signed geometry and a visible zero baseline |
| `InteractiveBars` | `GroupedBarPoint[]`, pair config, `activeSeries`, `formatCategory` | One selected series from a dense history; the host owns buttons and totals |

`HighlightedBars` does not invent geometry for a selected zero or missing value. The text table still records it. `CategoryBars` accepts CSS colors so the host can use its own theme tokens; the gallery supplies four colors in both palettes. Color is not the only identifier: category labels and data tables remain available.

The interactive gallery uses 90 daily observations with deterministic sample values, explicit UTC date formatting and native series-selection buttons. Switching series updates engine geometry immediately and does not start another entrance animation after completion. Its table retains both series. The recipes do not model fetching or streaming.

Copyable implementations keep `BarSeries`, `Cell`, `LabelList`, `Rectangle`, axes and `ReferenceLine` visible in the composition. The host frame composes public maintained components; it does not encode variants in a universal configuration. The isolated tarball consumer proves `BarChart`/`BarSeries` through public imports; recipe typechecks verify the host compositions. Browser coverage checks all ten variants with static, enabled and reduced motion at narrow widths, plus label placement, category colors, highlighting, signed domains, dense selection, keyboard tooltips and interruption.
