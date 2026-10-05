# Launch preparation checks

PR #53 remains a draft. No deployment, public preview, visibility/domain change, merge, npm publication or announcement was performed in this preparation pass.

## Current tested baseline

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

- The final integrated artifact has not been supplied. PR #102 is not treated as that artifact; compact Heatmap #96, color/legend defaults #97 and activity rings #99 remain separately owned. No substitute APIs or library-internal patches were introduced here.
- Issue #71 is closed upstream; the axis-measurement entrance fix is present in main via #89. The tested older baseline predates it. Do not report Bar, Histogram, Box Plot or Waterfall entrances as fixed in this app until the final package is installed and browser progression/interruption checks pass.
- Browser execution was unavailable: the managed preview requires the unavailable control-browser capability, and Chromium is not installed. No alternate browser/server workflow was improvised. Full aggregate `npm run check` is not complete; an initial attempt stopped at lint before generated-output exclusions/fixes, and browser stages remain unrun. Final standalone lint/component checks pass separately.
- The suite covers keyboard dialogs/tooltips, viewport containment, themes, native-picker focus safety, palette apply/dismissal, clipboard denial, legend-preserving replay, visible reveal progression and repeated/interrupted/reduced-motion behavior for the four bar-based families, plus tooltip final-digit bounds. These tests must execute against the final bytes; mobile Safari/native color-panel behavior and visual artwork/spacing review also need browser/device confirmation.
- Registry publication is unverified. Keep the pre-release panel until an exact published version, registry integrity and fresh registry-only installation have been verified. Follow README’s artifact/publication handoff steps then rerun all consumer checks.
