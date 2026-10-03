"use client";

// Adapted from HeatmapExamples' signed latency matrix in
// examples/chart/heatmap-recipes.tsx, at 218ac66.
import {
  createHeatmapScale,
  HeatmapCellContent,
  type HeatmapCellContentProps,
  HeatmapChart,
  HeatmapDataTable,
  type HeatmapDatum,
  HeatmapGrid,
  HeatmapLegend,
  HeatmapTooltip,
} from "@kind-ui/charts";
import { type CommonSettings, Controls, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";
import "@kind-ui/charts/styles.css";

export type ExampleSettings = CommonSettings & { material: "plain" | "paper" };

const teams = ["Platform", "Payments", "Identity", "Search", "Messaging"];
const regions = ["US East", "US West", "Europe", "Asia", "Oceania"];
const deltas: (number | null)[] = [
  12,
  -7,
  0,
  18,
  null,
  -12,
  8,
  4,
  0,
  9,
  3,
  null,
  -4,
  15,
  7,
  0,
  5,
  -9,
  2,
  11,
  6,
  0,
  8,
  -3,
  null,
];
const data: HeatmapDatum[] = teams.flatMap((row, rowIndex) =>
  regions.map((column, columnIndex) => ({
    row,
    column,
    value: deltas[rowIndex * regions.length + columnIndex] ?? null,
  })),
);

const scale = createHeatmapScale({
  domain: [-20, 20],
  colors: ["#3b6fa8", "#f5f5ee", "#bf5b38"],
});

function formatValue(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function Value(props: HeatmapCellContentProps) {
  return (
    <HeatmapCellContent
      {...props}
      formattedValue={props.cell.value === null ? "—" : props.formattedValue}
    />
  );
}

export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);

  return (
    <section className="chart-example" aria-label="Signed service latency heatmap">
      <Controls settings={s} onChange={set}>
        <label>
          Finish
          <select
            value={s.material}
            onChange={(event) =>
              set({ ...s, material: event.target.value === "paper" ? "paper" : "plain" })
            }
          >
            <option value="plain">Plain</option>
            <option value="paper">Paper</option>
          </select>
        </label>
      </Controls>
      <p className="chart-help">
        Latency change in milliseconds versus the previous week for five services across five
        regions. Negative is faster; positive is slower. Zero is measured. A dash and the missing
        pattern mean No sample, not zero.
      </p>
      <div className="table-scroll">
        <HeatmapChart
          key={s.animate ? "entrance" : "still"}
          rows={teams}
          columns={regions}
          data={data}
          scale={scale}
          formatValue={formatValue}
          missingLabel="No sample"
          animate={s.animate}
          aria-label="Weekly latency change by service and region, in milliseconds"
          style={{ width: "100%", minWidth: 0 }}
        >
          <HeatmapGrid
            material={s.material}
            caption="Weekly latency change by service and region (ms)"
            Cell={Value}
            style={{ minWidth: "30rem", borderCollapse: "separate", borderSpacing: 3 }}
            cellProps={() => ({ style: { height: "3rem", textAlign: "center" } })}
          />
          <HeatmapTooltip />
          <HeatmapLegend label="Change in milliseconds · fixed scale, clamped at ±20" />
          <details>
            <summary>View data</summary>
            <HeatmapDataTable caption="All 25 service and region coordinates — latency change (ms)" />
          </details>
        </HeatmapChart>
      </div>
      <p className="chart-help">
        Compare each cell’s center to the fixed −20 to +20 legend. Paper decorates only the outer 8%
        rim on each side; the central 84% by 84% keeps the opaque scale color. Missing cells keep
        their pattern and receive no finish. Automatic paint emphasis does not alter these numeric
        fills.
      </p>
      <p className="chart-help">
        Focus a cell and use arrow keys to move. Home or End reaches a row endpoint; Ctrl+Home or
        Ctrl+End reaches a grid corner. Escape dismisses the tooltip and Tab leaves the grid. The
        native table scrolls horizontally on narrow screens.
      </p>
    </section>
  );
}
