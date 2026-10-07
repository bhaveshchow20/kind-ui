# Kind UI

[![CI](https://github.com/bhaveshchow20/kind-ui/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/bhaveshchow20/kind-ui/actions/workflows/ci.yml)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bhaveshchow20/kind-ui)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@kind-ui/charts)](https://www.npmjs.com/package/@kind-ui/charts)

Composable React charts built on Recharts and Motion. Choose a chart, adapt a complete example and keep control of your data, styling and interactions.

[Documentation](https://kindui.dev/charts/docs/) · [GitHub](https://github.com/bhaveshchow20/kind-ui)

```sh
npm install @kind-ui/charts
```

Import `@kind-ui/charts/styles.css` once at your application entry (the root layout in Next.js). Development builds warn once if chart styles are missing. See the [component API and usage](packages/charts/README.md) for composition, accessibility and motion.

## Start with a complete example

The [Line guide](https://kindui.dev/charts/docs/components/line/) includes a complete TypeScript consumer, a visible data table and copied examples checked with NodeNext, Bundler and Vite. Choose from Line, Area, Bar, Combo, Pie/Donut, Radar, Radial/ActivityRings, Scatter/Bubble, Histogram, BoxPlot, Heatmap, Sankey and Waterfall.

Compose public components with your data, axes and application state. Optional motion, theme-aware colors, fill and background patterns, projected bars, percentage formatting, loading states and interactions share explicit typed contracts. Read the [package API](packages/charts/README.md) for defaults, ownership and limits.

For agents, retrieve the [documentation index](https://kindui.dev/charts/llms.txt), [complete reference](https://kindui.dev/charts/llms-full.txt) and [consumer guidance](https://kindui.dev/charts/markdown/agents/consumer.md). Install the consumer skill with `npx skills add bhaveshchow20/kind-ui --skill kind-ui-charts`. Example setup files and prompts are available from each chart guide.

## Development

Requires Node 22.12+ (CI uses Node 22) and npm 11.9.

```sh
npm ci
npm exec playwright install -- --with-deps chromium
npm run check
```

`npm run dev:chart` starts the maintained public API example. See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) for focused development and validation. See the [changelog](packages/charts/CHANGELOG.md) and [release policy](docs/development.md) for versioning; ordinary feature merges accumulate changesets before one reviewed version PR.

[Security reporting](SECURITY.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [MIT license](LICENSE)

MIT © 2026 Bhavesh Chowdhury.
