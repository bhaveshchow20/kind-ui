# Kind UI charts documentation

Standalone Fumadocs/Next MDX application with build-time typed API and Markdown generation. This source is maintained in `apps/docs`; the Sites checkout is a generated deployment snapshot, not another editable application. The Components shell uses maintained shadcn/ui and Radix primitives, retaining Fumadocs content/search/API infrastructure. Visual flow follows the Preview/Usage/Code beUI reference; only brand colors/wordmark cues come from the separately owned showcase.

## Run

Use Node 22.12+ and npm 11.9. From the repository root run `npm ci`. In this directory:

1. `npm run prepare:package` runs the guarded root package gate and copies its retained artifact plus verified checksum into ignored `vendor/`. It does not publish anything. `-- --reuse-validated` is for the same already-validated unchanged source checkout only.
2. `npm ci` installs the isolated app from its lockfile. If the package artifact changes, use `npm install --save-exact ./vendor/kind-ui-charts-0.0.0.tgz` to update the lockfile and install it.
3. `npm run generate`, `npm run check:consumers`, then `npm run generate` establishes the consumer lock when preparing a new artifact.
4. `npm run build` exports static `out/`; `npm run check` verifies app types, selected-state contracts and exported links. `npm run preview` serves only reserved port 6373. `node scripts/check-browser.mjs` checks the built preview.

When the tarball changes, delete only this app's `examples/shared/consumer-package-lock.json` and ignored `artifacts/consumer/` before regenerating the clean consumer lock. Never reuse a lock from a different artifact just because both versions say 0.0.0.

`KIND_DOCS_ORIGIN` sets absolute canonical agent retrieval links at generation/build time. `KIND_DOCS_RELEASE_VERSION` supports a future exact authorized published version; keep local mode until a release actually exists. A release/version change needs a new package gate, both lockfiles, consumers, docs export and review. This app does not change root private/version policy.

## Canonical examples

Each `examples/<id>/example.tsx` and `settings.ts` drives the actual preview and complete consumer files. All persistent knobs and controlled visibility belong in `ExampleSettings`. The generator extracts literal defaults without executing source and produces consumer packages with public imports only. The same selected settings feed code, downloads and compact prompts. Usage shows integration with the included example; Code shows complete consumer source, not chart implementation internals.

`lib/public-types.ts` selects focused public declaration contracts for generated tables; engine-native props remain documented through Recharts. Content is grouped into Start, Concepts, Components, Reference, Guides and Agents. `public/AGENTS.md`, generated Markdown, llms.txt and llms-full.txt are synchronized with package provenance.

## Verification and deployment

The root guarded tarball gate verifies runtime/declarations/CSS/license and isolated typed production consumers. Docs additionally build every copied example, verify downloads/selected prompts and run one local Chromium pass. Root aggregate browser fleets are excluded from this delegated scope to preserve other sessions' ports. Passing this preview does not establish anonymous retrieval, registry installation, assistive-technology support or untested browsers.

Native Sites hosting owns only the new owner-private docs project. `snapshot:site -- /absolute/generated/site/checkout` copies static output and provenance while preserving its hosting project ID. Use the official Sites workflow to commit/push/package the snapshot and deploy that exact version privately. Never run these scripts against the existing showcase Site.

MIT for original contributions; see `THIRD_PARTY_NOTICES.md` for dependencies and reference provenance. Do not commit tarballs, generated output, screenshots, tokens, caches or node_modules.
