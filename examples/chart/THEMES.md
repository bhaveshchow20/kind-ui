# Material theme examples

Run `npm run dev:chart` and open `/themes.html`. The page compares two independently controlled charts with the same sample data:

- **Glass:** [daisyUI](https://daisyui.com/docs/utilities/) 5.7.47 supplies its `glass` utility on the card, badge, and tooltip. Only that utility is enabled; built-in themes and unrelated component styles are excluded. The example adds a dark gradient backdrop and adjusts the documented glass effect's CSS variables. An opaque surface provides a fallback when backdrop filtering is unavailable.
- **Clay:** [clay.css](https://github.com/codeAdrian/clay.css) (`claymorphism-css` 1.0.5) supplies its `clay` class. Its background, radius, and outer/inner shadow variables style the card, badge, symbol, and tooltip.

Both dependencies are MIT licensed, pinned in the workspace's development dependencies, and bundled locally by Vite. No CDN, remote fonts, or runtime network requests are needed. Dependency licenses remain in their installed packages. Neither is a dependency or export of `@kind-ui/charts`. daisyUI runs at CSS build time; clay.css supplies CSS with no JavaScript runtime. The example imports only the surface styling it uses, alongside the existing Tailwind build integration.

`themes.tsx` owns the page; `themes.css` owns static styling. `theme-chart.tsx` composes the public Kind UI exports with Recharts. Per-instance SVG gradient IDs, chart geometry, sample data, controlled visibility, and empty states remain consumer-owned. A CSS shadow and SVG gradient add modest depth to the clay line; this is an illustrative treatment, not a physically rendered 3D tube. Reusing CSS utilities is enough for surfaces; rendered chart marks still need SVG styling.

This integration demonstrates optional host styling rather than adding a theme API or another component framework to the package. It preserves native legend toggles, upstream keyboard tooltips, a missing-value gap, a genuine zero, and a data table that retains hidden series. Series differ by solid/circle and dashed/square marks as well as color. Animations are disabled in these studies.

`npm run check` includes browser checks for both materials, independent visibility and empty states, keyboard tooltip values/dismissal, and desktop/mobile layout. The packed-package gate typechecks `theme-chart.tsx` against the installed tarball in strict NodeNext and Bundler consumers. Those checks do not establish broader accessibility, browser, or performance guarantees.
