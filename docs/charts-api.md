# Charts public API reference

The maintained [package reference](../packages/charts/README.md) documents public exports, composition, defaults and ownership limits. The [complete documentation](https://kindui.dev/charts/docs/) adds generated TypeScript API tables and copied consumers checked with strict NodeNext/Bundler resolution and Vite builds.

## Choose a family

| Family | Complete examples and API |
| --- | --- |
| Line | [Line](https://kindui.dev/charts/docs/components/line/) |
| Area | [Area](https://kindui.dev/charts/docs/components/area/) |
| Bar | [Bar](https://kindui.dev/charts/docs/components/bar/) |
| Combo | [Combo](https://kindui.dev/charts/docs/components/combo/) |
| Pie / Donut | [Pie](https://kindui.dev/charts/docs/components/pie/) |
| Radar | [Radar](https://kindui.dev/charts/docs/components/radar/) |
| Radial / ActivityRings | [Radial](https://kindui.dev/charts/docs/components/radial/) |
| Scatter / Bubble | [Scatter](https://kindui.dev/charts/docs/components/scatter/) |
| Histogram | [Histogram](https://kindui.dev/charts/docs/components/histogram/) |
| Box plot | [Box plot](https://kindui.dev/charts/docs/components/box-plot/) |
| Heatmap | [Heatmap](https://kindui.dev/charts/docs/components/heatmap/) |
| Sankey | [Sankey](https://kindui.dev/charts/docs/components/sankey/) |
| Waterfall | [Waterfall](https://kindui.dev/charts/docs/components/waterfall/) |

## Shared composition and presentation

Use public `@kind-ui/charts` exports and import `@kind-ui/charts/styles.css` once at the application entry. Applications own data, units, domains, accessible names, data alternatives and request state. Each family reference specifies its native renderer, refs, handlers, visibility, missing-value and motion limits.

Shared references cover [Root](https://kindui.dev/charts/docs/chart-components/root/), [SeriesConfig](https://kindui.dev/charts/docs/chart-components/series-config/), [Legend](https://kindui.dev/charts/docs/chart-components/legend/), [Tooltip](https://kindui.dev/charts/docs/chart-components/tooltip/), responsive sizing, axes, grids and labels.

The [customization guide](https://kindui.dev/charts/docs/guides/customization/) covers inferred labels, theme-aware gradients, loading, fill/background patterns, projected bars, percentage stacks, point markers, dashed/directional motion, Pie defaults/glow, Sankey labels/icons and Root interactions. Its complete options source is included in the checked Combo consumer. Read its API tables, defaults and ownership limits before choosing an option.

## Agent retrieval and verification

Start with [llms.txt](https://kindui.dev/charts/docs/llms.txt), then retrieve the relevant Markdown reference and complete example setup files. [llms-full.txt](https://kindui.dev/charts/docs/llms-full.txt) includes complete consumer code and generated API tables. Install the repository consumer skill with `npx skills add bhaveshchow20/kind-ui --skill kind-ui-charts`.

Maintained executable compositions in `examples/chart`, public consumer fixtures in `tests/fixtures`, and Docs examples remain part of validation. See [CONTRIBUTING.md](../CONTRIBUTING.md) for library/package/browser checks and [release automation](release-automation.md) for exact artifact publication.
