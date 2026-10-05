# Isolated PR53 website audit

This pass starts at PR53 head `3a950b482d19fb2d6f23dcbb34e66786b19af6db`, in a new checkout and branch `fix/pr53-launch-link-audit`. The active owner's branch/workspace is untouched. No remote push, new PR, merge, deployment, DNS, sharing, login or publication action was taken.

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
- Full root aggregate/browser fleet, mobile Safari/native color picker, screen reader, combined two-app mount and final integrated package QA remain unrun. Reserved one-server scope prevents an uncoordinated root browser fleet.

## Security dependency blocker

Pinned Next 16.3.4 is flagged by npm audit for [GHSA-vcvr-r3jv-pc5j](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j). Official affected range is `>=16.2.0 <16.3.6`; first patched version is 16.3.6. It affects Node `next/og` ImageResponse receiving attacker-controlled SVG values. No `next/og` or ImageResponse usage exists in the showcase, so no applicable exploit path was demonstrated. Audit still reports one critical dependency advisory.

Automatic approval review rejected `npm install --save-exact next@16.3.6` twice, including the one retry with parent-provided user approval evidence. It considered that evidence delegated/untrusted against the earlier version-change prohibition. No dependency or lockfile changes and no bypass occurred. The action remains paused pending direct approval accepted in this task. Do not move the denied edit to another executor/context. Rerun consumer checks after any authorized patch.
