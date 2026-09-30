# Library patterns reviewed

Reviewed 2026-09-30 against primary project documentation/source pages. This is a bounded architecture study, not a comprehensive benchmark. Links to `main` or `dev` may evolve.

| Source | Pattern used | Deliberately left out |
| --- | --- | --- |
| [TanStack Charts current repository](https://github.com/TanStack/charts) | Explicit framework/core ownership, granular imports, testing packed exports and declarations | Its full grammar, framework-neutral host, scene protocol, adapters, and public plugin/renderer surface |
| [Fumadocs philosophy](https://www.fumadocs.dev/docs/what-is-fumadocs) | Independently useful layers, maintained defaults, and optional application-code customization as one coherent developer experience | A literal documentation/content-source architecture inside a chart library |
| [Fumadocs registry rules](https://github.com/fuma-nama/fumadocs/blob/dev/packages/shared/registry.ts) | Retain maintained package imports while copying selected consumer-editable compositions | Copying all runtime internals into consumers or adopting its entire registry surface |
| [Fuma CLI installer](https://github.com/fuma-nama/fuma-cli/blob/dev/packages/core/src/registry/installer/index.ts) | Separate a proposed file plan from applying it | Upstream overwrite defaults, automatic installers, remote registries, and arbitrary hooks |
| [airbnb/visx](https://github.com/airbnb/visx) | Small composable packages; React renders while modular D3 performs math | Dozens of independent primitive packages before actual use cases justify them |
| [D3 linear scales](https://d3js.org/d3-scale/linear) | Finite quantitative domains and fractional mappings; keep nicing/rounding separate from raw data | Silent coercion of input values; scale mutation leaking into semantic state |
| [D3 line generator](https://d3js.org/d3-shape/line) | `defined` breaks a path at missing observations | Interpolating across a missing observation without an explicit semantic policy |
| [D3 time scales](https://d3js.org/d3-scale/time) | UTC time ticks for deterministic positions | Host-local timezone assumptions or implicit date parsing |
| [Recharts accessibility docs](https://github.com/recharts/recharts/blob/main/storybook/stories/API/Accessibility.mdx) | Keyboard interaction is part of a chart's API; accessible naming is designed up front | Treating a tooltip alone as an exact-value or assistive-technology solution |
| [generativecharts](https://github.com/kasturibuilds/generativecharts) | Product inspiration: approachable charts with visual polish | Copying its catalog, application services, code, or release assumptions |

Important distinction: [TanStack/react-charts](https://github.com/TanStack/react-charts) is archived; this scaffold's comparison uses the active `TanStack/charts` project. Its main branch describes an alpha with a broader architecture than this initial foundation needs.

The resulting ecosystem direction and phased quality benchmark are recorded in [ADR 0003](decisions/0003-ecosystem-and-cli.md). This scaffold currently provides chart runtime packages, one optional local recipe, Markdown documentation, and a Vite example. A complete docs site and broader ecosystem remain future work.

No upstream source code was copied. D3 is consumed through its published packages; its notices/licenses remain in those dependencies. Our MIT license applies to original scaffold code, not to ownership of upstream dependencies.
