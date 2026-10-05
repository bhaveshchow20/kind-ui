# Isolated PR53 website audit

This pass starts at PR53 head `3a950b482d19fb2d6f23dcbb34e66786b19af6db`, in a new checkout and branch `fix/pr53-launch-link-audit`. The active owner's workspace is untouched. The user subsequently authorized updating Next and integrating these fixes into existing PR53 with a normal fast-forward. No new PR, merge, deployment, DNS, sharing, login or publication action is included.

## Destinations and access

| Surface | Destination / result |
| --- | --- |
| Home wordmark | `/` in default preview; `/charts` in opt-in build |
| Desktop navbar, mobile navbar, footer Docs | Existing Sites `/docs/`, replacing the GitHub README target; explicit owner-private label/access note |
| Docs search | 16 keyboard-accessible links to 13 actual family pages; previously inert text |
| Family aliases | Donut → `pie`, Gauge / Radial Bar → `radial`, Bubble → `scatter` |
| Other families | `line`, `area`, `bar`, `combo`, `radar`, `heatmap`, `waterfall`, `sankey`, `histogram`, `box-plot` |
| GitHub / source API fallback / MIT license | Actual repository, main package README, main LICENSE; read-only HTTP 200 |
| Creator | Existing X profile target; HTTP 200 does not prove identity or profile content |
| Skip charts / back to top | Existing `#showcase` / `#top`; keyboard focus and scroll tested |
| Family tabs / chart cards | Tabs filter local previews; cards expose code/copy, not docs links. No separate homepage sidebar exists. No invented card routes added. |
| Package panel | Existing truthful pre-release copy retained; no registry install command/publication claim |
| Sponsor | Existing disabled unavailable control retained |

Unauthenticated reads of the exact Sites docs root and Heatmap route return **401**. These are access-gated results, not evidence of broken routes; settings were preserved. Source route proof uses PR84 snapshot `2e2fa69f8b4b24225a529140323c7042c3832f89` and PR108 `6db95fdfb761de8bc3185bc8ec979c1fbe04a0e6`: all 13 MDX component files and navigation entries exist; Fumadocs source uses `/docs`, Next generates static params with trailing slashes/static export. The release snapshot's Pie, Radial and Scatter content explicitly covers the aliases. Main `60463f240dbebca11b44900caeeccda88a2c1ef1` lacks Heatmap; that page belongs to the docs stack. PR84 moved to `f1616a8a163b2f6e387d77dbf5e5353689386f7f` during inspection. This pass does not claim deployed private content or a newly generated docs export was examined.

## Routing and assets

Default mode preserves the existing preview. Opt-in `NEXT_PUBLIC_SHOWCASE_BASE_PATH=/charts` enables the temporary root redirect and prefixed app/assets. `NEXT_PUBLIC_DOCS_URL=/charts/docs/` prepares same-origin links only when a host mounts the separate docs export. Plain anchors cross that app boundary. Current default destinations still use Sites, never unconfigured `kindui.dev`.

Artwork and icons use the same prefix helper. Geist/Geist Mono use Next bundled local assets with the original `100 900` variable weight range. Remove the nonexistent Instrument Serif request; Georgia was already the rendered fallback. Preserve the artwork/layout direction. Docs owner's agreed contract uses `KIND_DOCS_BASE_PATH=/charts/docs` and removes the internal `/docs` segment in opt-in mode; `/charts/docs/components/line/` is the target, not `/charts/docs/docs/components/line/`. Hosting must isolate showcase `/charts/_next` from docs `/charts/docs/_next`; no provider-specific routing is implemented here.

## Tested consumer identity

- Node 22.16.0; npm 11.6.0 on this MacBook (repository recommends npm 11.9.0).
- Showcase Next 16.3.4; Playwright 1.63.0 Chromium; one focused production server `127.0.0.1:7273`, one worker.
- `@kind-ui/charts@0.0.0` from the checked-in local file dependency, built from PR53 source. `packages/charts` has no diff against baseline source `68ce9ad10d617faae3f08c562cb2768035167ee3`.
- SHA-256 of the 107 built runtime/declaration/style files: `0c7a6baab9d5d7475cef76b53e2ee4f5915beaf8a7dcf98fb07960c0c43e8444`. Receipt algorithm: sort relative dist file names, exclude `.tsbuildinfo`, concatenate `name + NUL + SHA256(file)` separated by newline, then SHA256. This is a tree receipt, **not** tarball checksum/integrity.
- Original tarball `f412dbc92d7db7b6577832d378901db2395bf284d9722e560c3654c38e4005dc` was not supplied to this checkout; no repacking or exact-archive installation is claimed. Final integrated release artifact is still required.

## Checks and limits

- Production build/typecheck pass in default and `/charts` modes; all 256 snippets pass strict TypeScript.
- Original 17 browser cases executed: 13 pass, four bar-family reveal progression cases fail waiting for `[data-kind-ui="bar-reveal"]`. Subsequent progression/interruption assertions in those four cases did not execute. Those preexisting gates depend on a later library behavior than the old tested source; no internal patch or final chart pass is claimed.
- Three added website cases pass after correcting the selector to include the intentionally hidden mobile Docs anchor: actual link/alias/anchor targets; root redirect/direct refresh/artwork/icons/font requests; rapid mobile switching and keyboard results-panel scrolling.
- Prefixed focused suite excludes the four recorded progression failures: 16 pass. Includes 320/375/768/1280 layouts, themes, code dialog/search keyboard focus, custom palette apply/dismissal, legend replay, clipboard denial, four families' keyboard tooltips/axis containment and tooltip final glyph bounds.
- Root 66 public component tests pass. Root lint passes with 141 warnings / 12 informational diagnostics; whitespace check passes.
- Fresh independent Standards review found no actionable findings. Spec review identified missing variable font weights; corrected and reviewer confirmed resolved.
- Full root aggregate/browser fleet, mobile Safari/native color picker, screen reader, production hosting and final integrated package QA remain unrun. The local combined mount is recorded below. Reserved one-server scope prevents an uncoordinated root browser fleet.

## Security dependency blocker

Pinned Next 16.3.4 is flagged by npm audit for [GHSA-vcvr-r3jv-pc5j](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j). Official affected range is `>=16.2.0 <16.3.6`; first patched version is 16.3.6. It affects Node `next/og` ImageResponse receiving attacker-controlled SVG values. No `next/og` or ImageResponse usage exists in the showcase, so no applicable exploit path was demonstrated. Audit still reports one critical dependency advisory.

Automatic approval review rejected the exact `npm install --save-exact next@16.3.6` attempts, including parent-provided approval evidence and a later direct but contextless “approved” reply. It considered that evidence delegated/untrusted against the earlier version-change prohibition. No dependency or lockfile changes and no bypass occurred. The action remains paused pending direct approval accepted in this task. Do not move the denied edit to another executor/context. Rerun consumer checks after any authorized patch.


## Combined local mount follow-up

The docs owner supplied exact committed-tree export `c2d9933eecbafaf8e48e55c49d2373befd74fadb` at `task-7/evidence/routing-exports/c2d9933eecbafaf8e48e55c49d2373befd74fadb/verified-prefix`. Its `verified-prefix-receipt.json` manifest SHA-256 is `4899ba12a58ad3426d4ad7312ed89f067f7b1ad29f94d3184de68a0a60d129ed`; all 732 listed files were independently checked for exact byte length and SHA-256. The earlier interim `/prefix` snapshot is not the final receipt used for this proof.

One local origin on `127.0.0.1:7273` served `/charts/docs` and descendants from that immutable export, stripping only that prefix, decoding URL paths and resolving directory `index.html`. Other paths were forwarded to the showcase's Next server on loopback `7274`. One Chromium worker/context completed 21 recorded checks: root 307, desktop/mobile navbar links into docs, showcase Line search into docs, docs sidebar/search client navigation, eight desktop/mobile deep-link refreshes, Markdown clipboard parity, prefixed search JSON and seven retrieval resources. Local page errors and failed requests were both empty. Artwork/icons/fonts from both apps loaded under their separate namespaces. Desktop/mobile screenshots were retained after waiting for the hero entrance to settle.

Reproduction script and machine-readable results are retained in the task workspace at `task-8/evidence/check-combined-routing.mjs` and `task-8/evidence/combined-routing-results.json`, with screenshots/logs alongside. These are local integration evidence, not provider routing configuration or a production/deployment guarantee. Tested showcase source is `f7c2702bfa9590dde5a7a15cb930cd487382b90e` on unchanged Next 16.3.4 and the older local chart source above. No dependency/security patch, library changes, docs export mutations, remote pushes or sharing changes occurred during this follow-up.


## Exact integrated 0.1.0 consumer follow-up

- Candidate source: `97aeef132fd3a83bd0cf0e79c9977442dcbaaeae` (clean owner receipt).
- Tarball SHA-256: `837f4b48a464e631abc37695903168110dc5833e21946bc9129ffe997ab295a9`.
- npm integrity: `sha512-avxo4EElrz0eTTbSscw8xQGXehvviTdL6+9teOPyCECoAvfvYZ0wgeWjBTjLAOwpNf2ALFl99cOvWtxFJ+jofQ==`.
- Exact version: `@kind-ui/charts@0.1.0`. All 121 archived files match the installed standalone consumer package byte-for-byte. No source rebuild/repacking, registry-publication claim or library-internal patch occurred.
- Install: `npm install --no-save --package-lock=false` with the checksum-verified local archive; tracked app manifest/lockfile, package private/version policy and Next 16.3.4 remain unchanged.
- Consumer peers: React/React DOM/React Is 19.3.0, Recharts 3.10.1, Motion 13.4.6; Node 22.16.0 / npm 11.6.0.
- Production build/typecheck and all 256 snippets pass in default and `/charts` modes. Complete browser execution: **20/20 default + 20/20 prefixed** on one loopback 7273 server and one worker.
- The four former animation failures are superseded for these exact bytes. Initial candidate testing exposed a website test bug: `Number()` treated valid SVG height attributes with `px` as NaN. The final correction uses `SVGRectElement.height.baseVal.value`; progression thresholds and every completion/replay/interruption/resize/family-switch/reduced-motion assertion remain unchanged. A fresh reviewer cleared the correction.
- Root lint still passes with 141 warnings / 12 informational diagnostics. Earlier 66 root component tests used the baseline repository source; they are not presented as new candidate component validation.

The checked-in dependency is still the local repository reference, not a portable candidate pin or registry receipt. See README's exact-archive reproduction command. The supplied bytes and machine-readable installed receipt are retained under the task workspace's `evidence/integrated-candidate/`. A subsequent `npm ci` resets the temporary installation. Future publication verification and a registry-only lock/pin are still required before installation copy changes. The paused Next patch remains a separate gate.


The integrated showcase also passes the combined local 21-check routing harness against the same checksum-verified `c2d9933` docs export. The docs package remains `0.0.0`; this is explicitly recorded in the machine receipt and is not final candidate docs QA. Eight additional native-clock image-progression checks cover Bar, Histogram, Box Plot and Waterfall at 1440px and 375px: each starts with a positive clip length, grows, changes the rendered card image, and finishes with the clip removed. Early/later images were inspected after waiting for card entrances to settle. No local page errors or failed requests occurred. These images supplement the deterministic completion/replay/interruption/reduced-motion tests; they do not claim mobile Safari/native-picker or manual screen-reader coverage.

Final consumer evidence: `task-8/evidence/integrated-candidate/installed-receipt.json`, `default-browser.log`, `prefix-browser.log`, `combined-routing-results.json`, and `visual/*-early.png` / `*-later.png`. Website test correction commit: `db27e42076735bb7f8169d38bdb7a6a18dfd3d64`. The candidate was tested without persisting its dependency override or changing the paused Next version.


## Corrected candidate parity verification

The latest exact supplied `@kind-ui/charts@0.1.0` candidate, clean source `d66ad717eaa0220b83b60de9420c94b65d67118c`, SHA-256 `d26d3edb360a274acf306f66e1413316fd4c18596b138c87e97e34db049273b5`, supersedes the earlier candidate consumer result. All 121 installed files match its archive. Default and `/charts` production builds, strict types, 256 snippets per mode and all 20 browser cases per mode pass. Eight additional Heatmap cases cover both examples at 1440px/320px in both modes: keyboard/roving focus, Escape and blur dismissal, stationary boundary suppression, movement/click recovery, narrow-screen containment and repeated family switching. The focused harness waits for card entrances before keyboard checks, observes the mounted tooltip's hidden state, and targets current cell geometry after in-flow layout changes.

Combined local routing passes against checksum-verified immutable docs source `e479ed1414aedd3724111f0c15408f0c5156372a`, manifest SHA-256 `7b12c9f3531d4045e1b56fae4889b5bed57316a0bf401aab0f73ac4ddd01147f` (762 files). Both apps now use identical corrected candidate bytes. All 21 navigation/search/reload/clipboard/retrieval checks and eight native-clock rendered progression cases pass, with no local page errors or failed responses. Earlier receipts remain historical. Exact evidence is retained under `task-8/evidence/corrected-candidate/`, including `installed-receipt.json`, `validation-summary.json`, mode build/types/snippets/browser logs, Heatmap receipts, and `combined/combined-routing-results.json`.

This is temporary exact-tarball candidate validation, not registry installation or publication. Manifests, lockfiles and chart source are unchanged. Next remains 16.3.4; the paused security patch and blocked PR53 push were not retried. Production hosting, registry pin/installation, manual screen-reader, native-picker and mobile Safari checks remain separate launch gates. Producer npm is 11.9.0; this consumer used npm 11.6.0 on Node 22.16.0.


## Authorized Next security update

The user's direct authorization replaced the earlier Next-version and push holds. Showcase now pins Next.js 16.3.6, with the lockfile regenerated and a clean install validated using npm 11.9.0 / Node 22.16.0. The only manifest value change is Next; lockfile version changes are limited to Next, its environment package and SWC binaries. npm additionally records six bundled optional Tailwind WASI dependency entries; no other existing package version changed. npm audit reports zero vulnerabilities.

Against the unchanged corrected charts candidate `d66ad717` / SHA-256 `d26d3edb360a274acf306f66e1413316fd4c18596b138c87e97e34db049273b5`, default and `/charts` builds, strict types, 256 snippets and all 20 browser tests per mode pass again. Eight focused Heatmap cases pass. Combined routing against immutable docs `e479ed1` passes 21 navigation/resource checks and eight rendered animation cases, with zero page errors or failed responses. Root lint passes with its existing 141 warnings / 12 informational diagnostics; whitespace checks pass. The root aggregate/browser fleet was not rerun in this focused single-server website check.

Evidence: `task-8/evidence/next-16.3.6/` contains the audit, installed candidate receipt, both mode logs, Heatmap receipts and combined routing receipt. The charts override remains temporary and the tracked charts dependency remains a local repository link, not a registry pin. Historical blocked-patch statements above are superseded by this approved security update. Existing private sharing and deployment settings are unchanged; no deployment, merge or publication is included.
