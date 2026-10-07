import {
  createHeatmapScale,
  HeatmapCellContent,
  type HeatmapCellContentProps,
  HeatmapChart,
  HeatmapDataTable,
  type HeatmapDatum,
  HeatmapGrid,
  type HeatmapGridProps,
  HeatmapLegend,
  type HeatmapMaterial,
  HeatmapTooltip,
} from "@kind-ui/charts";
import { useRef, useState } from "react";

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
  const [reversed, setReversed] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [motion, setMotion] = useState(true);
  const [consumerOpacity, setConsumerOpacity] = useState<number>();
  const [material, setMaterial] = useState<HeatmapMaterial>("plain");
  return (
    <main className="heatmaps-page">
      <header>
        <p className="eyebrow">KIND UI / CATEGORICAL GRIDS</p>
        <h1>A field of values.</h1>
        <p>
          Two dimensions, one quantitative color scale. Compare cell centers to the legend; rims are
          decoration.
        </p>
      </header>
      <nav className="heatmaps-controls" aria-label="Heatmap controls">
        <label>
          Cell material
          <select
            value={material}
            onChange={(event) => setMaterial(event.target.value as HeatmapMaterial)}
          >
            <option value="plain">Default</option>

            <option value="clay">Clay</option>
            <option value="glow">Glow</option>
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
        <button type="button" onClick={() => setConsumerOpacity(0.4)}>
          Consumer opacity
        </button>
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
          className="heatmap-card"
          animate={motion}
        >
          <HeatmapGrid
            material={material}
            caption="Weekly latency change by service and region"
            Cell={Value}
            cellProps={(cell) =>
              ({
                "data-coordinate": `${cell.row}/${cell.column}`,
                ...(consumerOpacity === undefined ? {} : { style: { opacity: consumerOpacity } }),
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
          className="heatmap-card"
          animate={motion}
          formatValue={(value) => `${value} deployments`}
          missingLabel="Not yet observed"
        >
          <HeatmapGrid
            material={material}
            caption="Deployment activity across 14 weeks"
            Cell={ActivityCell}
          />
          <HeatmapTooltip />
          <HeatmapLegend label="Deployments per day" />
          <details>
            <summary>View deployment data table</summary>
            <HeatmapDataTable caption="Daily deployments" />
          </details>
        </HeatmapChart>
        <p className="technical">
          The native table scrolls inside its card on small screens. Every cell, including zero and
          missing observations, remains reachable. Numeric cell colors remain opaque and match the
          legend.
        </p>
      </section>
      <footer>
        Native HTML tables · Explicit domains · Opaque sRGB scale · No added dependencies
      </footer>
    </main>
  );
}

const edgeScale = createHeatmapScale({ domain: [0, 0], colors: ["#ffffff", "#000000"] });
export function Edges() {
  const [material, setMaterial] = useState<HeatmapMaterial>("plain");
  const [shrink, setShrink] = useState(false);
  const [values, setValues] = useState(false);
  const [handled, setHandled] = useState(0);
  const skewed = createHeatmapScale({ domain: [-1, 100], colors: ["#000000", "#ffffff"] });
  return (
    <section aria-label="Edge cases">
      <label>
        Edge material
        <select
          value={material}
          onChange={(event) => setMaterial(event.target.value as HeatmapMaterial)}
        >
          {["plain", "clay", "glow"].map((value) => (
            <option key={value} value={value}>
              {value === "plain" ? "Default" : value}
            </option>
          ))}
        </select>
      </label>
      <HeatmapChart
        rows={[
          "An extremely long category label that must stay one row tall even on a narrow screen",
          "Short",
        ]}
        columns={["Value"]}
        data={[]}
        scale={skewed}
        style={{ maxWidth: 300 }}
      >
        <HeatmapGrid caption="Long category grid" />
        <HeatmapLegend label="Skewed signed scale" />
      </HeatmapChart>
      <button type="button" onClick={() => setShrink(!shrink)}>
        Remove row
      </button>
      <button type="button" onClick={() => setValues(!values)}>
        Patch edge data
      </button>
      <output aria-label="Handled events">{handled}</output>
      <HeatmapChart
        rows={shrink ? ["A"] : ["A", "B"]}
        columns={["X", "Y"]}
        data={[
          { row: "A", column: "X", value: values ? 5 : 0 },
          { row: "A", column: "Y", value: values ? 0 : null },
        ]}
        scale={edgeScale}
      >
        <HeatmapGrid
          caption="Constant and missing grid"
          material={material}
          cellProps={() => ({
            style: { filter: "brightness(1)" },
            ref: (node) => {
              if (node) node.dataset.refReady = "yes";
            },
            onPointerDown: () => setHandled((n) => n + 1),
            onKeyDown: (event) => {
              if (event.key === "ArrowLeft") event.preventDefault();
            },
          })}
        />
        <HeatmapTooltip />
        <HeatmapLegend label="Constant zero" />
        <HeatmapDataTable caption="Edge values" />
      </HeatmapChart>
      <HeatmapChart rows={[]} columns={[]} data={[]} scale={edgeScale}>
        <HeatmapGrid caption="Empty grid" />
        <HeatmapTooltip />
      </HeatmapChart>
    </section>
  );
}

const rows = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const columns = Array.from({ length: 26 }, (_, index) => `Week ${index + 1}`);
const data = rows.flatMap((row, r) =>
  columns.map((column, c) => ({ row, column, value: (r + c) % 5 })),
);
const scale = createHeatmapScale({ domain: [0, 4], colors: ["#eef4eb", "#327448"] });
function Dot({ cell }: HeatmapCellContentProps) {
  return <span data-custom-cell={cell.value} aria-hidden="true" />;
}

export function CompactHeatmap() {
  const [labels, setLabels] = useState<"visible" | "hidden">("hidden");
  const [size, setSize] = useState<number | string>(12);
  const [gap, setGap] = useState<number | string>(3);
  const [events, setEvents] = useState(0);
  const cellRef = useRef<HTMLTableCellElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const layout = {
    cellSize: size,
    gap,
    rowLabels: labels,
    columnLabels: labels,
  } satisfies NonNullable<HeatmapGridProps["layout"]>;
  return (
    <section aria-label="Compact fixture" style={{ maxWidth: 700, padding: 16 }}>
      <button type="button" onClick={() => setLabels(labels === "hidden" ? "visible" : "hidden")}>
        Toggle compact labels
      </button>
      <button
        type="button"
        onClick={() => {
          setSize("1rem");
          setGap("0.25rem");
        }}
      >
        Use CSS lengths
      </button>
      <button
        type="button"
        onClick={() => {
          setSize(12);
          setGap(0);
        }}
      >
        Use zero gap
      </button>
      <button
        type="button"
        onClick={() => {
          if (cellRef.current && tableRef.current?.contains(cellRef.current))
            cellRef.current.focus();
        }}
      >
        Focus consumer ref
      </button>
      <output aria-label="Consumer events">{events}</output>
      <HeatmapChart rows={rows} columns={columns} data={data} scale={scale}>
        <HeatmapGrid
          caption="Compact contributions"
          ref={tableRef}
          layout={layout}
          Cell={Dot}
          rowLabel={(row) => `Day: ${row}`}
          columnLabel={(column) => `Period: ${column}`}
          cellProps={(cell) => ({
            ...(cell.rowIndex === 0 && cell.columnIndex === 0 ? { ref: cellRef } : {}),
            className: "consumer-cell",
            style: { borderRadius: 2, opacity: 0.8 },
            onFocus: () => setEvents((count) => count + 1),
          })}
        />
        <HeatmapTooltip />
        <details>
          <summary>Compact data</summary>
          <HeatmapDataTable caption="Contribution values" />
        </details>
      </HeatmapChart>
      <HeatmapChart
        rows={["A"]}
        columns={["X", "Y"]}
        data={[{ row: "A", column: "X", value: 1 }]}
        scale={scale}
      >
        <HeatmapGrid
          caption="Explicit compact styles"
          layout={{ cellSize: 12, gap: 2 }}
          style={{ borderSpacing: 7, width: 180 }}
          cellProps={() => ({
            style: { height: 28, padding: 4, borderRadius: 8 },
            onKeyDown: (event) => event.preventDefault(),
          })}
        />
        <HeatmapTooltip />
      </HeatmapChart>
      <HeatmapChart rows={["A"]} columns={["X"]} data={[]} scale={scale}>
        <HeatmapGrid caption="Independent headers" layout={{ cellSize: 12, rowLabels: "hidden" }} />
      </HeatmapChart>
      <HeatmapChart rows={["A"]} columns={["X"]} data={[]} scale={scale}>
        <HeatmapGrid caption="Default dimensions" />
      </HeatmapChart>
    </section>
  );
}

// @ts-expect-error Layout only accepts explicit visibility values.
export const InvalidVisibility = <HeatmapGrid caption="Invalid" layout={{ rowLabels: false }} />;
// @ts-expect-error Cell lengths are CSS strings or pixel numbers.
export const InvalidSize = <HeatmapGrid caption="Invalid" layout={{ cellSize: {} }} />;
export const InvalidChartLayout = (
  // @ts-expect-error Layout belongs to the grid, not its context provider.
  <HeatmapChart rows={[]} columns={[]} data={[]} scale={scale} layout={{ cellSize: 12 }} />
);

export function DismissalHeatmaps() {
  const [compact, setCompact] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [prevented, setPrevented] = useState(false);
  const [events, setEvents] = useState<Record<string, number>>({});
  const count = (name: string) =>
    setEvents((value) => ({ ...value, [name]: (value[name] ?? 0) + 1 }));
  return (
    <section aria-label="Dismissal fixtures" style={{ padding: 16 }}>
      <button type="button" onClick={() => setCompact(!compact)}>
        Change dismissal layout
      </button>
      <button type="button" onClick={() => setUpdated(!updated)}>
        Change dismissal data
      </button>
      <label>
        <input
          type="checkbox"
          checked={blocked}
          onChange={(event) => setBlocked(event.target.checked)}
        />
        Block dismissal Escape
      </label>
      <label>
        <input
          type="checkbox"
          checked={prevented}
          onChange={(event) => setPrevented(event.target.checked)}
        />
        Prevent dismissal Escape
      </label>
      <output
        aria-label="Dismissal callbacks"
        style={{ display: "block", height: 96, overflow: "auto" }}
      >
        {JSON.stringify(events)}
      </output>
      {["First", "Second"].map((name) => (
        <HeatmapChart
          key={name}
          rows={["Mon", "Thu"]}
          columns={Array.from({ length: 20 }, (_, i) => String(i + 1))}
          data={[{ row: "Mon", column: "1", value: updated ? 2 : 1 }]}
          scale={scale}
          style={{ maxWidth: 500 }}
          onPointerMoveCapture={() => count(`${name}-move`)}
          onPointerDownCapture={() => count(`${name}-press`)}
          onKeyDownCapture={(event) => {
            if (prevented && event.key === "Escape") event.preventDefault();
          }}
        >
          <HeatmapGrid
            caption={`${name} dismissal grid`}
            layout={
              compact
                ? { cellSize: 12, gap: 3, rowLabels: "hidden", columnLabels: "hidden" }
                : { cellSize: 24 }
            }
            Cell={Dot}
            onKeyDown={() => count(`${name}-key`)}
            cellProps={() => ({
              onPointerEnter: () => {
                count(`${name}-enter`);
              },
              onPointerDown: () => count(`${name}-down`),
              onPointerMove: () => count(`${name}-cell-move`),
              onFocus: () => count(`${name}-focus`),
              onKeyDown: (event) => {
                if (blocked && event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                }
              },
            })}
          />
          <HeatmapTooltip />
        </HeatmapChart>
      ))}
    </section>
  );
}
