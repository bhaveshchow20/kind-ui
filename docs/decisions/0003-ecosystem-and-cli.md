# ADR 0003: A domain-library ecosystem with optional source recipes

Status: accepted for the private foundation, 2026-09-30

## Context and benchmark

The long-term ambition is a cohesive family of useful UI libraries. A collection of copied templates alone would leave consumers maintaining the difficult runtime behavior. A universal platform core would add abstractions before there are domains that need them. Begin with one trustworthy chart product and establish the surrounding developer experience without pretending the wider ecosystem exists already.

[Fumadocs' philosophy](https://www.fumadocs.dev/docs/what-is-fumadocs) presents independently useful layers, opinionated default UI, and selective customization in ordinary application code. The relevant lesson is the whole experience, not just its CLI. For this project, chart semantics, React views, optional compositions, examples, and documentation form the analogous layers; there is no need to invent a literal content-source equivalent.

[TanStack Charts](https://tanstack.com/charts/latest) provides another benchmark: a domain-specific product within a larger library family, accompanied by public APIs and runnable examples. Its current alpha includes a much broader grammar and rendering surface than this foundation. Use the clarity and testability of the boundaries as a benchmark, not a requirement to reproduce its catalog or internals.

## Decision: three packages, one first product

- `@kind-ui/charts-core` owns React-free chart semantics and geometry. The core is chart-specific; it is not a foundation dependency for every possible UI library
- `@kind-ui/charts` is the ordinary React consumer entry point. It owns the maintained `LineChart` and `DataTable` UI and re-exports normalization and semantic types so a consumer can start with one import
- `@kind-ui/cli` copies optional application-level recipes over the runtime. It has no place in an application's runtime dependency graph

Kind UI is the selected umbrella name, with intended `@kind-ui/*` package names and the `kind-ui` binary. The intended repository is `bhaveshchow20/kind-ui`, private. Selecting the name does not establish npm scope ownership, exclusive rights to the name, a remote repository, deployment, or release. npm scope ownership remains unverified, and all packages remain private.

The CLI must not become necessary for using the runtime. A consumer can compose `LineChart` and `DataTable` directly, or take ownership of a copied composition. Shared semantics, geometry, and rendering fixes remain maintained in the packages rather than being duplicated into every project.

## First CLI contract

The CLI bundles one versioned registry entry, `charts/line@0.0.0`, with its required runtime compatibility. The installer intentionally supports that one entry and exact contract; a different recipe or contract requires code changes and tests, not merely an untrusted manifest entry. There is no remote registry lookup or executable recipe hook.

- `kind-ui init [--cwd <dir>] [--dry-run]` creates `kind-ui.json` with `schemaVersion: 1`, `framework: "react"`, and default `recipesDir: "src/components/ui"`
- `kind-ui add charts/line [--cwd <dir>] [--dry-run]` reads that configuration and copies the recipe to `charts/line-chart-demo.tsx` beneath `recipesDir`
- A dry run validates and previews without creating files or directories
- The target project must exist and contain `package.json`; the CLI expects React 19 + TypeScript rather than detecting a framework or verifying dependency compatibility. Command output warns the consumer to review their React version, and the suggested install command does not install or upgrade React. Configuration and recipe destinations must stay inside it; unsafe relative paths and symlinks within project file paths are rejected
- `add` creates `kind-ui/recipes/charts-line.json` with the recipe ID/version, exact runtime version and React range, plus the generated source path and original SHA-256 hash
- Existing configuration, recipe, and receipt files are never overwritten. A matching receipt lets reruns preserve consumer modifications; differing untracked source is refused. Missing source can be regenerated, but changed recipe versions or configured destinations are refused
- The CLI does not install packages, modify package manifests, use the network, or silently upgrade dependencies. It reports the recipe's runtime requirements

The command's useful unit is a reviewed write plan followed by exclusive file creation. [Fuma CLI's installer](https://github.com/fuma-nama/fuma-cli/blob/dev/packages/core/src/registry/installer/index.ts) informed that separation, and [Fumadocs' registry rules](https://github.com/fuma-nama/fumadocs/blob/dev/packages/shared/registry.ts) illustrate retained package imports alongside selectively copied source. Our implementation and conservative no-overwrite policy are original; upstream installer defaults are not adopted wholesale.

## Ownership and upgrades

A copied composition is consumer-editable application source. It imports the maintained `@kind-ui/charts` runtime rather than vendoring that runtime. Consumers choose when to update a compatible runtime dependency and validate their own compositions afterward.

Recipe versioning and the original-content receipt identify the generated baseline, not a promise to merge a later recipe into edited files. The receipt is not a dependency lockfile or evidence that runtime dependencies are installed. Do not update it to disguise edited source as an untouched generated file. There is no `update` command, automatic merge, migration engine, or destructive overwrite flag in this foundation. Any future update flow needs a real second recipe version, change detection, a previewable diff, and explicit handling of local modifications before it is useful.

Because the packages are unpublished, public registry commands cannot install this scaffold. The supported verification route is to pack the private packages locally, install those tarballs into a clean consumer, run the packed CLI, compile the generated source, and server-render it against the packed chart runtime. `scripts/check-packages.mjs` encodes that route.

## Phased quality benchmark

These are acceptance gates for future work, not promises that each phase is implemented or a schedule for completing them.

### Phase 1: verifiable ecosystem foundation (this slice)

Prove the maintained runtime/core boundary with the linked line chart and exact-value table. Offer the ergonomic React entry point, one optional versioned local recipe, public-export examples, explicit semantics, guarded writes, and isolated packed-consumer checks. Retain the established chart regression tests while adding CLI coverage. README/ADRs and the Vite example document this foundation; they are not a complete docs application.

### Phase 2: a product-quality first library

Use real chart consumers to prioritize API work. Add a documentation site with runnable examples, visible source, prop/type reference, and tested installation paths. Validate supported Vite and Next.js integration, server/client boundaries, browser behavior, accessibility with assistive technology, narrow layouts, loading/empty/error states, and performance limits. Choose responsive layout and interaction policies deliberately rather than assuming SVG scaling settles them. No such compatibility or production certification is claimed by Phase 1.

### Phase 3: safe adoption and upgrades

Verify npm namespace ownership, supported versions, and release policy before publication. Verify public package contents and install commands before any authorized publication. Add release notes and compatibility guidance. Introduce a recipe update workflow only when real changes make it necessary, with consumer edits protected. Add agent-oriented documentation or richer CLI output only when it improves a demonstrated workflow.

### Phase 4: expand the ecosystem from evidence

Add another chart capability or UI-library family only after a concrete consumer need establishes its value and boundary. Share quality standards, design conventions, documentation, and release tooling where useful. Extract shared runtime code only when multiple real products demonstrate the same requirement; do not reserve empty future packages or impose a universal plugin engine.

## Tradeoffs and explicit limits

Three package boundaries add build and packing work, but preserve independent ownership and let packaging tests catch missing recipe assets. Bundled recipes are deterministic and available offline; their catalog and compatibility move with the CLI version. Keeping dependency installation out of the CLI adds a manual setup step, made explicit rather than hidden behind speculative package names.

The scaffold remains ESM/React 19, with the [chart guarantees and limitations](../../README.md#semantic-guarantees) unchanged. Multi-framework support, new UI families, application generation, third-party registries, automatic recipe upgrades, MCP integration, and a generalized design-system engine are deferred. All implementation is original and MIT licensed to Bhavesh Chowdhury; referenced projects retain their own code and licenses.
