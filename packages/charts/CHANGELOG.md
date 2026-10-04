# @kind-ui/charts

## 0.1.0

### Minor Changes

- 2bde86e: Introduce the initial charts API:
  - Add a configured `LineChart` with typed data/configuration and controlled or uncontrolled series visibility.
  - Provide explicit chart/series compositions for line, area, bar, combo, scatter, pie, radar, radial bar, histogram, box plot, waterfall, Sankey and heatmap views, with their data/statistics helpers and chart-specific materials.
  - Export shared `Root`, `Legend` and tooltip parts, native Recharts composition parts/types, and prop-controlled Motion animation. Consumers retain ownership of data alternatives and explicit axes/layout.
  - Ship ESM runtime/declarations, a React client entry and an opt-in stylesheet. Retain the required React, React DOM, Recharts and Motion peers.

### Patch Changes

- bf15f57: Preserve Bar, Histogram, BoxPlot, and Waterfall entrances while automatic axes settle their initial layout. Keep immediate settlement for subsequent geometry, data, visibility, interaction, and reduced-motion changes.
