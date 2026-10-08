# @kind-ui/charts

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
