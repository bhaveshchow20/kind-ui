# External frame progress exploration (#100)

Status: design and unrun consumer proof; no runtime API decision or implementation.
Source baseline: `d6c62f32344fc7fbf43decf25fd16a17317d6c66` (main).
Issue: <https://github.com/bhaveshchow20/kind-ui/issues/100>.

## Recommendation

Defer a runtime API until a packed external-renderer consumer demonstrates an
unmet need. The issue reports a successful Remotion workflow with
`animate={false}`; that report has not been reproduced here. This is optional
exploration, not a release dependency. A wrapper crossfade can already compose
static charts. Seeking Kind's built-in entrance is a different capability.
Neither capability establishes a chart-to-chart geometry morph contract.

## Verified by source inspection

- [Public exports](../../packages/charts/src/index.ts) expose chart composition,
  geometry/shape props and controlled visibility, but no frame clock, public
  progress controller or animation contexts. The only package subpaths are the
  ESM entry and stylesheet. Motion remains a required peer even when disabled.
- [Composed line motion](../../packages/charts/src/animation.tsx) defaults to
  `animate=false`. [Configured LineChart](../../packages/charts/src/configured-line-chart.tsx)
  defaults to `true`; explicitly set `false` for external timing. Maintained
  series turn off native Recharts tweening. False disables chart-controlled
  entrance, hover movement and line visibility transitions, rather than making
  arbitrary consumer code static. Private tooltip number animation has its own
  reduced-motion check; the proof omits tooltips entirely.
- [Shared lifecycle](../../packages/charts/src/line-chart.tsx) invalidates pointer
  state and interrupts entrance on data identity, visibility and size changes.
  Pointer/focus/keyboard inspection also interrupts entrance. Family-specific
  geometry checks add further invalidation. Existing entrances are one-shot,
  not reversible external timelines.
- Reduced-motion subscriptions use a server snapshot of `true`. This prevents
  built-in entrance on the server; it does not prove SSR pixels or hydration
  equivalence. Measurements, engine registration and fonts still need testing.
- Root/chart context has no loading/partial/error API. Loading belongs to the
  consumer in this baseline. This draft does not depend on #127 or #130.

## Candidate contract, only if the proof exposes a need

Discuss an additive `entranceProgress?: number` on **composed LineChart only**
first. This name and behavior are proposed, not exported. It would seek the
existing horizontal entrance clip; it would not interpolate data, domains,
paths, chart families, selection or tooltip values. No renderer dependency,
MotionValue input, playback object or timer API belongs in the package.

| Concern | Proposed bounded rule |
| --- | --- |
| Ownership | Caller supplies finite progress in `[0,1]`, already eased. Reject nonfinite/out-of-range values; no implicit clamping. Require `animate={false}` when supplied; reject `true`/options to prevent two clocks. Absence preserves current behavior. |
| Frame semantics | `0` hides maintained line marks through the entrance clip; `1` completes it. Axes/grid/data alternatives remain complete. Labels/custom shapes require explicit scope review before implementation. |
| Seeking/reverse | Render from current props, independent of previous frames. `0.8 → 0.2 → 1 → 0.2` must reproduce the same `0.2` frame. No completion latch, onComplete callback, accumulated elapsed time or spring. |
| Mount/update/unmount | Client-only mount paints supplied progress subject to preference; hydration may initially paint complete geometry until the live preference snapshot resolves. Data, domains, size or visibility changes use new geometry at that progress and clear stale inspection coordinates. Unmount has no external playback to cancel. Removing progress renders complete geometry with `animate=false`; remounting is unnecessary to seek. |
| Inspection | Pointer/focus/keyboard must not mutate external progress. Inspect final semantic data even when marks are partially revealed; hosts that need complete visible marks for inspection set progress to `1`. Hover/visibility motion stays off. Keep complete text/table alternatives. |
| Reduced motion | Proposed default: interactive hosts pass effective progress `1` when reduced motion applies. The runtime still respects its preference and completes the clip. Deterministic capture must pin the same preference for every frame. An override would require a separate explicit accessibility decision; do not silently bypass preferences. |
| SSR | For the first candidate, preserve the existing server-complete reduced-motion snapshot. Exact partial SSR frames are outside the candidate; require client capture with pinned preference. If identical partial server/client output becomes necessary, design an explicit preference input separately before implementation. |
| Loading | No implied playback while missing/loading. Host chooses placeholder, partial data or complete snapshot. Render new snapshots at current progress; no automatic replay after load/retry. Errors/cancellation belong to host data acquisition. Freeze ready data/fonts before capture. |

The SSR/reduced-motion choice means this is **not** a promise that progress alone
determines identical pixels across environments. A progress contract must state
the preference and geometry inputs too. If this limitation defeats the actual
renderer use case, defer the candidate instead of growing it overnight.

## Family applicability (source facts; extension decisions are open)

| Family | Existing implementation / candidate limit |
| --- | --- |
| Line / Area | Horizontal clip entrance. Line is the smallest first candidate; Area would need its own proof, including portal clips and labels. |
| Bar / Waterfall / Histogram / BoxPlot | Bar-based entrance uses native zero/domain geometry; specialized shapes and quantitative bins need separate coverage. No generic scaling/morph promise. |
| Combo | Independent line/area/bar entrance options and completion flags. One scalar cannot imply equivalent family timing. Defer. |
| Pie / Donut / Radial / ActivityRings | Angular masks/direction and normalized ring data are distinct contracts. Defer; ring data progress is not animation progress. |
| Radar | Radial reveal and visibility opacity, including custom shape escape hatches. Defer. |
| Scatter / Bubble | Entrance opacity with internal MotionValue. Consumer opacity may already suffice. |
| Sankey | Internal progress, size readiness and geometry interruption. Flow layout is not a morph API. Defer. |
| Heatmap | DOM cell animation and model/scale/children interruption. Separate implementation, not a shared SVG timeline. Defer. |

Custom shapes/CSS and chart-to-chart choreography remain consumer-owned in all
families. Internal contexts must not be deep-imported as an integration shortcut.

## Prepared proof and evidence limits

[remotion-proof.tsx](external-progress/remotion-proof.tsx) is a copyable external
consumer entry, **unrun and untypechecked**. It imports only the public charts
entry and CSS. Two fixed configured line charts crossfade via frame-derived
wrapper opacity; both explicitly disable animation, tooltip, legend, responsive
sizing and native keyboard inspection. The wrapper is decorative video content, not an
interactive chart example. It includes a static final-data text alternative.

The adapter uses documented Remotion
[useCurrentFrame](https://www.remotion.dev/docs/use-current-frame),
[Composition](https://www.remotion.dev/docs/composition) and
[registerRoot](https://www.remotion.dev/docs/register-root) APIs (read 2026-10-06).
This is proposed **consumer-only** use of `remotion` and `@remotion/cli`; neither
is an existing workspace dependency. Before installation, select matching exact
versions, verify React 19.3 peer compatibility, review Remotion licensing for the
consumer, and estimate its CLI/browser disk cost. No dependency was installed or
added to manifests. No runtime dependency or public API is proposed by the proof.

After the parent grants a dependency/build slot:

1. Use Node 22.12+ / npm 11.9; run the repository format/check gates and
   `npm run pack:artifact` without bypassing prepack. Record commit, dirty status,
   tarball checksum, versions and actual passed/failed checks.
2. Create a disposable consumer outside the workspace package graph. Install the
   exact retained tarball and pinned existing peers plus reviewed matching
   Remotion packages; copy this entry. Strictly typecheck the copied entry using
   Bundler resolution; ensure package resolution has no workspace/source alias.
3. With the consumer's installed CLI, run `npm exec remotion still -- index.tsx
   ExternalProgress frame-30.png --frame=30` (then frames 0, 15, 60 and 89).
   Confirm fonts/layout have settled; record renderer/browser version and output
   evidence. Do not treat successful bundling alone as deterministic rendering.
4. Capture `60,15,30,0,30` in a reused renderer session and also fresh captures.
   Compare repeated frame 30 pixels and geometry after readiness, endpoint
   visibility, reverse and skipped frames. Repeat with reduced motion pinned
   both ways. Also temporarily pass `reducedMotion={true}` in `Video` and
   confirm the host wrapper stays complete at every frame; OS preference alone
   does not exercise that explicit host branch. Wrapper inputs should match;
   pixel stability is unproven.
5. Separately check static-chart SSR/hydration and normal interactive
   `animate=false` inspection/data updates through packed public exports. The
   video composition cannot establish those contracts.

If the current crossfade is sufficient, record that result and defer #100. If a
consumer specifically needs seekable **built-in entrance** clips that composition
cannot reproduce acceptably, review the line-only contract and its test matrix
before any runtime implementation. Do not infer the need from this draft.

## Review and checks

A separate read-only reviewer inspected this baseline before this draft, then
reviewed the prepared files for public API and wording traps, and
confirmed the default-animation exception, private progress boundaries,
one-shot lifecycle conflict and consumer-owned loading. Source inspection and
`git diff --check` are the only local verification planned here. Install, format,
typecheck, package gate, external render, SSR, browser and aggregate checks remain
unrun: #136 owns the current slot. No renderer compatibility claim is made.
