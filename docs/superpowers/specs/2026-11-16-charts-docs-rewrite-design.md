# Charts docs rewrite (kindui.dev phase 2b)

## Goal

Rewrite the Charts docs so they read and build like the Agent UI docs (kind-ui/agent-ui `apps/docs` on `main`), and can be pulled into kindui.dev at `/docs/charts/**` alongside `/docs/agent-ui/**` as one site. This is the prerequisite the kindui.dev site spec lists for phase 2 (`kind-ui/kindui.dev` `docs/superpowers/specs/2026-11-16-kindui-dev-site-design.md`, "Phase 2", item 1).

Success means:

- `apps/docs` is a Fumadocs app on the same stack, file layout, MDX components and page outline as Agent UI's.
- Every page is authored MDX in the `write-docs` voice, with live examples, `<include>`d source and generated type tables.
- The site builds as a static export under any base path, including `/docs/charts`, with only relative page links.
- A release can attach `charts-site-<version>.tar.gz`, gated by `KINDUI_HOSTING`, the way Agent UI does.
- Old generator, vendored-tarball and per-family browser machinery that only existed to support the old docs is gone.

## Decisions

Each was made under the user's pre-approval; the reason is recorded so it can be reviewed.

1. **Scope is Charts only.** The primitives docs (`apps/docs/content/primitives`) are dropped from the site and `apps/showcase` is retired (kindui.dev owns the homepage). `packages/primitives` and `packages/ai` code stays untouched. (User choice.)
2. **Same stack as Agent UI, exact pins:** `fumadocs-core` 16.19.3, `fumadocs-ui` as `npm:@fumadocs/base-ui@16.19.3`, `fumadocs-mdx` 15.6.2, `fumadocs-typescript` 5.6.1, `@fumadocs/cli` 1.9.2, Next 16.4.6, Tailwind 4. All `@radix-ui/*`, `class-variance-authority`, `lucide-react` and other hand-rolled UI dependencies leave the docs app. Reason: one shell, one upgrade path; kindui.dev pins the same versions.
3. **Files mirror Agent UI one for one:** `app/{layout,global.css,(home),docs,api/search,llms.txt,llms-full.txt,llms.mdx}`, `components/{mdx,example,caption,provider,search}.tsx`, `lib/{source,shared,layout.shared}.ts(x)`, `source.config.ts` (same `remarkAutoTypeTable` generator and `transform`), `next.config.mjs` (static export, `trailingSlash`, `NEXT_PUBLIC_DOCS_BASE_PATH`), `cli.json`, `AGENTS.md`. Use the Fumadocs CLI (`@fumadocs/cli add`/`feature`) and the Fumadocs MCP server rather than writing Fumadocs wiring from memory, then align with Agent UI's files.
4. **No generator.** `apps/docs/scripts/generate.mjs`, the family `*-catalog.mjs` files, `lib/public-types*.ts`, `lib/api-reference.mjs`, `generated/`, `public/markdown`, the hand-built `llms.txt`/`AGENTS.md` and the `ApiTable`/`ChartInstallation`/`ChartExample`/playground components are removed. Pages are authored MDX; source is shown with `<include cwd lang="tsx">`; props come from `<auto-type-table>`; Markdown and `llms.txt` come from Fumadocs' `llms()` routes. Reason: Agent UI shows authored pages are shorter and clearer, and every generated output has a Fumadocs equivalent. The only thing generation still did that Fumadocs doesn't is verify a vendored tarball, which decision 5 removes.
5. **Docs build from workspace source.** `apps/docs` joins the root npm workspaces and depends on the workspace `@kind-ui/charts`. The vendored `vendor/kind-ui-charts-*.tgz`, its provenance, `prepare-package`, `verify-pinned-package` and `validated-artifact` checks go. Reason: kindui.dev pulls the site at the release tag, where workspace source is the released source; Agent UI does the same. The packed-package and registry-consumer gates at the root still prove the published artifact.
6. **Examples import public paths only.** A Charts example imports `@kind-ui/charts` (the npm package every registry item installs) and nothing repo-relative. Charts ships its chart components as an npm package, so its registry items are ready-made compositions over that package rather than component source; `@kind-ui/charts` is therefore the registry-consumer import for Charts. Examples live at `apps/docs/examples/<family>/<name>.tsx` (Agent UI's layout), start with `"use client"` (compound parts like `LineChart.XAxis` are properties of a client component, so a server component can't reach them), and drop accessibility boilerplate the components already provide.
7. **Registry items keep their names** (`line-chart`, `bar-chart`, …, `activity-rings`; 14 items). `registry/catalog.mjs` lists them explicitly with the example file each one ships, instead of importing the docs catalog. Reason: kindui.dev merges registries by item name, and the directory entry already advertises these names.
8. **Type tables** use `<auto-type-table path="…/packages/charts/src/<file>.tsx" name="<Name>Props" />`. Props that extend Recharts are narrowed in the MDX with `type='Pick<…>'` to the options Charts adds, the same way Agent UI narrows agent actions. TSDoc on the Charts source is the description, fixed at the source when it is missing or wrong.
9. **Page outline per chart family** (adapted from Agent UI's `step.mdx`): frontmatter `title`/`description` → "Use a … to …" paragraph → one `<Example caption>` → `## Installation` (`npx shadcn@latest add @kind-ui/<item>` and the npm install as `bash tab=` blocks) → `## Composition` (`text` tree of the compound parts) → `## Usage` (one short subsection per behavior, each with at most one example or snippet) → `## API Reference` (type tables) → closing `<Caption>` only when there is a real limit or mapping to state. There is no Web Components layer and no `createAgent`, so Agent UI's "Agent" section and Web Components line do not apply. Variant playgrounds are replaced by one example plus prose naming the values; examples that differ only in a visual variant are not added.
10. **Navigation** follows Agent UI's root `meta.json` separator style: `index` (Get Started, absorbs `installation`), `---Components---` (13 family pages under `components/`, matching Agent UI's `components/<name>` URLs), `---Building Blocks---` (chart, series config, legend, tooltip, axes and grid, labels under `building-blocks/`), `---Guides---` (identity, materials, motion, accessibility, troubleshooting, AI agents under `guides/`). `privacy.mdx` is dropped: the site has no analytics once the showcase is retired, and kindui.dev owns site policy.
11. **Shared MDX components** (`Example`, `Caption`, plus Fumadocs `Tabs`/`TypeTable`) are copied from Agent UI with the same names and props. kindui.dev will later publish them as the hidden `@kind-ui/docs-kit` registry item; matching names now makes that a path change.
12. **Links** inside MDX are relative (`./line`, `../guides/motion`), resolved by `createRelativeLink`. No `](/docs` links; a test enforces it.
13. **Release handoff** copies Agent UI: `scripts/pack-site.mjs` packs `apps/docs/out` as `docs/` and `artifacts/registry/r` as `r/` into `artifacts/site/charts-site-<version>.tar.gz` plus `.sha256`, and `release.yml` attaches them only when `vars.KINDUI_HOSTING == 'true'`. No variable is set by this work.
14. **Tooling from Agent UI** joins `.agents/skills`: `write-docs`, `fumadocs`, `unslop`, `expert-review` and `write-code`, adapted to Charts, plus `.mcp.json` and `.vscode/mcp.json` for the Fumadocs MCP server, and AGENTS.md workflow lines. `writing-guidelines` stays (it carries vendored license provenance) and is routed to PR prose; `write-docs` owns docs pages. `expert-review` uses three experts sized to this repo: `charts` (`packages/charts`, `tests`), `docs` (`apps/docs`, `registry`, `skills`) and `tooling` (`scripts`, `.github`, root config).
15. **Changesets ignore the private docs package** (`.changeset/config.json` `ignore`), because it depends on the workspace `@kind-ui/charts` and would otherwise join every version plan, which the release tooling limits to `@kind-ui/charts`.
16. **Verification is lighter and Agent UI shaped.** The ~84 scripts in `apps/docs/scripts` (family browser checks, consumer shards, generator contracts, snapshot/serve tools) are replaced by: a page-structure test (`scripts/docs.test.mjs`, modelled on Agent UI's `scripts/tests/docs.test.mjs`), `scripts/check-docs.mjs` (open every exported page in Chromium and fail on any page or console error), and the docs build with `NEXT_PUBLIC_DOCS_BASE_PATH=/docs/charts`. `check-docs` opens every page in light, then in dark with reduced motion, and resolves every link. Chart behavior stays covered by the root `tests/` and Playwright configs, which test the package rather than the docs. `.github/workflows/docs.yml` becomes build, structure test and `check-docs`.

## Breaking changes

No one uses the libraries yet, so these land in one cut with no redirects.

- Every docs URL changes except `components/<family>`: `chart-components/*` → `building-blocks/*`, `concepts/identity` → `guides/identity`, `agents/consumer` → `guides/ai-agents`; `installation`, `privacy` and `start` stop existing.
- Primitives docs pages are removed from the site.
- `apps/showcase` (homepage, SEO, analytics, social previews) is removed, with `seo.yml` and its scripts.
- Generated `public/markdown/**`, `public/examples/**` and the hand-built `llms.txt`/`llms-full.txt`/`AGENTS.md` are replaced by Fumadocs' `/llms.txt`, `/llms-full.txt` and `/llms.mdx/**`.
- Example ids, files and variant playgrounds change; registry item names do not.
- The docs no longer prove the vendored published tarball; the release and registry-consumer gates do.
- `npm run dev:showcase` and the docs package's `generate`, `check:consumers`, `check:browser`, `snapshot:site` and `preview` scripts are removed.

## Out of scope

- Changes to `@kind-ui/charts` behavior or public API, other than TSDoc fixes found while writing type tables. Regressions found in the package are listed in the PR, and fixed only if small and clearly a bug.
- `@kind-ui/docs-kit` itself, kindui.dev changes, setting `KINDUI_HOSTING`, enabling immutable releases, publishing.
- `packages/primitives`, `packages/ai`, and their tests.

## Risks

- **Type tables over Recharts props** can explode; decision 8's `Pick` keeps them to Charts' own options. A family whose props can't be narrowed cleanly gets a focused exported type in the package rather than a docs-only type file.
- **Examples need the package's Tailwind utilities:** `global.css` adds `@source` for `packages/charts/src` and `examples`.
- **Deleting docs-level browser checks** could drop regression coverage. Each family slice compares the old page's claims and checks against the package tests and lists any behavior only the docs checks covered; the integration step adds a root test for any that matter.

## Known Package Follow-ups

Found while porting; not changed here because they are package behavior:

- `AreaChart`, `ComboChart`, `BarChart`, `ScatterChart` and `SankeyChart` default `animate` to `false`, while `LineChart` defaults it to `true`; only Line adds the screen-reader arrow-key instructions.
- `SankeyLink` draws ribbons fully opaque, so crossings hide each other; the examples pass `pathProps={{ strokeOpacity: 0.6 }}`.
- The radial track falls back to `#f1f1f1`, a light band in dark mode; the docs set `--kind-ui-radial-track`.
- `RadialBarChart.Label` takes the series color by default, so it's invisible on its own arc unless `fill` is set.
- `HeatmapChart.Grid` requires a visible `caption`.
- With default margins, the last x-axis category label can clip.

Behavior only the deleted docs browser checks covered: combo dual-axis tick insets at several viewports; radar selection kept while hovering a spoke; activity rings restoring their paths after loading; radial stack hiding a series from the legend by keyboard; tooltip fit at narrow widths and 200% text; long legends wrapping without overflow.
