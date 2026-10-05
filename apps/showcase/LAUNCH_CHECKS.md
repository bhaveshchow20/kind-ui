# Launch preparation checks

PR #53 remains a draft. No deployment, public preview, visibility/domain change, merge, npm publication or announcement was performed in this preparation pass.

## Historical tested baseline

- Installed package: `@kind-ui/charts@0.0.0`, from the existing validated tarball, not PR #102’s final successor.
- Baseline library source: `68ce9ad10d617faae3f08c562cb2768035167ee3`.
- Tarball SHA-256: `f412dbc92d7db7b6577832d378901db2395bf284d9722e560c3654c38e4005dc`.
- All 107 installed runtime, declaration and stylesheet files match those archive bytes.
- The committed manifest and lockfile still describe local repository consumption; they are not a release pin or proof of registry publication.

## Passed

- Root `npm ci` and showcase dependency installation, followed by installation of the exact baseline archive for consumer checks.
- Showcase strict TypeScript check and standalone Next.js production build on Node 24.19.0 / npm 11.9.0.
- All 256 generated examples typecheck against the installed baseline: 32 recipes × four finishes × motion on/off.
- Root public component tests: 66 passed against the PR’s baseline library source.
- Root lint: no errors; existing recommended-rule warnings remain (137 warnings / 12 informational diagnostics).
- Browser suite discovery: 17 cases compile/enumerate. This is not a browser execution pass.
- Diff whitespace check.

## Website changes

Keep the artwork and layout direction. Narrow-screen navigation and titles receive spacing/focus refinements; theme options now use actual accessible radio buttons. Palette editing stays isolated from gallery renders. Replay remounts the renderer while preserving Histogram/Box Plot visibility state. Reduced motion explicitly disables chart entrances and animated tooltip digits. Clipboard requests/timers are cleaned up, failures are visible, and syntax-highlighter failures retain selectable plain code. Add route loading/error states, predictable number formatting, and pre-release package copy instead of unverified install commands. Remove stale sample-data/install styling and format existing CSS for repository checks. Ignore generated Next/browser outputs in lint.

## Pending / blockers

- At the historical baseline pass, the final integrated artifact had not been supplied. The candidate receipt below supersedes that absence for local consumer testing. PR #102 is not treated as that artifact; compact Heatmap #96, color/legend defaults #97 and activity rings #99 remain separately owned. No substitute APIs or library-internal patches were introduced here.
- Issue #71 is closed upstream; the axis-measurement entrance fix is present in main via #89. The tested older baseline predates it. Do not report Bar, Histogram, Box Plot or Waterfall entrances as fixed in this app until the final package is installed and browser progression/interruption checks pass.
- Browser execution was unavailable: the managed preview requires the unavailable control-browser capability, and Chromium is not installed. No alternate browser/server workflow was improvised. Full aggregate `npm run check` is not complete; an initial attempt stopped at lint before generated-output exclusions/fixes, and browser stages remain unrun. Final standalone lint/component checks pass separately.
- The suite covers keyboard dialogs/tooltips, viewport containment, themes, native-picker focus safety, palette apply/dismissal, clipboard denial, legend-preserving replay, visible reveal progression and repeated/interrupted/reduced-motion behavior for the four bar-based families, plus tooltip final-digit bounds. These tests must execute against the final bytes; mobile Safari/native color-panel behavior and visual artwork/spacing review also need browser/device confirmation.
- Registry publication is unverified. Keep the pre-release panel until an exact published version, registry integrity and fresh registry-only installation have been verified. Follow README’s artifact/publication handoff steps then rerun all consumer checks.

## Subsequent isolated website audit

See `ROUTE_AUDIT.md` for the new MacBook execution receipt. It supersedes the earlier browser-unavailable note only for the explicitly recorded older-source website tests: 13/17 original cases pass; the four progression gates remain failures. Three added route/interaction cases and the 16-case prefixed website suite pass. This does not supersede the final integrated-artifact or registry-publication blockers above. Docs sharing remains owner-private. Routing preparation is opt-in; no hosting/DNS deployment occurred.

The subsequent local combined-origin mount also passes against the docs owner's final immutable `c2d9933` export: 21 recorded routing/access-resource checks with no local page errors/failed requests. This proves the local prefix boundary, not production hosting or the paused Next security patch. See `ROUTE_AUDIT.md` for the exact receipt.


## Integrated candidate verification

Exact supplied `@kind-ui/charts@0.1.0`, source `97aeef132fd3a83bd0cf0e79c9977442dcbaaeae`, SHA-256 `837f4b48a464e631abc37695903168110dc5833e21946bc9129ffe997ab295a9`, now passes the showcase production build/typecheck, all 256 snippets and complete 20-case browser suite in both default and `/charts` modes. All 121 installed files match the exact tarball; no repacking or tracked dependency/lockfile change occurred. The four animation cases now execute progression, completion, repeated replay, interruption, resize, family-switch and reduced-motion assertions. Their old `Number("21px")` test bug was corrected to the browser's resolved SVG numeric length and independently reviewed.

This supersedes the earlier four failures for these exact candidate bytes. Registry-only installation/publication, a committed release pin, the paused Next security dependency patch, production hosting, mobile Safari/native picker and manual screen-reader checks remain separate gates. The docs side of the combined prefix proof retains its independently owned older package pin.

Combined local routing also passes with the integrated showcase: 21 navigation/resource checks plus eight native-clock rendered progression image pairs at desktop/mobile, zero local page errors/failed requests. The immutable docs export still uses its older `0.0.0` pin; final updated docs candidate QA belongs to its owner.


## Corrected candidate parity verification

The latest exact supplied `@kind-ui/charts@0.1.0` candidate, clean source `d66ad717eaa0220b83b60de9420c94b65d67118c`, SHA-256 `d26d3edb360a274acf306f66e1413316fd4c18596b138c87e97e34db049273b5`, supersedes the earlier candidate consumer result. All 121 installed files match its archive. Default and `/charts` production builds, strict types, 256 snippets per mode and all 20 browser cases per mode pass. Eight additional Heatmap cases cover both examples at 1440px/320px in both modes: keyboard/roving focus, Escape and blur dismissal, stationary boundary suppression, movement/click recovery, narrow-screen containment and repeated family switching. The focused harness waits for card entrances before keyboard checks, observes the mounted tooltip's hidden state, and targets current cell geometry after in-flow layout changes.

Combined local routing passes against checksum-verified immutable docs source `e479ed1414aedd3724111f0c15408f0c5156372a`, manifest SHA-256 `7b12c9f3531d4045e1b56fae4889b5bed57316a0bf401aab0f73ac4ddd01147f` (762 files). Both apps now use identical corrected candidate bytes. All 21 navigation/search/reload/clipboard/retrieval checks and eight native-clock rendered progression cases pass, with no local page errors or failed responses. Earlier receipts remain historical. Exact evidence is retained under `task-8/evidence/corrected-candidate/`, including `installed-receipt.json`, `validation-summary.json`, mode build/types/snippets/browser logs, Heatmap receipts, and `combined/combined-routing-results.json`.

This is temporary exact-tarball candidate validation, not registry installation or publication. Manifests, lockfiles and chart source are unchanged. Next remains 16.3.4; the paused security patch and blocked PR53 push were not retried. Production hosting, registry pin/installation, manual screen-reader, native-picker and mobile Safari checks remain separate launch gates. Producer npm is 11.9.0; this consumer used npm 11.6.0 on Node 22.16.0.


## Authorized Next security update

The user's direct authorization replaced the earlier Next-version and push holds. Showcase now pins Next.js 16.3.6, with the lockfile regenerated and a clean install validated using npm 11.9.0 / Node 22.16.0. The only manifest value change is Next; lockfile version changes are limited to Next, its environment package and SWC binaries. npm additionally records six bundled optional Tailwind WASI dependency entries; no other existing package version changed. npm audit reports zero vulnerabilities.

Against the unchanged corrected charts candidate `d66ad717` / SHA-256 `d26d3edb360a274acf306f66e1413316fd4c18596b138c87e97e34db049273b5`, default and `/charts` builds, strict types, 256 snippets and all 20 browser tests per mode pass again. Eight focused Heatmap cases pass. Combined routing against immutable docs `e479ed1` passes 21 navigation/resource checks and eight rendered animation cases, with zero page errors or failed responses. Root lint passes with its existing 141 warnings / 12 informational diagnostics; whitespace checks pass. The root aggregate/browser fleet was not rerun in this focused single-server website check.

Evidence: `task-8/evidence/next-16.3.6/` contains the audit, installed candidate receipt, both mode logs, Heatmap receipts and combined routing receipt. The charts override remains temporary and the tracked charts dependency remains a local repository link, not a registry pin. Historical blocked-patch statements above are superseded by this approved security update. Existing private sharing and deployment settings are unchanged; no deployment, merge or publication is included.
