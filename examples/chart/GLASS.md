# Glass material lab — experimental, no merge approval

This is an example-owned prototype, based on verified `main`
`156fb413028d83f70789209b5a7b10c8fde00ec4`. User approval is required before
merging Glass or changing the shared public material contract. No production
chart source, public material union, dependency manifest, existing alpha test,
live Site, or other checkout was changed.

Run the existing development server on an unused isolated port:

```sh
npm run build
npm exec vite -- examples/chart --host 127.0.0.1 --port 6073 --strictPort
# Open http://127.0.0.1:6073/glass.html
node scripts/glass-prototype-check.mjs
node scripts/glass-prototype-pixels.mjs
node scripts/glass-prototype-capture.mjs
```

The scripts require already available Playwright Chromium, use port 6073, and
write disposable evidence beneath `artifacts/glass/`. The final Vite production
build includes `glass.html`. No additional aesthetic dependency is needed.

## Rendering and ownership

Plain and Glass use the same public Kind BarChart/BarSeries and
PieChart/PieSeries with native Recharts geometry, Cells, native hit targets,
accessibility layer and Kind's existing HTML tooltip/placement. Bar domain is
0–40; donut radii are 52/86, gaps 3°, corners 4 px. No geometry is re-created.
The example uses a public native `filter` extension; it does not intercept
consumer shapes or introduce a package material API.

SVG paint is translucent, with an inside boundary and clipped upper highlight.
There is no SVG blur, displacement, apparent refraction, animated filter, or
polling. A normalized SourceAlpha footprint controls decoration; the final
`atop` composite retains the reduced SourceGraphic alpha, so translucent
interiors are not flooded with edge decoration. All decoration remains inside
native coverage. Zero alpha and `fill="none"` emit no visible paint.

HTML panels and the existing tooltip use true `backdrop-filter`, subtle borders
and an inset highlight. A flat backdrop naturally produces little visible blur.
Explicit opaque fallback and reduced-transparency preference remove both HTML
blur and SVG finish filters. Reduced motion is static; existing native
keyboard/focus/touch ownership remains in Kind/Recharts. No palette popover
exists in this example and no new interaction primitive was introduced.

Heatmap uses the native Kind table/grid, scale and tooltip. Its opaque numeric
center colors are exact; only the top/bottom one-pixel perimeter gets sheen.
Thin one-pixel lines retain original paint, factor 1, with no added halo.

## Proposed opt-in contract, for review only

An eventual `material="glass"` could accept a narrowly scoped
`glassOptions={{ bodyOpacity: 0.65 }}`. This naming/API is not implemented or
accepted. The multiplier is a tunable starting point, not a universal default
for every family. Output alpha must be source paint alpha × consumer opacity ×
material body opacity, each once. Decoration must share the resulting alpha;
none/zero may never leave an outline. Preserve the existing Plain/Paper/Clay/Glow
contracts and tests unchanged.

If consumer opacity encodes data, require an explicit factor-1 override rather
than guessing its meaning. Thin strokes and quantitative Heatmap centers should
use factor 1. Custom renderer/filter/paint behavior stays consumer-owned; do
not silently replace it or reduce its opacity. Unknown/custom paints need an
explicit consumer opt-in and their own validation.

Suggested bounded rollout after visual approval: filled native bars and donut
sectors, then filled areas/scatter/radar/radial surfaces only after separate
geometry/paint/contrast checks. Keep lines crisp. Heatmap stays perimeter-only.
Sankey, waterfall and box-plot surfaces need their own review. Do not roll out
all families from this prototype.

## Verified evidence and limits

- `KIND_UI_TEST_PORT_BASE=6075 npm run check` passed: 43 component tests,
  package gates/strict packed consumers, example build and 255 Chromium tests.
  Existing lint warnings and third-party bundler `use client` warnings remain.
  Final example typecheck, lint and production build passed after prototype
  review fixes. `packages/`, `tests/` and lock/manifests have no diff from base.
- Pixel-inspected real desktop 1100 px and phone 320 px captures in light/dark
  are combined into one labeled PNG, including the existing live tooltip.
  No screenshot is a simulated chart or image-generation mockup.
- Ten native mark paths match between Plain and Glass. IDs are unique across
  charts. None/zero probe alpha is 0. Quarter/half/opaque probes at consumer
  opacity 0.8 produce alpha 32/66/132 (expected 33/67/133 within raster rounding).
  Partial-alpha RGB at very low coverage has premultiplication rounding.
- Heatmap sampled center RGBs are exactly [225,236,255], [179,200,238],
  [132,164,221], [86,127,203], [39,91,186], identical in light/dark and both
  finishes. Focus arrows, Escape, and touch pointer-down tooltip passed.
- Sampled blue body/background contrast is 3.31:1 light and 3.83:1 dark;
  upper-edge samples are 3.28:1 and 3.78:1. The first light palette failed at
  2.85:1 and was darkened for both finishes. These are representative samples,
  not certification of arbitrary consumer palettes/backgrounds. Labels are
  visually readable; tiny bar and donut marks remain visible at 320 px.
- 200% CSS zoom and 320 px viewport stack the comparison without page horizontal
  overflow. Explicit fallback yields HTML blur `none` and native SVG paint.
  Chromium reduced-transparency emulation also yields `none` for both filters.
- Same translucent tooltip, same hover position: switching only backdrop blur
  changes 4,338 of 4,845 captured pixels. This verifies actual backdrop filtering
  in Chromium, rather than self-blurring a data path.
- Bounded 180-bar sample, five warm dev navigations per finish: median time from
  navigation to available native marks was 131.5 ms Plain / 160.4 ms Glass
  (+28.9 ms). This is a small mount/load sample, not a GPU frame-time benchmark
  or production performance guarantee. Static per-mark filters still have cost.
  Prefer bounded counts and no per-point animated blur.
- Firefox and WebKit launch checks were attempted; their Playwright executables
  are absent. Their render/fallback/contrast behavior remains unverified. No
  browser installation was performed for this aesthetic prototype.
- A fresh reviewer with no conversation context found three issues (partial
  alpha mask coverage, donut labels, dense alternative). All were fixed and
  independently rechecked; no remaining isolated-prototype blocker was found.
  Reduced-transparency copy was subsequently corrected too.

The reviewed contact sheet is saved in Library as `/glass-contact-sheet.png`,
ID `libfile_a7907767180c81918c380569f0b4c839`, version 1;
file ID `file_00000000290c820c91e451b571164db3`. Local identity metadata is
persisted and the complete response is in `artifacts/glass/library-result.json`.

## Primary references and licensing

- [CSSWG Filter Effects Level 2 draft](https://drafts.csswg.org/filter-effects-2/)
  describes backdrop image filtering. It is a draft, not a compatibility promise.
- [MDN SVG filter](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/filter)
  documents SVG filter processing. SourceGraphic is the element's paint, not
  the surrounding background.
- [Radix Popover](https://www.radix-ui.com/primitives/docs/components/popover)
  provides focus/keyboard/dismissal ownership if a future popover is needed.
- [Motion Primitives morphing popover source](https://raw.githubusercontent.com/ibelick/motion-primitives/main/components/core/morphing-popover.tsx)
  and [liquid-glass-react](https://github.com/rdev/liquid-glass-react) are optional
  MIT visual references, not dependencies or copied implementations. The former
  is not a substitute for Radix-equivalent focus trap/restore; the latter notes
  Safari/Firefox displacement limits. No substantial third-party code was copied.

Attached-reference interpretation: the five screenshots were previously
inspected in the parent task; they mainly show focus/dimming rather than
clearly refractive chart marks. This prototype follows the user's explicit
translucency/blur/border/highlight direction. Focus/dimming is separately owned.
