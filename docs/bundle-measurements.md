# Packed consumer bundle measurements

`npm run check:package` measures production builds from its already installed
tarball consumer. `npm run pack:artifact` runs the same gate. Neither measurement
reinstalls the package nor builds a workspace source alias. The checked budgets
live in `docs/bundle-budgets.json`; each run writes
`artifacts/bundle-measurements.json` with the tested tarball SHA-256, resolved
dependency/tool versions, sizes and retained package modules. This evidence covers
these build fixtures, not browser performance, runtime memory or a maximum for
every application.

## Method and baseline

Baseline measured on October 12, 2026 with Node 22.16.0 and
`@kind-ui/charts` 0.5.0, from tarball SHA-256
`89598c15af0fea6a669c599d05b9ef3e6c2e189fc17acaf610a36797045db440`.
Vite 8.3.1/Rolldown 1.2.12 builds minified ES2022 browser applications without
source maps. Tailwind v4.3.3 compiles and minifies the consumer stylesheet. The
budget file records all tested direct runtime versions, the Motion subruntime
versions and the Tailwind compiler versions. A version change requires a reviewed
measurement update, even when the new output remains below the size ceilings.

JavaScript totals sum emitted chunks; CSS totals sum emitted CSS assets. Each
asset is compressed independently with gzip level 9 and Brotli quality 11 before
summing, matching separately delivered files. Sizes are bytes, not KiB. HTML is
excluded. These builds include React and React DOM where the fixture renders an
application; they do not describe the npm tarball size or only Kind's source code.

| Fixture | JavaScript raw | gzip | Brotli |
| --- | ---: | ---: | ---: |
| React application baseline | 219,558 | 67,682 | 58,368 |
| Native XAxis primitive | 189,605 | 60,459 | 52,241 |
| Kind XAxis primitive | 189,605 | 60,459 | 52,241 |
| Native Line composition | 579,275 | 170,166 | 142,701 |
| Compound Line composition | 812,128 | 244,263 | 205,313 |
| Compound Line with loading | 812,139 | 244,269 | 205,437 |
| Native Radar composition | 558,196 | 163,758 | 137,949 |
| Compound Radar composition | 770,206 | 233,168 | 197,147 |
| Compound Heatmap composition | 647,959 | 201,963 | 172,442 |
| Native Sankey composition | 450,652 | 139,535 | 118,589 |
| Compound Sankey composition | 720,440 | 223,123 | 188,821 |

Line and Radar applications have the same data, dimensions, axes/grid, series,
tooltip and legend in both forms. Sankey applications have two nodes and one
flow; the Kind form uses explicit Nodes/Links. These comparisons include Kind's
additional configuration, interaction, styling, animation and loading support,
so their differences are not the cost of identical functionality. The native
charts use Recharts defaults; the Kind fixtures use Kind defaults. Heatmap's
comparison is the empty React application because Recharts has no equivalent
native grid in this fixture set. The primitive fixtures retain XAxis on `window`
and do not mount React DOM, so compare them only with each other.

The measured JavaScript increase over each native application is 232,853 raw /
74,097 gzip / 62,612 Brotli bytes for Line, 212,010 / 69,410 / 59,198 for Radar,
and 269,788 / 83,588 / 70,232 for Sankey. Heatmap adds 428,401 / 134,281 /
114,074 over the React application baseline. These are substantial application
costs and should be considered when choosing chart composition and interactions.

The focused pass retains presentation context during interaction-only updates
and skips repeated Heatmap identities. Against clean main
`076cb6c5f9821ba7b358031fb0790fff9d6b62ca` (0.5.0 tarball SHA-256
`cf30c5d94915576139fa5bcd5fab5e104407463dd7d6a90fd3cba5fd68674ba6`),
compound gzip JavaScript increases by 54–108 bytes; native/primitive JavaScript
and generated CSS are unchanged. Original main ceilings are retained.

Motion's full feature retention remains. The attempted smaller feature scope
was withdrawn during review because a nested LazyMotion provider resets the
consumer's strict context, and Motion exposes no public way to inherit it.
Removing that boundary preserves existing consumer behavior. Packed development
tests cover strict rejection, minimal consumer components, explicit opt-out and
non-strict content; they do not promise strict-mode support for every chart part.

## Runtime samples

Private Vite production fixtures compared the exact main/candidate tarballs
above, with the same pinned peers and generated Tailwind CSS. On macOS arm64,
headless Chromium used a 1000 by 900 viewport and reduced motion, without CPU
throttling. Four fresh pages per build exercised a 32 by 24 Heatmap alongside
three fixed-size Lines: either 48 series by 120 points (dense) or four series by
1,200 points (large). One series per chart used a counted native dot renderer.
Ignored artifacts retain the fixture, raw samples, hashes and browser/tool
receipt; this is focused development evidence, not a maintained demo or CI timer.

Each page measured one initial mount, 15 distinct cell inspections, 15 repeated
inspections of the same cell, 15 legend focus toggles and eight parent data
updates. Durations cover synchronous dispatch/React commit; two animation frames
settled each sample outside the timer. Discrete pointer-down events ensured the
measured callback work completed synchronously; deferred callback counts were
zero. The table reports sample medians in milliseconds.

| Operation | Dense main | Dense candidate | Large main | Large candidate |
| --- | ---: | ---: | ---: | ---: |
| Initial mount | 151.0 | 146.8 | 108.3 | 111.2 |
| Inspect different Heatmap cells | 6.4 | 5.0 | 6.3 | 4.1 |
| Inspect the same Heatmap cell | 7.4 | 0.2 | 7.6 | 0.1 |
| Toggle Line legend focus | 10.5 | 3.9 | 7.6 | 0.9 |
| Parent data update | 31.7 | 31.6 | 17.7 | 19.2 |

Semantic equality of active Heatmap identities eliminates 11,520 color and
cell-prop calculations over 15 repeated inspections, while consumer handlers
still run. A model-local key index replaces repeated flattened cell scans.
Retaining presentation context during interaction-only updates eliminates
1,800 dense / 18,000 large native dot calculations over 15 focus toggles in the
interacted Line; other charts remain independent. Actual parent renders still
resolve and validate configuration, and visibility changes still propagate.
Packed browser regressions assert calculation retention, updated data, native
handlers, legend state and announcements rather than absolute timing thresholds.
Mount and data-update samples do not establish a consistent improvement; these
small local samples do not predict every application's latency or memory usage.

## Generated CSS is a separate contract

| Consumer stylesheet | CSS raw | gzip | Brotli |
| --- | ---: | ---: | ---: |
| Tailwind baseline, no scanned classes | 4,254 | 1,403 | 1,173 |
| Tailwind baseline plus full registered Kind package | 33,903 | 6,674 | 5,882 |

Every Kind fixture imports `tailwindcss` with `source(none)` and registers the
entire installed `@kind-ui/charts/dist` directory using `@source`. Disabling
ambient application scanning isolates the package's contribution; the real
stylesheet also includes Tailwind's theme and preflight. Application utilities
would add their own CSS in a real project.

The full package scan adds 29,649 raw / 5,271 gzip / 4,709 Brotli bytes over the
baseline. It produces the same CSS for primitive, Line, Radar, Heatmap and Sankey
fixtures. Tailwind scans source text independently from JavaScript tree shaking;
removing an unused JavaScript family does not prune its scanned utilities. These
numbers therefore do not promise family-specific CSS pruning. Use the documented
[Tailwind setup](https://kindui.dev/charts/docs/installation/) when integrating
the package.

## Regression policy

Each fixture has independent raw, gzip and Brotli ceilings for JavaScript and
CSS. JavaScript permits 8% growth plus 4 KiB raw or 1 KiB compressed; CSS permits
8% plus 1 KiB raw or 256 bytes compressed. The modest fixed allowances cover
small build/compression differences while percentage headroom accommodates
deliberate changes to these measured applications. This is a regression ceiling,
not a target to consume. A failure identifies the fixture, asset, encoding,
actual bytes and limit; inspect retained modules before proposing a baseline
change. Update the baseline, ceilings, tool pins and this document together with
the reason and new tarball evidence. Do not raise a ceiling merely to pass CI.

Primitive Kind/native raw JavaScript must additionally stay within 100 bytes and
retain neither Kind runtime nor Motion. Single-family compounds reject unrelated
composition roots, standalone Heatmap/Sankey modules and loading-design groups;
Line checks both omitted and enabled loading. Own supported loading code remains
retained. Module checks use positive `renderedLength`, so an empty traversed barrel
does not count as emitted code. Shared helpers can live in a family-named module;
the recorded module list is not proof that every export in that file is retained.
Shared interaction, tooltip and loading utilities remain part of these builds.

All fixtures use documented root imports, and strict NodeNext/Bundler consumer
typechecks precede measurement. No family subpaths or runtime/API changes are
introduced by this gate. The budgets prove the measured named imports and current
CSS registration behavior; they do not justify a claim that optional chart
features have no bundle cost.
