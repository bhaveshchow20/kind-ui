# Compact Heatmap layout

`HeatmapGrid.layout` adds square cell dimensions, table spacing, and independent visual label controls. Omit it to retain the existing fluid table. Import `@kind-ui/charts/styles.css` to apply the layout styles.

```tsx
import {
  createHeatmapScale,
  HeatmapChart,
  HeatmapGrid,
  HeatmapTooltip,
  type HeatmapCellContentProps,
} from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const rows = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const columns = Array.from({ length: 26 }, (_, i) => `Week ${i + 1}`);
const data = rows.flatMap((row, r) =>
  columns.map((column, c) => ({ row, column, value: (r + c) % 5 })),
);
const scale = createHeatmapScale({ domain: [0, 4], colors: ["#eef4eb", "#327448"] });
function ActivityCell({ cell }: HeatmapCellContentProps) {
  return <span aria-hidden="true" data-value={cell.value} />;
}

export function Contributions() {
  return (
    <HeatmapChart rows={rows} columns={columns} data={data} scale={scale}>
      <HeatmapGrid
        caption="Contributions by day and week"
        layout={{ cellSize: 12, gap: 3, rowLabels: "hidden", columnLabels: "hidden" }}
        Cell={ActivityCell}
      />
      <HeatmapTooltip />
    </HeatmapChart>
  );
}
```

`cellSize` accepts a finite positive number of pixels or a positive CSS length such as `"1rem"`. `gap` accepts a finite nonnegative pixel number or a nonnegative CSS length such as `"0.25rem"`; zero is supported. CSS strings must be valid lengths for the table's CSS context. Numeric invalid values throw an actionable error. Without `cellSize`, the grid retains fluid sizing; without `gap`, spacing is 3px. Longer custom content or consumer cell styles can enlarge a cell beyond its requested size, as with native tables.

`rowLabels` and `columnLabels` each accept `"visible"` (the default) or `"hidden"`. Hidden labels remain native row/column headers, including content supplied through `rowLabel` and `columnLabel`. Every cell explicitly references its grid's header IDs. Caption, accessible grid/cell names, roving focus, arrow navigation, Home/End, and Control+Home/End remain available. Label visibility does not change the independent `HeatmapDataTable`.

The grid's existing horizontal scroll container retains fixed cells at narrow widths. Arrow navigation focuses and scrolls the destination into view. `HeatmapTooltip` remains in flow below the scroll container. Place a wide grid inside a width-constrained host; do not clip the scroll container. In a flex or CSS grid host, use the usual `min-width: 0` when needed for the host to shrink.

`Cell` owns cell content, so an empty decorative cell is suitable for small contributions; the grid still supplies its accessible value name. `cellProps` retains native styles, refs and handlers; native table `style` overrides layout defaults. The grid continues to own quantitative background colors, focus semantics, header associations and navigation. For complete native table markup, compose a table inside `HeatmapChart` instead of using `HeatmapGrid`.

The dedicated packed consumer checks desktop and 320px widths, CSS and numeric dimensions, zero gaps, visual label toggling, explicit header associations and Chromium accessibility-tree exposure, keyboard navigation and scroll, tooltip bounds, custom cells and consumer refs/styles/handlers. This is programmatic accessibility validation; it does not claim a manual screen-reader listening test.
