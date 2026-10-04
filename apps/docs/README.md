# Kind UI charts documentation

Standalone Fumadocs/Next MDX application with build-time typed API and Markdown generation. This source is maintained in `apps/docs`; the Sites checkout is a generated deployment snapshot, not another editable application. The Components shell uses maintained shadcn/ui and Radix primitives, retaining Fumadocs content/search/API infrastructure. Visual flow follows the Preview/Usage/Code beUI reference; only brand colors/wordmark cues come from the separately owned showcase.

## Run

Use Node 22.12+ and npm 11.9. From the repository root run `npm ci`. In this directory:

1. `node scripts/verify-pinned-package.mjs` verifies the checked-in guarded artifact against `vendor/provenance.json`. The current pin is built from main `68ce9ad10d617faae3f08c562cb2768035167ee3`, including the merged tooltip, animation and legend fixes. CI consumes those exact bytes rather than repacking main. Artifact refreshes are owned centrally and require a new package gate, app/consumer locks and consumer verification.
2. `npm ci` installs the isolated app from its lockfile. If the package artifact changes, use `npm install --save-exact ./vendor/kind-ui-charts-0.0.0.tgz` to update the lockfile and install it.
3. `npm run generate`, `npm run check:consumers`, then `npm run generate` establishes the consumer lock when preparing a new artifact.
4. `npm run build` exports static `out/`; `npm run check` verifies app types, selected-state contracts and exported links. `npm run preview` serves only reserved port 6373. `node scripts/check-browser.mjs` checks the built preview.

When the tarball changes, delete only this app's `examples/shared/consumer-package-lock.json` and ignored `artifacts/consumer/` before regenerating the clean consumer lock. Never reuse a lock from a different artifact just because both versions say 0.0.0.

`KIND_DOCS_ORIGIN` sets absolute canonical agent retrieval links at generation/build time. `KIND_DOCS_RELEASE_VERSION` supports a future exact authorized published version; keep local mode until a release actually exists. A release/version change needs a new package gate, both lockfiles, consumers, docs export and review. This app does not change root private/version policy.

## Canonical examples

Line and Area are documented. Five Line and four Area `examples/<id>/example.tsx` sources drive the actual previews and complete consumer files; curve and material choices use the same selected source in Code and Copy prompt. The generator extracts literal defaults without executing source and produces consumer packages with public imports only. The selected source feeds code and compact prompts. Usage shows integration with the included example; Code shows complete consumer source, not chart implementation internals.

`lib/public-types.ts` and optional family-owned `lib/public-types/<family>.ts` select uniquely named focused public declaration contracts for generated tables; engine-native props remain documented through Recharts. Content is grouped into Start, Concepts, Components (Line and Area), Guides and Agents. `public/AGENTS.md`, generated Markdown, llms.txt and llms-full.txt are synchronized with package provenance.

## Verification and deployment

The root guarded tarball gate verifies runtime/declarations/CSS/license and isolated typed production consumers. Docs additionally build every copied example, verify pinned assets/selected prompts and run one local Chromium pass. Root aggregate browser fleets are excluded from this delegated scope to preserve other sessions' ports. Passing this preview does not establish anonymous retrieval, registry installation, assistive-technology support or untested browsers.

Native Sites hosting owns only the new owner-private docs project. `snapshot:site -- /absolute/generated/site/checkout` copies static output and provenance while preserving its hosting project ID. Use the official Sites workflow to commit/push/package the snapshot and deploy that exact version privately. Never run these scripts against the existing showcase Site.

MIT for original contributions; see `THIRD_PARTY_NOTICES.md` for dependencies and reference provenance. The validated private 0.0.0 tarball is retained solely as the explicitly requested reproducible documentation pin, alongside its source and checksum provenance. Do not commit generated output, screenshots, tokens, caches or node_modules.

Area keeps explicit Root + ResponsiveContainer + AreaChart composition and consumer-owned legend selection. Area and Line consume the same guarded artifact recorded in provenance. Area browser checks run through `node scripts/start-area-checks.mjs` and record responsive, selected-source, keyboard, motion and scroll evidence.

## Adding a component page

Each page owns `content/docs/components/<family>.mdx`, `examples/<family>*/example.tsx`, `examples/<family>-catalog.mjs`, `components/previews/<family>.tsx`, optional `lib/public-types/<family>.ts`, and focused family checks. Keep library and shared pin changes out of page PRs.

The catalog exports `family = { id, examples, dataLabels, variants }`. Put the primary example (whose ID equals the family ID) first; use family-prefixed IDs for recipes. Every example includes title, notes and acceptance metadata. Each `dataLabels[id]` supplies a caption and named columns. The generator extracts literal `const data` without executing example source, including negative numbers; supply explicit `rows` for computed or structured datasets. Keep those rows synchronized with every observation, including missing values, and verify the accessible data alternative.

For selectable string props, each `variants[id]` supplies `control`, the actual `prop`, its string `default`, and `options: [{ value, label }]`. The standalone example declares that literal default (for example `material = "paper"`); generation changes only that default. The family preview module exports `previews`, keyed by example ID. Preview adapters accept `{ variant?: string }` and map it to actual typed example props, using literal Next dynamic imports and `ssr: false` as Line and Area do. Never put generic demo controls or settings in copied consumers.

Use `<ChartExample id="…" />` in MDX; the existing LineExample and AreaExample names remain compatible. Integration owns the two-line import/spread addition to `components/previews/index.ts` and the navigation entry in `content/docs/components/meta.json`. Catalog and type discovery, copied consumers, Markdown, search membership, and agent indexes reuse the common build pipeline; do not copy the generator or playground into each page. The contract/export checks must pass at every bounded draft layer.
