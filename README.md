# Kind UI

Kind UI is a UI library ecosystem intended to be kind to your AI agentic stack: performant, accessible, extensible, familiar, and easy to compose into agent-driven applications. These are design and verification goals, not delivered guarantees.

This pre-release workspace exports `Root`, `Legend`, `TooltipContent`, `LineChart`, `LineSeries`, `AreaChart`, `AreaSeries`, `BarChart`, `BarSeries`, and `Tooltip` from `@kind-ui/charts`, with animation controlled by each chart’s `animate` prop. Kind owns shared interaction, bounded tooltip placement and controlled series visibility; consumers own data, axes and layout. See the [component API and usage](packages/charts/README.md). Nothing is published to npm; the working package name does not imply ownership or an installation route.

## Local setup

Requires Node 22.12+ (Node 24 recommended) and npm 11.9.

```sh
npm ci
npm exec playwright install -- --with-deps chromium
npm run check
```

`npm run dev:chart` starts the minimal usage example. `check` runs lint, component tests, the actual packed-package gate, strict consumer typechecks, and Chromium interaction checks. Linux browser dependencies may require administrator permission. All packages remain private at `0.0.0`.

## Direction

Build with established UI libraries, not against them. Prefer familiar composition and existing primitives, styling, and motion capabilities. Introduce a new pattern only for a concrete need that existing options do not meet. Future architecture and package boundaries will be reviewed in small steps; compatibility claims require tested consumers.

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). See [development direction and release policy](docs/development.md), [security reporting](SECURITY.md), and our [Code of Conduct](CODE_OF_CONDUCT.md).

Nothing is published or deployed. MIT © 2026 Bhavesh Chowdhury.

Box plot primitives accept caller-computed statistics with native quantitative axes. See the [public contract](packages/charts/README.md#box-plot-explicit-statistics) and [recipe studies](examples/chart/BOX-PLOTS.md).
