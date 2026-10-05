# Kind UI

Kind UI provides composable React charts with shared interaction, accessible
semantics, controlled visibility and optional motion. Applications own their
data, units and layout.

## Install

```sh
npm install @kind-ui/charts
```

Import `@kind-ui/charts/styles.css` once at your application entry. Read the
[package API and examples](packages/charts/README.md) for composition, peer
requirements and chart-family contracts.

The npm package provides usable, design-neutral charts and their interaction,
motion and accessibility behavior. The [registry](registry/README.md) adds
editable visual designs and dashboard composition over those public exports.
Application filters and business state stay in the application.

## AI agents

Install the consumer skill:

```sh
npx skills add bhaveshchow20/kind-ui --skill kind-ui-charts
```

Read the [agent guide](apps/docs/content/docs/agents/consumer.mdx) for chart
selection, canonical Markdown and shadcn MCP setup. The consumer skill lives in
[skills/kind-ui-charts](skills/kind-ui-charts/SKILL.md); `.agents/skills` contains
repository maintainer guidance.

## Develop locally

Use Node 22.12+ and npm 11.9.

```sh
npm ci
npm exec playwright install -- --with-deps chromium
npm run check
```

`npm run dev:chart` starts the minimal example; `npm run dev:showcase` opens the
feature gallery. Checks cover component behavior, packed public exports,
consumer types and Chromium interaction.

Start contributions with [CONTRIBUTING.md](CONTRIBUTING.md) and
[AGENTS.md](AGENTS.md). See [development policy](docs/development.md),
[security reporting](SECURITY.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

MIT © 2026 Bhavesh Chowdhury.
