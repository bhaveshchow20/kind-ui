# Heatmap recipes

Run `npm run dev:chart` and open `/heatmaps.html`. The latency matrix shows signed millisecond changes for five services across five regions, with a fixed diverging domain of `[-20, 20]`. The deployment activity grid shows daily counts across fourteen weeks; unobserved future days remain missing while recorded quiet days are zero. Motion starts enabled and follows reduced-motion preferences.

Native table layout keeps each row/column category at equal size. Small screens scroll within the card rather than compressing cells or overflowing the page. Arrow keys navigate cells, Home/End navigate the row, and Ctrl+Home/End reach the grid corners. Escape dismisses the tooltip, and Tab leaves the grid in one stop. Tooltip content is an in-flow readout, avoiding viewport-edge placement. Expand the data disclosure for a separate native static table.

The example card uses consumer-owned CSS through the native `className` prop. Heatmap exposes no material prop, material type or finish selector. Paper, raised matte Clay and Glow mark treatments remain a separate explicit foundation backlog item; they are not implemented or claimed complete. Numeric cell fills remain the exact scale output. Missing cells have a separate patterned fill and explicit text label.

## Renderer research

Recharts 3.10.1 has a [Scatter component with custom shapes](https://recharts.github.io/en-US/api/Scatter/) and [public coordinate systems](https://recharts.github.io/en-US/guide/coordinateSystems/). Its API provides numeric point and size geometry; it does not expose a dedicated categorical heatmap primitive. A custom scatter matrix would add artificial numeric category coordinates, cell extents and two-axis keyboard navigation over point selection. A native HTML table is the smaller public composition for this equal-cell categorical grid: browser table layout owns geometry and semantic rows/headers, React owns content and events, and the existing Motion peer owns only frame entrance. No renderer internals or dependencies are added.

The keyboard contract follows the [WAI-ARIA data grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/). The alternative follows the [static table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/). This implementation is an inspection grid, not an editing spreadsheet or virtualized calendar. Assistive technology behavior has not been manually tested with screen readers.

## Verification

`npm run check` includes public model/scale/server-rendered component tests, repeated against the actual installed tarball, strict NodeNext and Bundler consumer checks, production consumer build, and desktop/narrow browser interactions against both workspace examples and packed public imports. `tests/heatmaps.spec.ts` records actual desktop and phone screenshots. The packed fixture adds constant-zero, missing-to-zero, native refs and event cancellation checks.
