# @kind-ui/charts

## 0.5.1

### Patch Changes

- 5fabf25: Reduce redundant chart presentation and Heatmap interaction work while preserving chart APIs, appearance and consumer Motion configuration.

## 0.5.0

### Minor Changes

- 6bf2e99: Require Tailwind v4 source registration and replace the standalone stylesheet with component utilities. Use host semantic theme variables and standard clsx/tailwind-merge class composition. Remove chart-specific styling aliases; use className, style, or locally scoped host variables to customize presentation.
- 91c8269: Replace separate chart providers and configured recipes with one explicit compound API across every chart family. Chart components own their metadata, sizing and shared behavior; child parts determine what renders. Remove public Root/RootProps and configured/composed alternatives. This is a breaking change in the pre-1.0 API. Retain family-specific data and geometry contracts, controlled state, native customization and reduced-motion behavior.
  
  While loading, show only the plot placeholder. Hide chart-owned legends and content until data is ready, preserving their state across loading interruptions.
  
  Keep explicit activity ring labels in sync with controlled visibility while retaining their native label content and geometry.
  
  Preserve category emphasis by data identity across native mark remounts and reordering, and clear it on removal or actual pointer exit.

### Patch Changes

- 1889a2a: Validate malformed containers and sparse records at the existing waterfall, histogram, heatmap, Sankey and BoxPlot data boundaries. Report item and field paths for invalid inputs while preserving numeric, missing-value and consumer-owned geometry contracts. BoxPlot extent calculation reports an actionable error for a missing summary, while summary validation continues to treat null and undefined as missing.

### Migration from 0.4.0

- Remove `@kind-ui/charts/styles.css` imports. Configure Tailwind CSS v4 and register `@kind-ui/charts/dist` with `@source` in your entry CSS. For example, use `@source "../node_modules/@kind-ui/charts/dist";` from `app/globals.css`; paths are relative to the CSS file. Package utilities require an unprefixed Tailwind entry.
- Remove family `Root` wrappers and configured recipe props. Put `config`, an accessible name (`aria-label` or `aria-labelledby`), visibility, interaction, emphasis and `nonce` on the family chart. Add explicit children for every axis, grid, series, tooltip, legend and background you need; configuration no longer creates parts. Replace Line `curve` with `LineChart.Series.type` and move material options onto each series.
- Replace `rootProps` with `frameProps` for outer HTML attributes, styles, handlers and refs. Keep plot sizing, `className` and `style` on the chart. Put contextual HTML in the family's `Content` part. Each chart owns its frame; there is no public `Chart.Frame` part.
- Compose `ActivityRings.Series` and nest `ActivityRings.Labels` inside it. Replace Sankey `nodeConfig` with `config` and renderer props with `SankeyChart.Nodes`/`Links` render callbacks. Sankey legends and tables use chart context; standalone `SankeyLegend` now requires that context.
- Replace Radar selection props with `interaction` using `kind: "series"`, `mode: "focus"`, `eligibleKeys`, `selected` and `onSelectionChange` (or `defaultSelected`). Removed public types include `RootProps`, `ConfiguredLineChartProps`, `ConfiguredLineSeries` and `RadarSelectionProps`.
- Replace chart-specific styling aliases with scoped host variables (`--foreground`, `--border`, `--muted`, `--muted-foreground`, `--popover`, `--popover-foreground`, `--radius`), `className` or `style`. Set plot dimensions directly; themed config colors follow the host's `color-scheme`. Family animation options and reduced-motion behavior remain available.
- Preserve family-specific data, domains, geometry and missing-value semantics. Validators now reject malformed containers and sparse records with item/field paths; missing values should not be converted to zero. Loading hides chart-owned content while preserving mounted state.

See the [installation and family guides](https://kindui.dev/charts/docs/) for complete examples. Release gates check React 19.3.0 and Recharts 3.10.1 with Motion 13.4.6/Tailwind 4.0.0/Vite 6.4.4 and Motion 13.5.1/Tailwind 4.3.3/Vite 8.3.1, plus Next App Router 16.3.8. Peer ranges do not guarantee every combination; these checks do not establish CommonJS or other framework/browser support.

## 0.4.0

### Minor Changes

- 295cd84: Make legend and mark activation focus and dim peers by default without changing geometry, visibility or tooltip values. Hide/show through legend activation now requires explicit interaction mode `visibility`; consumer-controlled visibleSeries and native hide remain available. Bind ActivityRings focus to original ring categories and retain persistent focus during native keyboard inspection.
  
  Hide now suppresses paint and interaction while retaining full-data layout contributions, so surviving domains, stack baselines, grouped slots, radial allocations and pie angles remain unchanged. Category visibility retains original rows and native pointer indices.
  
  Fade dim/restore and hide/show paint in both directions using chart motion controls, retarget interrupted fades from current opacity, and suppress hidden mark hits and accessibility immediately. Legend and tooltip entries retain original values and order, dim inactive entries, and restore smoothly. Disabled data stays disabled during chart or legend hover while pointer inspection continues. Clearing focus keeps legend items visually active. Both hiding and dimming retain an active legend item and its data.

### Patch Changes

- 976a80d: Size animated tooltip digit slots to their rendered tabular glyphs so numbers remain fully visible with fonts such as Geist.
- a66f30d: Add descriptive npm search keywords for React charts, data visualization, Next.js, and supported chart families. Package APIs and peer requirements are unchanged.

## 0.3.0

### Minor Changes

- a7b9be8: Remove the Paper material and Sankey finish, including their rendering and stylesheet rules, for the 0.3.0 API. Supported finishes are Default, Clay and Glow. Default retains the public `plain` token; replace `paper` with `plain`, `clay` or `glow`.

## 0.2.0

### Minor Changes

- dd2fea2: Add static hatch, stripe and duotone bar fills and matching legend swatches independently of material finishes, preserving explicit fill, Cell and custom shape ownership.
- 8dfabe1: Add opt-in horizontal reveal directions for Line and Area entrances and Combo family overrides, preserving the default entrance and native geometry.
- a4f088e: Add an opt-in initial Pie tooltip category with stable identity and terminal interaction/removal clearing.
- 31b4a1d: Allow series configuration labels to be omitted and infer readable labels consistently for built-in legends, tooltips and accessible series text. Explicit labels and series identities retain precedence.
- fae706d: Add loading and loadingLabel props across all chart families, with family-shaped decorative skeleton variations, reduced-motion support, accessible busy state and native entrance on completion. Preserve mounted chart layout and consumer composition.
- 923dfe0: Add opt-in timed dashed LineSeries strokes, isolated from entrance reveal and disabled under reduced motion, hidden series, loading, or chart animation opt-out.
- 49272ee: Add opt-in percentage stack formatting helpers and a default tooltip fraction resolver that retains raw values and explicit formatter ownership.
- 4b6b88c: Add optional decorative Cartesian plot background patterns and consumer-owned custom definitions, separate from series fill encoding.
- 0f92788: Add opt-in caller-selected BarSeries projection patterns and accessible TooltipContent projection status without generating data or overriding consumer paint.
- 3e17665: Add opt-in SankeyNodeLabel with stable node identity, inside/outside placement, value formatting and native text composition.
- 5a4cbd5: Add opt-in PieSeries glowCategories using existing categoryKey identities while preserving native paint, shape and interaction ownership.
- 274f5b9: Add opt-in shared persistent focus and matching mark/legend activation, guarded visibility, category row filtering, accessible reset/veto actions, and node focus binding. Keep visibility as the default and preserve native handler payloads. Normalize Bar/Area pattern opt-out to false for the batched 0.2 API.
- 7508935: Support gradient color stops and light/dark series colors with scoped paint resources and matching legend/tooltip swatches, while retaining string colors and explicit paint precedence.
- b491223: Add AreaSeries pattern fills independent of material and shared dots/lines fill encodings.
- 506595a: Warn once in development when mounted chart roots are missing the stylesheet, with an actionable public CSS import. Preserve explicit stylesheet ownership and Node ESM/SSR imports.
- 53f68d7: Add opt-in point and active-point border treatments for line and area series, with native renderer precedence and a reusable PointMarker.
- 4f9aae1: Allow optional decorative ReactNode icons in Sankey node metadata, composed explicitly with SankeyNodeLabel while preserving native render ownership and stable node IDs.

### Patch Changes

- 42c7e56: Identify the series, color property, theme and stop index in malformed color configuration errors without exposing config values.

## 0.1.1

### Patch Changes

- 3a4332c: Shorten the package README into a quick start with a single install command, chart-family table, accessible Line example and public documentation links. Preserve the detailed API guide in repository documentation. No runtime code changes.

## 0.1.0

### Minor Changes

- 2bde86e: Introduce the initial charts API:
  - Add a configured `LineChart` with typed data/configuration and controlled or uncontrolled series visibility.
  - Provide explicit chart/series compositions for line, area, bar, combo, scatter, pie, radar, radial bar, histogram, box plot, waterfall, Sankey and heatmap views, with their data/statistics helpers and chart-specific materials.
  - Export shared `Root`, `Legend` and tooltip parts, native Recharts composition parts/types, and prop-controlled Motion animation. Consumers retain ownership of data alternatives and explicit axes/layout.
  - Ship ESM runtime/declarations, a React client entry and an opt-in stylesheet. Retain the required React, React DOM, Recharts and Motion peers.

- Integrate the reviewed first-release API additions (#104–106):
  - Add `HeatmapGrid.layout` cell size/gap and independent visual row/column label controls while retaining native headers, roving focus and scrolling.
  - Add opt-in identity-based category paint for Pie/Radial and Sankey node/link metadata, with standalone `SankeyLegend`; explicit native paint/custom renderers retain ownership.
  - Add configured `ActivityRings` with per-ring domains, raw-value tooltip payloads, shared tooltip presentation and native Radial composition as the escape hatch.

### Patch Changes

- bf15f57: Preserve Bar, Histogram, BoxPlot, and Waterfall entrances while automatic axes settle their initial layout. Keep immediate settlement for subsequent geometry, data, visibility, interaction, and reduced-motion changes.
