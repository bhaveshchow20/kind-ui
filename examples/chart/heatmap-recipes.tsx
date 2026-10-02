import {
  createHeatmapScale,
  HeatmapCellContent,
  type HeatmapCellContentProps,
  HeatmapChart,
  HeatmapDataTable,
  type HeatmapDatum,
  HeatmapGrid,
  HeatmapLegend,
  type HeatmapMaterial,
  HeatmapTooltip,
} from "@kind-ui/charts";
import { useState } from "react";

const teams = ["Platform", "Payments", "Identity", "Search", "Messaging"];
const regions = ["US East", "US West", "Europe", "Asia", "Oceania"];
const deltas = [
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
const matrix: HeatmapDatum[] = teams.flatMap((row, r) =>
  regions.map((column, c) => ({ row, column, value: deltas[r * regions.length + c] ?? null })),
);
const weeks = Array.from({ length: 14 }, (_, i) => `W${i + 1}`);
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const activity: HeatmapDatum[] = days.flatMap((row, r) =>
  weeks.flatMap((column, c) =>
    c === 13 && r > 3 ? [] : [{ row, column, value: (c * 7 + r * 3) % 13 }],
  ),
);
const signed = createHeatmapScale({ domain: [-20, 20], colors: ["#3b6fa8", "#f5f5ee", "#bf5b38"] });
const counts = createHeatmapScale({ domain: [0, 12], colors: ["#eef4eb", "#abc9a1", "#327448"] });
function Value(props: HeatmapCellContentProps) {
  return (
    <HeatmapCellContent
      {...props}
      formattedValue={props.cell.value === null ? "—" : props.formattedValue}
    />
  );
}
function ActivityCell({ cell }: HeatmapCellContentProps) {
  return <span aria-hidden="true">{cell.value === null ? "—" : ""}</span>;
}
export function HeatmapRecipes() {
  const [material, setMaterial] = useState<HeatmapMaterial>("plain");
  const [reversed, setReversed] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [motion, setMotion] = useState(true);
  return (
    <main className="heatmaps-page">
      <header>
        <p className="eyebrow">KIND UI / CATEGORICAL GRIDS</p>
        <h1>A field of values.</h1>
        <p>
          Two dimensions, one quantitative color scale. Read the pattern, then inspect each cell.
        </p>
      </header>
      <nav className="heatmaps-controls" aria-label="Heatmap controls">
        <label>
          Frame{" "}
          <select
            value={material}
            onChange={(event) => setMaterial(event.target.value as HeatmapMaterial)}
          >
            <option value="plain">Plain</option>
            <option value="paper">Paper frame</option>
            <option value="inset">Inset frame</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={motion}
            onChange={(event) => setMotion(event.target.checked)}
          />
          Motion
        </label>
        <button type="button" onClick={() => setReversed(!reversed)}>
          Reorder domains
        </button>
        <button type="button" onClick={() => setUpdated(!updated)}>
          Update values
        </button>
        <button type="button" onClick={() => setEmpty(!empty)}>
          Toggle empty
        </button>
      </nav>
      <section>
        <div className="recipe-heading">
          <div>
            <p className="eyebrow">01 / DIVERGING MATRIX</p>
            <h2>Service latency change</h2>
          </div>
          <p>
            Milliseconds versus the previous week. Negative is faster; zero is a measured value.
          </p>
        </div>
        <HeatmapChart
          rows={empty ? [] : reversed ? [...teams].reverse() : teams}
          columns={reversed ? [...regions].reverse() : regions}
          data={
            empty
              ? []
              : updated
                ? matrix.map((cell) => ({
                    ...cell,
                    value: cell.value === null ? null : -cell.value,
                  }))
                : matrix
          }
          scale={signed}
          formatValue={(value) => `${value > 0 ? "+" : ""}${value}`}
          missingLabel="No sample"
          material={material}
          animate={motion}
        >
          <HeatmapGrid
            caption="Weekly latency change by service and region"
            Cell={Value}
            cellProps={(cell) =>
              ({
                "data-coordinate": `${cell.row}/${cell.column}`,
              }) as React.ComponentPropsWithRef<"td">
            }
          />
          <HeatmapTooltip />
          <HeatmapLegend label="Change in milliseconds · clamped at ±20" />
          <details>
            <summary>View latency data table</summary>
            <HeatmapDataTable caption="Latency change (ms) — measured values" />
          </details>
        </HeatmapChart>
        <p className="technical">
          Arrow keys move through cells. Home / End move across the row; Ctrl + Home / End reach the
          grid corners. Escape dismisses the tooltip. Reordering preserves category identity.
        </p>
      </section>
      <section>
        <div className="recipe-heading">
          <div>
            <p className="eyebrow">02 / ACTIVITY</p>
            <h2>Shipping rhythm</h2>
          </div>
          <p>
            Deployments by weekday and week. Future days remain missing; quiet days remain zero.
          </p>
        </div>
        <HeatmapChart
          rows={days}
          columns={weeks}
          data={activity}
          scale={counts}
          material={material}
          animate={motion}
          formatValue={(value) => `${value} deployments`}
          missingLabel="Not yet observed"
        >
          <HeatmapGrid caption="Deployment activity across 14 weeks" Cell={ActivityCell} />
          <HeatmapTooltip />
          <HeatmapLegend label="Deployments per day" />
          <details>
            <summary>View deployment data table</summary>
            <HeatmapDataTable caption="Daily deployments" />
          </details>
        </HeatmapChart>
        <p className="technical">
          The native table scrolls inside its card on small screens. Every cell, including zero and
          missing observations, remains reachable. Frame materials leave quantitative colors opaque
          and unchanged.
        </p>
      </section>
      <footer>
        Native HTML tables · Explicit domains · Opaque sRGB scale · No added dependencies
      </footer>
    </main>
  );
}
