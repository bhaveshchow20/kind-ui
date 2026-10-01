# Kind UI

Kind UI is building simple, composable UI for people and coding agents, starting with React charts. The goal is a broad collection of clean chart experiences built on established libraries, with predictable types and room to customize.

**Status: pre-release and unpublished.** Today, `@kind-ui/charts` provides three presentation components for Recharts. A broad chart collection and polished motion remain development goals. Nothing is published to npm; use the local workspace to explore the implementation.

## What you can use today

| Export | Responsibility |
| --- | --- |
| `Root` | Share series labels, colors, formatting, and optional controlled visibility. |
| `Legend` | Display series as a list, with native toggle buttons when a visibility callback is provided. |
| `TooltipContent` | Present Recharts tooltip entries with shared metadata and missing-value handling. |

Compose these with Recharts marks and axes. Your application owns chart geometry, data, sizing, visibility state, and its semantic data alternative. Zero and missing values remain distinct. Tailwind is used by the example and is not required by the package.

Start with the [chart API and usage](packages/charts/README.md) or the [runnable example](examples/chart/main.tsx). The workspace pins tested dependency versions; broader framework, SSR, performance, and accessibility guarantees have not been established.

## Try it locally

Requires Node 22.12+ (Node 24 recommended) and npm 11.9.

```sh
git clone https://github.com/bhaveshchow20/kind-ui.git
cd kind-ui
npm ci
npm exec playwright install -- --with-deps chromium
npm run check
npm run dev:chart
```

Open the local URL printed by Vite to explore the chart, toggle series, switch palettes, and inspect the data table. Focus the chart and use Left/Right arrow keys to explore values; Escape dismisses its tooltip. Stop the server with Ctrl+C.

`npm run check` runs lint, component tests, the actual packed-package gate, strict consumer typechecks, and Chromium interaction checks. Linux browser dependencies may require administrator permission. See [all development commands](CONTRIBUTING.md#commands). All packages remain private at `0.0.0`; the workspace package name is not an npm installation instruction.

## Direction

Build with established UI libraries, not against them. Prefer familiar composition and existing primitives, styling, and motion capabilities. Introduce a new pattern only for a concrete need that existing options do not meet. Future architecture and package boundaries will be reviewed in small steps; compatibility claims require tested consumers.

Performance, accessibility, extensibility, familiarity, and usefulness to coding agents guide review. A goal becomes a supported capability only after representative consumers and relevant checks demonstrate it. See the [development direction](docs/development.md) and [architecture acceptance criteria](docs/agent-friendly-architecture.md).

## Contributing

Documentation fixes, reproducible bug reports, and focused chart proposals are useful starting points. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [AGENTS.md](AGENTS.md) for the repository map. Use the [issue forms](https://github.com/bhaveshchow20/kind-ui/issues/new/choose) to report a bug or discuss a concrete consumer need before adding an API or dependency.

For suspected vulnerabilities, follow [SECURITY.md](SECURITY.md). Participation follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2026 Bhavesh Chowdhury. See the contribution guide for third-party license and attribution requirements.
