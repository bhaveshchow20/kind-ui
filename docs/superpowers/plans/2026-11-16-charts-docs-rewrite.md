# Charts Docs Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `apps/docs` on Agent UI's Fumadocs stack and page outline so Charts docs can render at kindui.dev `/docs/charts/**`.

**Architecture:** A foundation task replaces the docs app with Agent UI's file layout and one reference page; parallel slices then author the remaining pages and examples; a release task adds the site handoff; an integration task merges, verifies under `/docs/charts`, unslops, reviews and opens one PR.

**Tech Stack:** Fumadocs 16.19.3 (Base UI), fumadocs-mdx 15.6.2, fumadocs-typescript 5.6.1, Next 16.4.6 static export, Tailwind 4, npm workspaces, node:test, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-16-charts-docs-rewrite-design.md`

**Reference:** kind-ui/agent-ui `origin/main`, local clone `/Users/bchow/.copilot/repos/agent-ui` (read with `git show origin/main:<path>`).

## Global Constraints

- Exact pins: `fumadocs-core` 16.19.3, `fumadocs-ui` `npm:@fumadocs/base-ui@16.19.3`, `fumadocs-mdx` 15.6.2, `fumadocs-typescript` 5.6.1, `@fumadocs/cli` 1.9.2, `next` 16.4.6.
- Examples import only `@kind-ui/charts` and `react`; never repo-relative paths, never `@/`.
- MDX links are relative; no `](/docs` anywhere in `content/`.
- Registry item names stay: the 14 names `registry/names.mjs` produces today.
- Never name design or reference projects in code, docs, commits or PRs. UI SDK, shadcn, Fumadocs, Next.js, Recharts, Motion and the AI SDK are fine.
- No version numbers in public docs prose.
- Charts examples are graph-first: no visible data tables, captions or readouts repeating the chart; accessible names stay.
- Loading states keep the staggered top-to-bottom fade with reduced motion.
- Use the Fumadocs CLI and MCP server (`https://www.fumadocs.dev/api/mcp`) instead of writing Fumadocs wiring from memory.
- Run `unslop` then `expert-review` before every push. Build first, targeted checks next, full `npm run check` once before push.

## Review Focus

1. **Base path:** a page opened at `/docs/charts/charts/line/` loads its search index, Markdown copy URL and links without 404s. Pinned by Task 10's `check-docs` run with `NEXT_PUBLIC_DOCS_BASE_PATH=/docs/charts`.
2. **Dark mode:** charts in examples stay legible in dark theme (series colors, axes, tooltips). Pinned by `check-docs` opening pages in both color schemes (Task 2 step 6).
3. **Reduced motion:** examples with entrance or loading motion render final state under `prefers-reduced-motion`. Pinned by `check-docs` running one pass with reduced motion emulated (Task 2 step 6).
4. **Type table blowup:** a props table that inherits Recharts props renders hundreds of rows. Pinned by `docs.test.mjs` asserting every `<auto-type-table` on a chart page that names a `*ChartProps` type also passes `type='Pick<`… (Task 2 step 1).
5. **Registry drift:** a registry item ships an example file that no page shows. Pinned by `docs.test.mjs` asserting every `registry/catalog.mjs` item's `source` is `<include>`d by some page (Task 2 step 1).

---

### Task 1: Agent tooling (coordinator, this branch)

**Files:**
- Create: `.agents/skills/{write-docs,fumadocs,unslop,expert-review,write-code}/SKILL.md`, `.agents/experts/{README.md,charts,docs,tooling}/{expert.md,decisions.md}`, `.mcp.json`, `.vscode/mcp.json`
- Modify: `AGENTS.md`, `.agents/skills/UPSTREAM.md` (local skills list)
- Delete: `.agents/skills/writing-guidelines/` and references to it

- [ ] Adapt each Agent UI skill to Charts: twins from `packages/charts/src` and `apps/docs` (reference page `content/docs/charts/line.mdx`), Charts checks (`npm run lint`, `npm run typecheck`, `npm test`, `npm run check`), no UI SDK, no Web Components, no `createAgent`.
- [ ] `expert-review` routes by `git diff --name-only <base>...HEAD`: `charts` → `packages/charts/**`, `tests/**`; `docs` → `apps/docs/**`, `registry/**`, `skills/**`; `tooling` → `scripts/**`, `.github/**`, root config.
- [ ] Verify: `node .agents/skills/verify-upstream.mjs` passes; `npm run lint` passes.
- [ ] Commit `chore: add docs and review skills from Agent UI`.

### Task 2: Docs app foundation (child session)

**Files:**
- Replace: `apps/docs/**` with Agent UI's layout (spec decision 3); delete `content/primitives`, `scripts/`, `lib/` (except `shared.ts`, `source.ts`, `layout.shared.tsx`), old `components/`, `vendor/`, `generated/`, `public/markdown`, `public/examples`, own `package-lock.json`, `biome.json` if redundant, `playwright.config.ts`, `tests/`.
- Create: `apps/docs/content/docs/{meta.json,index.mdx,charts/meta.json,charts/line.mdx}`, `apps/docs/examples/line/*.tsx`, `scripts/docs.test.mjs`, `scripts/check-docs.mjs`
- Modify: root `package.json` (workspaces add `apps/docs`; scripts `dev:docs`, `build:docs`, `check:docs`, `test:docs`), `package-lock.json`, `registry/catalog.mjs`, `scripts/build-registry.mjs`, `scripts/run-checks.mjs`, every root script/test/workflow referencing deleted docs files, `.github/workflows/docs.yml`, `apps/tsconfig.tools.json`, `biome.json`

**Interfaces (Produces, used by Tasks 4–9):**
- Page template = `content/docs/charts/line.mdx` (spec decision 9).
- Example path `apps/docs/examples/<family>/<name>.tsx`, default export a component; included as `<include cwd lang="tsx">./examples/<family>/<name>.tsx</include>`; MDX imports as `import X from "../../../examples/<family>/<name>";`.
- Type tables: `<auto-type-table path="../../../../../packages/charts/src/<file>.tsx" name="<Type>" type='Pick<…>' />`.
- `registry/catalog.mjs` exports `registryItems: { name, title, description, source }[]` (`source` repo-relative example path) plus existing `coreVersion`, `registryHomepage`, `registryEndpoint`, `registryCss`.
- Root `content/docs/meta.json` has separators `---Charts---` `...charts`, `---Building Blocks---` `...building-blocks`, `---Guides---` `...guides`; `charts/meta.json` lists all 13 families in today's order (pages not yet written are added by their slice; the test only checks pages that exist are listed).
- Scripts: `npm run build:docs` (build package, then `next build --webpack` in `apps/docs`, output `apps/docs/out`), `npm run test:docs` (`node --test scripts/docs.test.mjs`), `npm run check:docs` (`node scripts/check-docs.mjs`).

- [ ] **Step 1: Write `scripts/docs.test.mjs`** with tests: each `charts/*.mdx` has frontmatter title/description, one `<Example caption=".+">`, `## Installation` containing `npx shadcn@latest add @kind-ui/<item>` for families with a registry item, `## Usage`, `## API Reference` followed by `<auto-type-table `; every `*ChartProps` table passes `type='Pick<`; every `meta.json` page exists and every page is listed; no `](/docs` and no `from "@/` in content; every example file imports only `@kind-ui/charts`, `react`, or a sibling `./`; every registry item `source` is included by a page.
- [ ] **Step 2:** Run `npm run test:docs`; expect failures (no new pages yet).
- [ ] **Step 3:** Scaffold with the Fumadocs CLI into a temp dir, then bring `apps/docs` to Agent UI's files at the pinned versions; `global.css` adds `@source` for `../../packages/charts/src` and `../examples`; `lib/shared.ts` `appName = "Charts"`, `gitConfig.repo = "charts"`; home page links `docs`.
- [ ] **Step 4:** Write `index.mdx` (Get Started: what Charts is, install, first chart, links to families) and `charts/line.mdx` with its examples in the `write-docs` voice, porting the old line page's teaching content. Repoint `registry/catalog.mjs` and `build-registry.mjs` to explicit sources; keep each item's file bytes equal to its example.
- [ ] **Step 5:** Delete old docs machinery; fix every reference (`rg -l "apps/docs/(scripts|lib|vendor|examples/.*catalog)"`); rewrite `docs.yml` to: `npm ci`, `npm run build:docs`, `npm run test:docs`, `npm run check:docs`.
- [ ] **Step 6: `scripts/check-docs.mjs`**: port Agent UI's; add a second pass per page with `colorScheme: "dark"` and `reducedMotion: "reduce"`; honor `NEXT_PUBLIC_DOCS_BASE_PATH`.
- [ ] **Step 7:** Run `npm run build:docs && npm run test:docs && npm run check:docs`, then `NEXT_PUBLIC_DOCS_BASE_PATH=/docs/charts npm run build:docs && NEXT_PUBLIC_DOCS_BASE_PATH=/docs/charts npm run check:docs`; all pass except page-existence tests for unwritten families. `npm run lint`, `npm run typecheck`, `npm run build:registry` pass.
- [ ] **Step 8:** unslop, commit `docs: rebuild the docs app on Fumadocs with the line page`.

### Task 3: Retire the showcase (child session, parallel with Task 2)

**Files:** Delete `apps/showcase/`, `apps/{analytics,indexing,seo}.mjs`, `.github/workflows/seo.yml`, `scripts/indexing*`, `scripts/analytics.test.mjs`, `scripts/render-social-previews.mjs`, `docs/{production-indexing,website-analytics}.md` and anything only they use. Modify root `package.json`, `scripts/ci-paths.mjs`, workflows and tests that reference them, `README.md`/`CONTRIBUTING.md`/`AGENTS.md` mentions.

- [ ] `rg -l "showcase|analytics|indexing|seo\.mjs|social-previews"` outside `node_modules`; remove or rewrite each hit. Don't touch `apps/docs/**` (Task 2 owns it).
- [ ] Verify `npm run lint`, `npm run check:ci`, `npm run typecheck` pass. Commit `chore: retire the showcase app`.

### Tasks 4–8: Page slices (one child session each, after Task 2, parallel)

Each slice owns only its pages, examples and `meta.json` entries. Per family: read the old page and examples at `git show origin/main:apps/docs/content/docs/components/<family>.mdx` and `origin/main:apps/docs/examples/<family>*`, the family catalog, the package source and its tests; write the new page from the `line.mdx` template; port the teaching content as small examples (no variant playgrounds); fix TSDoc at the source when a type-table description is missing or wrong; list regressions (old claims the package no longer satisfies, behavior only old docs checks covered) in the slice report.

| Task | Owns |
| --- | --- |
| 4 | `charts/{area,combo}.mdx` |
| 5 | `charts/{bar,histogram,waterfall,box-plot}.mdx` |
| 6 | `charts/{pie,radial,radar}.mdx` (radial includes activity rings) |
| 7 | `charts/{scatter,heatmap,sankey}.mdx` |
| 8 | `building-blocks/{chart,series-config,legend,tooltip,axes-grid,labels}.mdx`, `guides/{identity,materials,motion,accessibility,troubleshooting,ai-agents}.mdx` with their `meta.json`; `skills/kind-ui-charts/` links updated to new URLs |

- [ ] Verify per slice: `npm run build:docs && npm run test:docs && npm run check:docs` pass for its pages; `npm run lint`.
- [ ] unslop; commit `docs: <families> pages`; report branch, regressions found, TSDoc changes.

### Task 9: Release site handoff (child session, after Task 2)

**Files:** Create `scripts/pack-site.mjs`; modify `.github/workflows/release.yml`, `scripts/release-workflow.test.mjs`, `package.json` (`pack:site`), `docs/release-automation.md`.

- [ ] Test first in `scripts/release-workflow.test.mjs`: the release job runs `npm run build:docs`, `npm run build:registry` and `node scripts/pack-site.mjs` and uploads `artifacts/site/charts-site-*` only under `if: vars.KINDUI_HOSTING == 'true'`.
- [ ] `pack-site.mjs` ported from Agent UI with `charts-site-<version>` from `packages/charts/package.json`.
- [ ] Verify `npm run check:release`; `npm run build:docs && npm run build:registry && node scripts/pack-site.mjs` produces the tarball and `.sha256` with `docs/` and `r/` at its root. Commit `ci: attach the docs site to releases behind KINDUI_HOSTING`.

### Task 10: Integration (coordinator)

- [ ] Merge Task 3–9 branches into this branch; resolve `meta.json`/`package.json` conflicts.
- [ ] Remove the page-existence allowance from `docs.test.mjs` so every family page is required.
- [ ] Fix any regressions slices reported that matter, with a root test.
- [ ] Build under `/docs/charts`, run `check-docs`; hand the full `npm run check` to a subagent.
- [ ] Run `unslop` and `expert-review` on `origin/main...HEAD`; triage findings.
- [ ] Changeset only if `packages/charts` TSDoc changed (patch). Open one PR using the repo template, listing decisions, breaking changes and regressions.
