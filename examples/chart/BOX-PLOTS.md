# Box plot studies

Run `npm run dev:chart`, then open `/box-plots.html`.

Three feature-focused compositions consume public `@kind-ui/charts` exports:
vertical request latency, horizontal regional changes across zero, and exact/
missing values. These illustrative precomputed summaries do not imply a sample
quartile or fence algorithm. Each recipe uses native axes, a useful summary
Tooltip, controlled Legend, optional Motion, and a full table containing every
statistic and outlier. The tables stay visible when the chart is filtered.

Motion starts disabled. The shared Bar reveal follows reduced-motion preference
and ends on interaction, data or geometry changes. Marks retain exact numeric
positions; collapsed boxes and whiskers stay collapsed. Materials are a separate
concern and are not included in this feature.

`tests/fixtures/box-plot` is a separate isolated public-only tarball consumer.
The package gate runs strict NodeNext/Bundler typechecks and production build;
`tests/box-plots.spec.ts` checks native geometry, full extent, both orientations,
reversed axes, reordered categories, custom marks, refs/handlers, keyboard null/
zero behavior, empty data, controlled visibility, resize and Motion interruption.
Recipe screenshots are actual browser captures at desktop and phone widths.
