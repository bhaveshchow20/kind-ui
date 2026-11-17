---
name: fumadocs
description: Edits the Charts docs site in apps/docs (Fumadocs on Next.js, static export), including adding or updating a chart page, its live examples and its generated API tables, wiring Fumadocs features with its CLIs, and upgrading Fumadocs. Use whenever you touch apps/docs or a chart's public props. For the words, use the write-docs skill.
---

# Fumadocs

`apps/docs` is a Fumadocs app on Next.js with `output: "export"`, laid out like the Agent UI docs so both render in the kindui.dev docs shell. Fumadocs changes often, so check its docs before you write anything from memory:

- `https://www.fumadocs.dev/llms.txt` lists every page; `https://www.fumadocs.dev/docs/next/llms.txt` the Next.js ones. Add `.md` to any docs URL for its Markdown.
- The Fumadocs MCP server (`.mcp.json`, `.vscode/mcp.json`): `list_pages`, `get_page`, `search`.

## Layout

| Path | Holds |
| --- | --- |
| `content/docs/**/*.mdx`, `meta.json` | Pages and the sidebar order |
| `examples/<family>/<name>.tsx` | Live examples, importing `@kind-ui/charts` |
| `lib/source.ts` | The `fumadocs-mdx/macro` collection, the loader and the `llms()` routes |
| `source.config.ts` | Global MDX options: `remarkAutoTypeTable` from `fumadocs-typescript` |
| `components/mdx.tsx`, `components/example.tsx` | MDX components, and the Preview / Code frame with its `caption` |
| `cli.json` | `@fumadocs/cli` config |

`apps/docs` is a root workspace, so `@kind-ui/charts` resolves to `packages/charts`. Run `npm run build` at the root before the docs when you change the package.

## Add or update a chart page

Copy `content/docs/charts/line.mdx` and its examples, and write the words with the [`write-docs`](../write-docs/SKILL.md) skill. The page is: frontmatter `title` and `description` → an opening paragraph → `<Example caption="…">` holding the live chart and `<include cwd lang="tsx">` of the same file → `## Installation` → `## Composition` → `## Usage` → `## API Reference`. Add the page to its folder's `meta.json`. `npm run test:docs` checks the sections.

- **Examples** import only `@kind-ui/charts`, `react` and sibling files, never `@/` or repo-relative paths, so they read the way a consumer writes them. An example starts with `"use client"` only when it holds state or handlers.
- **Registry items** ship an example file byte-for-byte; `registry/catalog.mjs` names which. Keep item names stable.
- **API tables** are `<auto-type-table path="…" name="…" />`, generated at build time from the package source. `path` is relative to the MDX file. Narrow props that extend Recharts with `type='Pick<LineChartProps, "config" | …>'`. Write descriptions as TSDoc in the source (`@default`, `@internal` to hide a field). A wrong `path` or `name` fails the build.
- **Links** between pages are relative (`./bar`, `../guides/motion`); the site is mounted under `/docs/charts` on kindui.dev.

## Use the CLIs, not hand-written code

Run them from `apps/docs` with `npx @fumadocs/cli@<pinned>`:

- `feature <id>` wires a feature (`llms`, `search`, `og`, …). `llms` is already wired.
- `add <component>` installs a Fumadocs UI component's source into `components/fumadocs/`.
- `customise` swaps a layout part for an editable copy.

Prefer Fumadocs UI's own components (`fumadocs-ui/components/*`) and MDX features (`<include>`, `tab=` code blocks, `Callout`, `Cards`) over custom ones.

## Static export

A static build has no server. The search index is exported from `app/api/search/route.ts` and searched in the browser. Page Markdown is served as files under `/llms.mdx/…`. `NEXT_PUBLIC_DOCS_ORIGIN` and `NEXT_PUBLIC_DOCS_BASE_PATH` set where the site is hosted; anything fetched by hand adds `basePath`.

## Check it

`npm run build:docs` builds the package, then the site (Next.js type-checks it). `npm run check:docs` opens every exported page in light, dark and reduced motion and fails on any error. `npm run dev:docs` serves it with hot reload.

## Upgrade

Bump `fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx`, `fumadocs-typescript` and `@fumadocs/cli` together, to the versions the Agent UI docs pin, and read `https://www.fumadocs.dev/docs/next/upgrade.md` first. Pins are exact.
