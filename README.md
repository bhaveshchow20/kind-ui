# Kind UI

Kind UI is a UI library ecosystem intended to be kind to your AI agentic stack: performant, accessible, extensible, familiar, and easy to compose into agent-driven applications. These are design and verification goals, not delivered guarantees.

This pre-release workspace exports `Root`, `Legend`, `SankeyLegend`, `ActivityRings`, `TooltipContent`, `LineChart`, `LineSeries`, `AreaChart`, `AreaSeries`, `BarChart`, `BarSeries`, `ComboChart`, `PieChart`, `PieSeries`, `RadarChart`, `RadarSeries`, `RadialBarChart`, `RadialBarSeries`, `RadialBarLabel`, `ScatterChart`, `ScatterSeries`, `ScatterTooltip`, `ScatterTooltipContent`, and `Tooltip` from `@kind-ui/charts`, with animation controlled by each chart’s `animate` prop. Kind owns shared interaction, bounded tooltip placement and controlled series visibility; consumers own data, axes and layout. Supported native composition Components and prop types are available through the same package import. See the [component API and usage](packages/charts/README.md). Nothing is published to npm; the working package name does not imply ownership or an installation route.

## Local setup

Requires Node 22.12+ (Node 24 recommended) and npm 11.9.

```sh
npm ci
npm exec playwright install -- --with-deps chromium
npm run check
```

`npm run dev:chart` starts the minimal usage example. `check` runs lint, component tests, the actual packed-package gate, strict consumer typechecks, and Chromium interaction checks. Linux browser dependencies may require administrator permission. The workspace remains private at `0.0.0`; `@kind-ui/charts` is the reviewed public `0.1.0` candidate, still unpublished. Publishing remains disabled.

`npm run dev:showcase` opens the feature gallery at `/showcase.html` on port 4873. Color presets and a custom color picker are independent of finish; motion is on by default and follows reduced-motion preferences. Chart-family tabs switch between area, bar, line, pie, radar, and radial examples. The showcase offers finishes for Cartesian charts and pie/donut; native geometry remains unchanged.

## Charts 0.1.0 candidate

The [package README](packages/charts/README.md#installation-and-version) records exact-version installation, required peers and stylesheet imports. The [changelog](packages/charts/CHANGELOG.md) records the initial API and entrance-settlement fix. Before publication, validate the reviewed local tarball; the npm install command is reserved for the authorized release. Version-matched package documentation, the GitHub README and both sites must be ready before mass release. Docs and showcase deployment are separate launch steps.

## Direction

Build with established UI libraries, not against them. Prefer familiar composition and existing primitives, styling, and motion capabilities. Introduce a new pattern only for a concrete need that existing options do not meet. Future architecture and package boundaries will be reviewed in small steps; compatibility claims require tested consumers.

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). See [development direction and release policy](docs/development.md), [security reporting](SECURITY.md), and our [Code of Conduct](CODE_OF_CONDUCT.md).

No packages are published. MIT © 2026 Bhavesh Chowdhury.

Waterfall technical recipe: open `/waterfalls.html` in the chart example. It uses native numeric floating bars, explicit totals and subtotals, unknown-balance gaps, an accessible data table, and motion enabled by default. See the [Waterfall public contract](packages/charts/README.md#waterfall).

Radar and radial core recipes: open `/polar.html` in the chart example. See [polar recipes](examples/chart/POLAR.md) and the [public component contract](packages/charts/README.md#radar-and-radial-bars).

Box plot primitives accept caller-computed statistics with native quantitative axes. See the [public contract](packages/charts/README.md#box-plot-explicit-statistics) and [recipe studies](examples/chart/BOX-PLOTS.md).

Heatmap matrix and activity recipes: open `/heatmaps.html` in the chart example. See [heatmap recipes and renderer research](examples/chart/HEATMAPS.md) and the [public Heatmap contract](packages/charts/README.md#heatmap).
