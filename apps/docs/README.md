# Kind UI charts documentation

Standalone Fumadocs/Next MDX application with build-time typed API and Markdown generation. This source is maintained in `apps/docs`; the Sites checkout is a generated deployment snapshot, not another editable application. The Components shell uses maintained shadcn/ui and Radix primitives, retaining Fumadocs content/search/API infrastructure. Component pages follow a Preview/Usage/Code flow; only brand colors/wordmark cues come from the separately owned showcase.

## Run

Use Node 22.12+ and npm 11.9. From the repository root run `npm ci`. In this directory:

1. `node scripts/verify-pinned-package.mjs` verifies the checked-in guarded artifact against `vendor/provenance.json`. The source commit, version, checksum and npm integrity identify the exact released package. CI consumes those bytes. Artifact refreshes are owned centrally and require a new package gate, app/consumer locks and consumer verification.
2. `npm ci` installs the isolated app from its lockfile. If the package artifact changes, use `npm install --save-exact ./vendor/kind-ui-charts-0.2.0.tgz` to update the lockfile and install it.
3. `npm run generate`, `npm run check:consumers`, then `npm run generate` establishes the consumer lock when preparing a new artifact.
4. `npm run build` exports static `out/`; `npm run check` verifies app types, selected-state contracts and exported links. `npm run preview` serves only reserved port 6373. `node scripts/check-browser.mjs` checks the built preview.

When the tarball changes, regenerate the matching app and `examples/shared/consumer-package-lock.json` chart entries with npm and verify that unrelated dependency pins remain unchanged. Consumers install and verify the promoted bytes; a matching version alone does not establish matching artifacts.

To promote an already successful hosted Node 22 package gate, download its retained artifact and run `npm run prepare:package -- --validated-dir /absolute/extracted/package`. This checks the recorded package/version, clean source revision, unchanged package/guard files, SHA-256 and npm integrity before copying the exact tarball. It records the original workflow and tool receipt in private provenance and does not repack. The 0.2.0 pin comes from the existing release workflow; its bytes and npm integrity match the public release. `--reuse-validated` remains limited to the already-pinned unchanged artifact; registry preparation and retained promotion are separate modes.

`KIND_DOCS_ORIGIN` sets absolute canonical agent retrieval links at generation/build time. `KIND_DOCS_RELEASE_VERSION` requests an exact registry artifact in the preparation script; the maintained CI pin remains the guarded artifact recorded in provenance. A release/version change needs a new package gate, both lockfiles, consumers, docs export and review. The workspace remains private at `0.0.0`.

## Canonical examples

Thirteen component families have 49 complete examples, including ActivityRings within Radial. `examples/<id>/example.tsx` sources drive actual previews and complete consumer files; selectable options use the same source in Code and Copy prompt. The generator extracts literal defaults without executing source and produces packages with public imports only. Usage shows integration with the included example; Code shows complete consumer source. The customization guide and copied `combo-motion/options.tsx` cover the released presentation and interaction options, with generated API tables, defaults and limits.

`lib/public-types.ts` and family-owned `lib/public-types/<family>.ts` select uniquely named public declaration contracts for generated tables; engine-native props remain documented through Recharts. Content is grouped into Start, Concepts, shared Chart Components, family Components, Guides and Agents. `public/AGENTS.md`, generated Markdown, llms.txt and llms-full.txt are synchronized with complete consumer setup and code.

## Verification and deployment

The root guarded tarball gate verifies runtime/declarations/CSS/license and isolated typed production consumers. Docs build every copied example with strict NodeNext and Bundler resolution, verify selected prompts and agent assets, and check all browser groups. Required hosted `All checks` and `All docs checks` must pass at the final PR head. Coordinate local browser ports with other sessions. Public registry installation and deployment retrieval are checked during their separate authorized handoffs.

The selected deployment owner controls the authorized Sites project and audience. `snapshot:site -- /absolute/generated/site/checkout` copies static output and provenance while preserving its hosting project ID. Coordinate homepage integration and deployment of the exact approved source with that owner. The production indexing handoff is documented in [docs/production-indexing.md](../../docs/production-indexing.md).

MIT for original contributions; see `THIRD_PARTY_NOTICES.md` for dependencies and reference provenance. The guarded tarball is retained as the reproducible documentation pin, alongside its source and checksum provenance. Do not commit generated output, screenshots, tokens, caches or node_modules.

Area keeps explicit Root + ResponsiveContainer + AreaChart composition and consumer-owned legend selection. Area and Line consume the same guarded artifact recorded in provenance. Area browser checks run through `node scripts/start-area-checks.mjs` and record responsive, selected-source, keyboard, motion and scroll evidence.

## Adding a component page

Each page owns `content/docs/components/<family>.mdx`, `examples/<family>*/example.tsx`, `examples/<family>-catalog.mjs`, `components/previews/<family>.tsx`, optional `lib/public-types/<family>.ts`, and focused family checks. Keep library and shared pin changes out of page PRs.

The catalog exports `family = { id, examples, dataLabels, variants }`. Put the primary example (whose ID equals the family ID) first; use family-prefixed IDs for recipes. Every example includes title, notes and acceptance metadata. Each `dataLabels[id]` supplies a caption and named columns. The generator extracts literal `const data` without executing example source, including negative numbers; supply explicit `rows` for computed or structured datasets. Keep those rows synchronized with every observation, including missing values, and verify the accessible data alternative.

For selectable string props, each `variants[id]` supplies `control`, the actual `prop`, its string `default`, and `options: [{ value, label }]`. The standalone example declares that literal default (for example `material = "plain"`); generation changes only that default. The family preview module exports `previews`, keyed by example ID. Preview adapters accept `{ variant?: string }` and map it to actual typed example props, using literal Next dynamic imports and `ssr: false` as Line and Area do. Never put generic demo controls or settings in copied consumers.

Use `<ChartExample id="…" />` in MDX; the existing LineExample and AreaExample names remain compatible. Page workers may add only their own import/spread registration to `components/previews/index.ts` and their navigation entry in `content/docs/components/meta.json` so each draft is runnable. Integration owns cumulative reconciliation and shared changes. Catalog and type discovery, copied consumers, Markdown, search membership, and agent indexes reuse the common build pipeline; do not copy the generator or playground into each page. The contract/export checks must pass at every bounded draft layer.

## Optional application prefix

The default build keeps `/docs/` pages and nonindexable preview metadata. Production builds use `KIND_UI_DEPLOYMENT_ENV=production` and `NEXT_PUBLIC_KIND_DOCS_BASE_PATH=/charts/docs`. The prefix is compiled into routes, navigation, search, assets and retrieval links; changing it requires rebuilding. Component pages then live at `/charts/docs/components/line/`, without another `/docs/` segment.

`NEXT_PUBLIC_KIND_DOCS_BASE_PATH=/charts/docs KIND_DOCS_PORT=6374 npm run preview` mounts `out/` beneath that prefix locally. An integration harness must strip `/charts/docs` before reading the intact export, serve directory `index.html` files for deep reloads, and keep this application's `_next`, Markdown, examples and search endpoint under the docs prefix. Set `KIND_DOCS_ORIGIN=https://kindui.dev` for absolute production agent links. Hosting and DNS remain part of the deployment owner's handoff.
