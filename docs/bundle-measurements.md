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

Baseline measured on October 11, 2026 with Node 22.16.0 and
`@kind-ui/charts` 0.4.0, from tarball SHA-256
`39cdf5207c75376e1a006e49cdbecf68d5d51cd2de22fb9294936ab6531cfb7c`.
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
| Compound Line composition | 811,913 | 244,199 | 205,208 |
| Compound Line with loading | 811,924 | 244,205 | 205,203 |
| Native Radar composition | 558,196 | 163,758 | 137,949 |
| Compound Radar composition | 769,991 | 233,114 | 197,114 |
| Compound Heatmap composition | 647,675 | 201,855 | 172,404 |
| Native Sankey composition | 450,652 | 139,535 | 118,589 |
| Compound Sankey composition | 720,225 | 223,069 | 188,971 |

Line and Radar applications have the same data, dimensions, axes/grid, series,
tooltip and legend in both forms. Sankey applications have two nodes and one
flow; the Kind form uses explicit Nodes/Links. These comparisons include Kind's
additional configuration, interaction, styling, animation and loading support,
so their differences are not the cost of identical functionality. The native
charts use Recharts defaults; the Kind fixtures use Kind defaults. Heatmap's
comparison is the empty React application because Recharts has no equivalent
native grid in this fixture set. The primitive fixtures retain XAxis on `window`
and do not mount React DOM, so compare them only with each other.

The measured JavaScript increase over each native application is 232,638 raw /
74,033 gzip / 62,507 Brotli bytes for Line, 211,795 / 69,356 / 59,165 for Radar,
and 269,573 / 83,534 / 70,382 for Sankey. Heatmap adds 428,117 / 134,173 /
114,036 over the React application baseline. These are substantial application
costs and should be considered when choosing chart composition and interactions.

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

## Funnel fixture baseline

The ordered-stage fixture uses two positive stages with explicit `Stages`,
600 × 260 sizing and stage metadata. The native fixture uses the same values
and dimensions. The compound includes frame, selection, generic data
validation, loading and optional Motion support; the native fixture has no
Kind frame or stage controls. These are application totals, not identical
functionality or module-only costs.

| Fixture | JS raw | gzip | Brotli | CSS raw | gzip | Brotli |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Compound Funnel | 750,668 | 228,970 | 193,485 | 34,141 | 6,722 | 5,950 |
| Native Funnel | 482,717 | 146,369 | 124,060 | 4,254 | 1,403 | 1,173 |

Measured from an installed local candidate tarball with the existing pinned
tools and peers. Only the two new fixture budgets use these baselines and
the existing 8% plus fixed-allowance policy. Existing budgets remain unchanged.
Funnel retention rejects unrelated families and loading designs. Package-wide
Tailwind scanning still includes all family utilities; the added utilities
stay within the existing CSS ceilings. Final package and browser gates remain
separate from this initial measurement.
