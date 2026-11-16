# Charts public API reference

The maintained [package reference](../packages/charts/README.md) documents public exports, composition, defaults and ownership limits. The [complete documentation](https://github.com/kind-ui/charts/tree/main/apps/docs/content/docs) adds generated TypeScript API tables and copied consumers checked with strict NodeNext/Bundler resolution and Vite builds.

## Choose a family

| Family | Complete examples and API |
| --- | --- |
| Line | [Line](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/line.mdx) |
| Area | [Area](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/area.mdx) |
| Bar | [Bar](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/bar.mdx) |
| Combo | [Combo](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/combo.mdx) |
| Pie / Donut | [Pie](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/pie.mdx) |
| Radar | [Radar](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/radar.mdx) |
| Radial / ActivityRings | [Radial](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/radial.mdx) |
| Scatter / Bubble | [Scatter](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/scatter.mdx) |
| Histogram | [Histogram](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/histogram.mdx) |
| Box plot | [Box plot](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/box-plot.mdx) |
| Heatmap | [Heatmap](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/heatmap.mdx) |
| Sankey | [Sankey](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/sankey.mdx) |
| Waterfall | [Waterfall](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/waterfall.mdx) |

## Shared composition and presentation

Use direct named chart imports from `@kind-ui/charts` and build Tailwind v4 CSS with the installed package in your source paths. Each chart takes config, an accessible name and explicit parts. Applications own data, units, domains, accessible names, data alternatives and request state. Each family reference specifies its native renderer, refs, handlers, visibility, missing-value and motion limits.

Shared references cover [Chart frame](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/chart-components/chart.mdx), [SeriesConfig](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/chart-components/series-config.mdx), [Legend](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/chart-components/legend.mdx), [Tooltip](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/chart-components/tooltip.mdx), responsive sizing, axes, grids and labels.

The [customization guide](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/line.mdx) covers inferred labels, theme-aware gradients, loading, fill/background patterns, projected bars, percentage stacks, point markers, dashed/directional motion, Pie pinning/glow, Sankey labels/icons and chart interactions. Its complete options source is included in the checked Combo consumer. Read its API tables, defaults and ownership limits before choosing an option.

## Agent retrieval and verification

Start with the [agent consumer guide](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/agents/consumer.mdx), then retrieve the relevant [documentation source](https://github.com/kind-ui/charts/tree/main/apps/docs/content/docs) and complete example setup files. Install the repository consumer skill with `npx skills add kind-ui/charts --skill kind-ui-charts`.

Homepage (`apps/showcase`) and docs (`apps/docs`) own the maintained examples. Internal regression fixtures in `tests/fixtures` validate package and browser contracts. See [CONTRIBUTING.md](../CONTRIBUTING.md) for library/package/browser checks and [release automation](release-automation.md) for exact artifact publication.
