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

Shared references cover [Chart frame](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/building-blocks/chart.mdx), [SeriesConfig](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/building-blocks/series-config.mdx), [Legend](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/building-blocks/legend.mdx), [Tooltip](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/building-blocks/tooltip.mdx), responsive sizing, axes, grids and labels.

Each family page covers its own options, defaults and limits, like Pie pinning on [Pie](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/pie.mdx), Sankey labels on [Sankey](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/sankey.mdx), projected bars on [Bar](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/bar.mdx) and percentage stacks on [Combo](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/components/combo.mdx). Shared options are in the [materials](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/guides/materials.mdx), [motion](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/guides/motion.mdx) and [identity](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/guides/identity.mdx) guides. Read a page's API tables before choosing an option.

## Agent retrieval and verification

Start with the [agent consumer guide](https://github.com/kind-ui/charts/blob/main/apps/docs/content/docs/guides/ai-agents.mdx), then retrieve the page's built Markdown at `llms.mdx/docs/components/<family>.md` on the docs site, or its example source in [`apps/docs/examples/<family>/`](https://github.com/kind-ui/charts/tree/main/apps/docs/examples). Install the repository consumer skill with `npx skills add kind-ui/charts --skill kind-ui-charts`.

Docs (`apps/docs`) own the maintained examples. Internal regression fixtures in `tests/fixtures` validate package and browser contracts. See [CONTRIBUTING.md](../CONTRIBUTING.md) for library/package/browser checks and [release automation](release-automation.md) for exact artifact publication.
