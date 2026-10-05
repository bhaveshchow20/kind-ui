# Kind UI

Composable React charts built on Recharts and Motion. Choose a chart, adapt a complete example and keep control of your data, styling and interactions.

```sh
npm install @kind-ui/charts
```

Import `@kind-ui/charts/styles.css` once at your application entry. See the [component API and usage](packages/charts/README.md) for composition, accessibility and motion.

## Local setup

Requires Node 22.12+ (Node 24 recommended) and npm 11.9.

```sh
npm ci
npm exec playwright install -- --with-deps chromium
npm run check
```

`npm run dev:chart` starts the minimal usage example. `check` runs lint, component tests, the actual packed-package gate, strict consumer typechecks, and Chromium interaction checks. Linux browser dependencies may require administrator permission.

`npm run dev:showcase` opens the feature gallery at `/showcase.html` on port 4873. Color presets and a custom color picker are independent of finish; motion is on by default and follows reduced-motion preferences. Chart-family tabs switch between area, bar, line, pie, radar, and radial examples. The showcase offers finishes for Cartesian charts and pie/donut; native geometry remains unchanged.

## Updates

See the [changelog](packages/charts/CHANGELOG.md) for package changes.

## Direction

Build with established UI libraries, not against them. Prefer familiar composition and existing primitives, styling, and motion capabilities. Introduce a new pattern only for a concrete need that existing options do not meet. Future architecture and package boundaries will be reviewed in small steps; compatibility claims require tested consumers.

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). See [development direction and release policy](docs/development.md), [security reporting](SECURITY.md), and our [Code of Conduct](CODE_OF_CONDUCT.md).

MIT © 2026 Bhavesh Chowdhury.

Waterfall technical recipe: open `/waterfalls.html` in the chart example. It uses native numeric floating bars, explicit totals and subtotals, unknown-balance gaps, an accessible data table, and motion enabled by default. See the [Waterfall public contract](packages/charts/README.md#waterfall).

Radar and radial core recipes: open `/polar.html` in the chart example. See [polar recipes](examples/chart/POLAR.md) and the [public component contract](packages/charts/README.md#radar-and-radial-bars).

Box plot primitives accept caller-computed statistics with native quantitative axes. See the [public contract](packages/charts/README.md#box-plot-explicit-statistics) and [recipe studies](examples/chart/BOX-PLOTS.md).

Heatmap matrix and activity recipes: open `/heatmaps.html` in the chart example. See [heatmap recipes and renderer research](examples/chart/HEATMAPS.md) and the [public Heatmap contract](packages/charts/README.md#heatmap).
