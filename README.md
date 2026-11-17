# Kind UI

Composable, interactive charts for React and Next.js. Designed for builders and AI agents.

[Chart gallery](https://github.com/kind-ui/charts) · [Documentation](https://github.com/kind-ui/charts/tree/main/apps/docs/content/docs) · [npm package](https://www.npmjs.com/package/@kind-ui/charts)

[![Kind UI chart gallery: line, area, bar, heatmap, radar and Sankey charts](apps/showcase/public/social/homepage-v1.png)](https://github.com/kind-ui/charts)

[![npm version](https://img.shields.io/npm/v/@kind-ui/charts)](https://www.npmjs.com/package/@kind-ui/charts)
[![CI](https://github.com/kind-ui/charts/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/kind-ui/charts/actions/workflows/ci.yml)
[![Docs](https://github.com/kind-ui/charts/actions/workflows/docs.yml/badge.svg?branch=main)](https://github.com/kind-ui/charts/actions/workflows/docs.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Ask DeepWiki](https://img.shields.io/badge/Ask-DeepWiki-5865F2)](https://deepwiki.com/kind-ui/charts)

[Get started](#get-started) · [Explore charts](#explore-charts) · [AI agents](#ai-agents) · [Contribute](#contribute)

Kind UI Charts (`@kind-ui/charts`) is an open-source data visualization library with typed, composable components. Start with a complete example, then adapt your data, styling and interactions.

- **Compose your chart:** control axes, series, tooltips and legends through public TypeScript APIs
- **Shape the experience:** customize colors, materials, animation, loading states and visibility
- **Build accessibly:** use named charts, keyboard interactions and complete data alternatives

## Get started

Install the package:

```sh
npm install @kind-ui/charts
```

Kind UI uses Tailwind CSS v4. In your Tailwind entry CSS, scan the installed package (paths are relative to the CSS file):

```css
/* src/app.css or app/globals.css */
@import "tailwindcss";
@source "../node_modules/@kind-ui/charts/dist";
```

Import the components you need:

```tsx
import { LineChart } from "@kind-ui/charts";
```

Each chart takes `config`, an accessible name and explicit children such as `LineChart.XAxis`, `LineChart.Series` and `LineChart.Tooltip`. Add only the parts you need.

Build that CSS with your Tailwind v4 Vite or PostCSS integration and import it at your application entry. In Next.js, import your CSS in the root layout and render interactive charts in a client component. The [installation guide](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/index.mdx) includes build configuration and required peer dependencies.

Copy a [complete line chart example](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/line.mdx), including its data and explicit chart parts. Examples render only the graph; your application owns any accessible data alternative. The [package reference](packages/charts/README.md) covers API defaults and limits.

## Explore charts

Browse 13 chart families, with complete examples and code in the documentation:

| Use case | Chart guides |
| --- | --- |
| Trends and comparisons | [Line](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/line.mdx) · [Area](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/area.mdx) · [Bar](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/bar.mdx) · [Combo](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/combo.mdx) |
| Parts and progress | [Pie / Donut](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/pie.mdx) · [Radar](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/radar.mdx) · [Radial / Activity rings](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/radial.mdx) |
| Relationships and distributions | [Scatter / Bubble](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/scatter.mdx) · [Heatmap](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/heatmap.mdx) · [Histogram](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/histogram.mdx) · [Box plot](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/box-plot.mdx) |
| Flow and change | [Sankey](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/sankey.mdx) · [Waterfall](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/charts/waterfall.mdx) |

Explore [materials](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/guides/materials.mdx), [motion](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/guides/motion.mdx) and [accessibility](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/guides/accessibility.mdx) when adapting an example.

## AI agents

Install the Kind UI consumer skill:

```sh
npx skills add kind-ui/charts --skill kind-ui-charts
```

Start with the [agent consumer guide](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/guides/ai-agents.mdx), then read the relevant [chart guide](https://github.com/kind-ui/charts/tree/main/apps/docs/content/docs/charts). Each chart guide includes example setup files and prompts.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and checks. Local development requires Node 22.12+ and npm 11.9.

[Changelog](packages/charts/CHANGELOG.md) · [Release policy](docs/development.md) · [Security reporting](SECURITY.md) · [Code of Conduct](CODE_OF_CONDUCT.md)

Created by [Bhavesh Chowdhury](https://github.com/bhaveshchow20). Free to use under the [MIT license](LICENSE).
