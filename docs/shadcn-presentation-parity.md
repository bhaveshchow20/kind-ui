# Shared chart presentation audit follow-up

The 1 October audit found 59 gallery compositions supported through public imports, with genuine built-in presentation omissions. This change closes the bounded tooltip/legend omissions; it does not claim all 59 variants were rerendered or exact shadcn application UX parity.

## Source and design decision

Read the completed `Kind-UI-Shadcn-Chart-Audit-2026-10-01.md` and its 59-row CSV, pinned to Kind main `4a2a3a90fdc5e4bf8e8b449c1d6003ca55f62816` and [official chart source d75a96a](https://github.com/shadcn-ui/ui/blob/d75a96ab781f3d659be1ad287347d5887ce9f2fc/apps/v4/registry/new-york-v4/ui/chart.tsx). Familiar additive content options address the shared omissions without copying its implementation or introducing dependencies.

- `TooltipContent.hideLabel`, `.hideIndicator`, `.indicator` (`dot`, `line`, `dashed`). Existing slim line marker remains the default. Icons take precedence; hiding indicators hides all decorative tooltip markers, including configured icons. Labels, values, zero/missing handling, native formatter precedence and live-region semantics remain unchanged.
- `SeriesConfig.icon` is an optional component type. `Legend.hideIcon` restores the existing color swatch. Legend `children` receives key, label, visibility and the default marker for noninteractive item composition. The list and controlled native toggle remain Kind-owned.
- Unchanged pie itemKey seam `d309d29f0d438f97a0ae1fb20edb71652f9f31cd` is integrated once. Both measured Tooltip filtering and TooltipContent metadata use it. Custom content still receives native engine props and owns its rendering/accessibility. No new geometry or positioning code.
- `itemKey` plus native `labelFormatter` provides explicit category/name and heading customization. No second nameKey/labelKey resolution convention is introduced. This is a demonstrated public route, not drop-in prop equivalence.

## Evidence

The actual `examples/chart/presentation.html` host is copied into an isolated consumer installed from the real tarball, checked for public imports, typechecked in strict NodeNext/Bundler modes and production built. It demonstrates line/area/bar, icons, all indicator styles, label/decorative hiding, composed legend labels, native tuple/suppressed formatting, custom native content, host light/dark CSS and a full table.

`tests/chart.test.mjs` covers precedence, zero/missing/suppressed entries, unknown config keys, category identity/visibility, DOM prop separation and live feedback. `tests/presentation.spec.ts` checks rendered markers/styles, hidden heading/decoration, keyboard/controlled legend state, all-hidden recovery, actual custom content, settled mounted resize bounds and host theme colors. Full aggregate also covers existing Cartesian static/Motion/material recipes and packed consumers. Real Chromium desktop/phone screenshots are produced by the browser test. These checks do not establish real screen-reader, Safari/Firefox or touch conformance.

Local validation on the isolated original main base passed with Node 24.10.0/npm 11.9.0: `npm run check`, 16/16 component tests, 20/20 gate self-tests, strict packed NodeNext/Bundler and production builds, 106/106 Chromium tests including six presentation tests. Reserved ports 5473–5484 were used locally and restored before commit. A scoped independent reviewer found no runtime bug; its category-identity browser coverage finding was addressed with distinct `amount` dataKey versus `delivery`/`support` item keys and re-reviewed. Final integration/CI evidence is recorded in the draft PR at its exact head.

The original audit's immediate resize assertion failed once and passed 3 focused repeats unchanged. Retain that result; new settled measurement checks do not retrospectively convert the original run to 100/100. No runtime bounds change is justified by that intermittent observation alone.

## Remaining work with next actions

| Remaining finding | Precise next action |
| --- | --- |
| Pie whitespace/single-category seam and animation | Existing PR27 head `e20df29` owns corrections. Verify integrated pie/donut 3→2→1, zero and selected states at 320px; preserve explicit stroke/padding/corner overrides. This PR does not duplicate those edits. |
| Polar demonstration breadth/in-band labels/gauge | Existing PR26 head `7777882` owns 12 radar + 6 radial recipes and corrections. Re-run its packed/browser checks on integrated main and compare exact variants; do not credit the audit's old baseline as evidence for the new head. |
| Radar outer custom tick clipping; outside pie labels | Measure actual SVG text boxes at 320px after PR26/27 integration. Choose host margins/radius/abbreviations for clipped ticks and outside pie labels; no engine-wide geometry patch without reproduction. |
| Area date-range recipe | Add a host-owned 90/30/7-day filter with date labels, totals, empty/all-zero states and consistent full table; test controls and keyboard selector behavior. No package-wide schema. |
| Missing line demonstrations | Add per-point-colored dots, custom LabelList text and selected-series-total recipes; preserve public native geometry/label hooks and test data/total changes. |
| Missing pie demonstrations | Verify eventual pie recipe branch includes label/custom LabelList, concentric rings, active shapes, month selector and matching center totals/table; add whichever are still absent at that pinned head. |
| Bar selected/highlight semantics differ | Document existing host-persistent highlight; add source-style selected-series recipe only if requested, with consistent totals/table. Do not conflate those two interactions. |
| Optional React labels/colorless metadata/light-dark config maps | String labels and CSS colors remain required. Current example proves host CSS variable switching. If direct shadcn metadata compatibility is needed, propose a separate bounded optional-metadata/theme API and check readable legend names, colors in nested scopes, theme changes and SSR/CSS behavior before implementation. |
| Legend geometry differs in 6 original comparisons | Repeat at controlled plot dimensions and matching legend box height on integrated head; distinguish host layout height from native path geometry. Original 53/59 equal paths are retained, not upgraded. |
| Exact Select, icon artwork, Tailwind/card styling | Recreate those host controls only in a dedicated recipe parity pass using actual first-party data/source and 320px/desktop screenshots. This change proves reusable options, not those application details. |
| Resize assertion intermittency | Run the original mounted custom-content resize test repeatedly under contention at integrated head, using settled bounds; change runtime only after a reproducible visible escape. The new shared presentation test adds settled evidence. |
| Unverified browser/accessibility/performance coverage | Plan separate Safari/Firefox, actual screen-reader, touch, high-density, print/export and interrupted custom-shape/animation checks before making those claims. |

[59-row follow-up matrix](shadcn-presentation-follow-up.csv) retains original capabilities, recipe descriptions, geometry and evidence qualifications, adds shared API routes and remaining next actions. It is a follow-up, not a replacement for the completed audit. Histogram/Box plot and family materials proceed independently.

This additive pre-release change keeps `private: true`, version `0.0.0`, unchanged peers and no publishing/deployment. Integration into newer main is coordinated after the bounded patch is ready.
