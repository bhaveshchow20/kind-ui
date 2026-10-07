import * as Chart from "@kind-ui/charts";
import {
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  type ScatterShapeProps,
  Symbols,
  XAxis,
  YAxis,
  ZAxis,
} from "@kind-ui/charts";
import { useState } from "react";

export type Observation = { id: string; x: number; y: number | null; z?: number | null };
const relationshipShapes = { weekday: "circle", weekend: "diamond" } as const;
const weekday: Observation[] = [
  { id: "Search", x: 28, y: 84, z: 45 },
  { id: "Summarize", x: 45, y: 79, z: 90 },
  { id: "Extract", x: 56, y: 93, z: 165 },
  { id: "Classify", x: 22, y: 72, z: 260 },
  { id: "Reason", x: 82, y: 96, z: 70 },
  { id: "Translate", x: 66, y: 88, z: 120 },
];
const weekend: Observation[] = [
  { id: "Search / weekend", x: 36, y: 81, z: 30 },
  { id: "Summarize / weekend", x: 58, y: 87, z: 55 },
  { id: "Extract / weekend", x: 71, y: 91, z: 95 },
  { id: "Classify / weekend", x: 31, y: 76, z: 180 },
  { id: "Reason / weekend", x: 92, y: 97, z: 48 },
];
const signed: Observation[] = [
  { id: "Aster", x: -24, y: 12 },
  { id: "Birch", x: -11, y: -8 },
  { id: "Cedar", x: 0, y: 0 },
  { id: "Dune", x: 16, y: 20 },
  { id: "Ember", x: 16, y: 20 },
  { id: "Fjord", x: 29, y: -13 },
  { id: "Grove", x: 39, y: 31 },
  { id: "Haven", x: 11, y: null },
];
const coverage: Observation[] = [
  { id: "North", x: 23, y: 36, z: 0 },
  { id: "East", x: 44, y: 67, z: 55 },
  { id: "South", x: 69, y: 48, z: null },
  { id: "West", x: 83, y: 79, z: 190 },
  { id: "Central", x: 52, y: 91, z: -12 },
];
export function pointLabel(record: unknown) {
  return record && typeof record === "object" && "id" in record ? String(record.id) : "Observation";
}
function Diamond(props: ScatterShapeProps & { fill?: string }) {
  if (props.cx == null || props.cy == null) return null;
  return (
    <Symbols
      type="diamond"
      cx={props.cx}
      cy={props.cy}
      size={props.size}
      fill={props.fill}
      stroke="white"
      strokeWidth={1.5}
    />
  );
}
function DataTable({ rows, size = false }: { rows: Observation[]; size?: boolean }) {
  return (
    <details>
      <summary>View observations</summary>
      <div className="scatter-table">
        <table>
          <caption>Raw values; overlapping and missing observations remain separate</caption>
          <thead>
            <tr>
              <th>Observation</th>
              <th>x</th>
              <th>y</th>
              {size && <th>z</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th>{row.id}</th>
                <td>{row.x}</td>
                <td>{row.y ?? "No data"}</td>
                {size && <td>{row.z ?? "No data"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
export function ScatterRecipes() {
  const [animate, setAnimate] = useState(true);
  const [material, setMaterial] = useState<Chart.ScatterMaterial>("plain");
  const [color, setColor] = useState(false);
  const purple = color ? "#7c5ce7" : "#606977";
  const green = color ? "#169b83" : "#929aa5";
  const blue = color ? "#5f79d9" : "#707988";
  const orange = color ? "#d8844c" : "#747d89";
  const [visible, setVisible] = useState(["weekday", "weekend"]);
  const [period, setPeriod] = useState(false);
  const current = period
    ? weekday.map((row, index) => ({
        ...row,
        x: row.x + (index % 2 ? 6 : -3),
        y: row.y == null ? null : row.y - 3,
      }))
    : weekday;
  return (
    <main
      className="scatter-page"
      data-material={material}
      data-palette={color ? "color" : "monochrome"}
    >
      <header className="scatter-header">
        <div>
          <p className="scatter-eyebrow">KIND UI / SCATTER</p>
          <h1>Relationships, at a glance.</h1>
          <p>Numeric positions. Distinct series. A third dimension in bubble area.</p>
        </div>
        <label className="scatter-switch">
          <input
            type="checkbox"
            checked={animate}
            onChange={(event) => setAnimate(event.target.checked)}
          />
          Motion
        </label>
      </header>
      <div className="scatter-controls">
        <fieldset aria-label="Finish">
          {(["plain", "clay", "glow"] as const).map((finish) => (
            <button
              key={finish}
              type="button"
              aria-pressed={material === finish}
              onClick={() => setMaterial(finish)}
            >
              {finish === "plain" ? "Default" : finish.charAt(0).toUpperCase() + finish.slice(1)}
            </button>
          ))}
        </fieldset>
        <fieldset aria-label="Palette">
          <button type="button" aria-pressed={!color} onClick={() => setColor(false)}>
            Monochrome
          </button>
          <button type="button" aria-pressed={color} onClick={() => setColor(true)}>
            Color
          </button>
        </fieldset>
      </div>
      <p className="scatter-note">
        Clay adds soft convex relief. Glow adds decorative light outside the exact bubble area.
        Custom diamond renderers keep their own finish.
      </p>
      <div className="scatter-grid">
        <section className="scatter-card scatter-wide" aria-labelledby="relationship-title">
          <header>
            <div>
              <p className="scatter-eyebrow">01 / TWO SERIES</p>
              <h2 id="relationship-title">Speed meets quality</h2>
              <p>Lower latency, higher acceptance. Each point is one task.</p>
            </div>
            <button type="button" onClick={() => setPeriod(!period)}>
              {period ? "Current week" : "Next week"}
            </button>
          </header>
          <Chart.Root
            config={{
              weekday: { label: "Weekday", color: purple, legendShape: relationshipShapes.weekday },
              weekend: { label: "Weekend", color: green, legendShape: relationshipShapes.weekend },
            }}
            visibleSeries={visible}
            onVisibleSeriesChange={setVisible}
          >
            <Chart.Legend />
            <Chart.ScatterChart
              responsive
              style={{ width: "100%", height: 310 }}
              margin={{ top: 16, right: 24, left: 0, bottom: 24 }}
              animate={animate}
              aria-label="Latency and acceptance by task"
            >
              <CartesianGrid vertical={false} stroke="#e6e8ee" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#7c8598" }}
                dataKey="x"
                domain={[0, 110]}
                name="Latency"
                unit=" ms"
                tickLine={false}
                axisLine={false}
                label={{ value: "Latency (ms)", position: "bottom", offset: 8 }}
              />
              <YAxis
                type="number"
                tick={{ fontSize: 10, fill: "#7c8598" }}
                dataKey="y"
                domain={[60, 100]}
                name="Acceptance"
                unit="%"
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <ReferenceLine y={90} stroke="#c4c9d5" strokeDasharray="4 4" />
              <Chart.ScatterSeries
                material={material}
                seriesKey="weekday"
                data={current}
                shape={relationshipShapes.weekday}
              />
              <Chart.ScatterSeries
                material={material}
                seriesKey="weekend"
                data={weekend}
                shape={relationshipShapes.weekend}
              />
              <Chart.ScatterTooltip pointLabel={pointLabel} />
            </Chart.ScatterChart>
          </Chart.Root>
          <p className="scatter-note">
            Acceptance (%) · the dashed line marks 90%. Toggle a series in the legend.
          </p>
          <DataTable rows={[...current, ...weekend]} />
        </section>
        <section className="scatter-card" aria-labelledby="bubble-title">
          <header>
            <div>
              <p className="scatter-eyebrow">02 / BUBBLE AREA</p>
              <h2 id="bubble-title">Traffic adds context</h2>
              <p>Same positions. Bubble area maps requests from 0–300k.</p>
            </div>
          </header>
          <Chart.Root config={{ tasks: { label: "Task workload", color: blue } }}>
            <Chart.Legend />
            <Chart.ScatterChart
              responsive
              style={{ width: "100%", height: 285 }}
              margin={{ top: 20, right: 22, left: 0, bottom: 24 }}
              animate={animate}
              aria-label="Task latency acceptance and request volume"
            >
              <CartesianGrid vertical={false} stroke="#e6e8ee" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#7c8598" }}
                dataKey="x"
                domain={[0, 110]}
                name="Latency"
                unit=" ms"
                tickLine={false}
                axisLine={false}
                label={{ value: "Latency (ms)", position: "bottom", offset: 8 }}
              />
              <YAxis
                type="number"
                tick={{ fontSize: 10, fill: "#7c8598" }}
                dataKey="y"
                domain={[60, 100]}
                name="Acceptance"
                unit="%"
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <ZAxis dataKey="z" domain={[0, 300]} range={[35, 1200]} name="Requests" unit="k" />
              <Chart.ScatterSeries
                material={material}
                seriesKey="tasks"
                data={current}
                fillOpacity={0.7}
                stroke={color ? "#3e59b5" : "#505966"}
                strokeWidth={1}
              />
              <Chart.ScatterTooltip pointLabel={pointLabel} />
            </Chart.ScatterChart>
          </Chart.Root>
          <p className="scatter-note">
            Acceptance (%) · area range 35–1,200 px², with a visible minimum. Size is area, not
            radius.
          </p>
          <DataTable rows={current} size />
        </section>
        <section className="scatter-card" aria-labelledby="signed-title">
          <header>
            <div>
              <p className="scatter-eyebrow">03 / SIGNED & OVERLAPPING</p>
              <h2 id="signed-title">Change in both directions</h2>
              <p>Zero stays at the origin. Two teams share one coordinate.</p>
            </div>
          </header>
          <Chart.Root config={{ teams: { label: "Teams", color: orange } }}>
            <Chart.Legend />
            <Chart.ScatterChart
              responsive
              style={{ width: "100%", height: 285 }}
              margin={{ top: 24, right: 25, left: 0, bottom: 24 }}
              animate={animate}
              aria-label="Cost and quality change by team"
            >
              <CartesianGrid vertical={false} stroke="#e6e8ee" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#7c8598" }}
                dataKey="x"
                domain={[-40, 50]}
                name="Cost change"
                unit="%"
                tickLine={false}
                axisLine={false}
                label={{ value: "Cost change (%)", position: "bottom", offset: 8 }}
              />
              <YAxis
                type="number"
                tick={{ fontSize: 10, fill: "#7c8598" }}
                dataKey="y"
                domain={[-20, 40]}
                name="Quality change"
                unit=" pp"
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <ReferenceLine x={0} stroke="#aeb5c4" />
              <ReferenceLine y={0} stroke="#aeb5c4" />
              <Chart.ScatterSeries
                material={material}
                seriesKey="teams"
                data={signed.filter((row) => row.y !== null)}
                shape={Diamond}
                activeShape={Diamond}
              >
                <Cell fill={orange} />
                <Cell fill={orange} />
                <Cell fill={orange} />
                <Cell fill={orange} />
                <Cell fill={color ? "#8558bf" : "#a1a7b0"} />
                <LabelList
                  dataKey={(row: unknown) =>
                    pointLabel(row) === "Ember"
                      ? ""
                      : pointLabel(row) === "Dune"
                        ? "Dune / Ember"
                        : pointLabel(row)
                  }
                  content={({ x, y, width, value }) =>
                    typeof x === "number" && typeof y === "number" ? (
                      <text
                        x={x + (typeof width === "number" ? width / 2 : 0)}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#7c8598"
                      >
                        {String(value ?? "")}
                      </text>
                    ) : null
                  }
                />
              </Chart.ScatterSeries>
              <Chart.ScatterTooltip pointLabel={pointLabel} />
            </Chart.ScatterChart>
          </Chart.Root>
          <p className="scatter-note">
            Quality change (pp) · Dune and Ember overlap; arrows and the table distinguish them.
            Haven has no y measurement.
          </p>
          <DataTable rows={signed} />
        </section>
        <section className="scatter-card scatter-wide" aria-labelledby="coverage-title">
          <header>
            <div>
              <p className="scatter-eyebrow">04 / SIZE COMPLETENESS</p>
              <h2 id="coverage-title">A small mark can mean two things</h2>
              <p>
                Zero and missing volume share the native minimum marker; the tooltip tells them
                apart.
              </p>
            </div>
          </header>
          <Chart.Root config={{ regions: { label: "Regions", color: green } }}>
            <Chart.Legend />
            <Chart.ScatterChart
              responsive
              style={{ width: "100%", height: 270 }}
              margin={{ top: 25, right: 25, left: 0, bottom: 24 }}
              animate={animate}
              aria-label="Coverage and adoption by region"
            >
              <CartesianGrid vertical={false} stroke="#e6e8ee" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#7c8598" }}
                dataKey="x"
                domain={[0, 100]}
                name="Coverage"
                unit="%"
                tickLine={false}
                axisLine={false}
                label={{ value: "Coverage (%)", position: "bottom", offset: 8 }}
              />
              <YAxis
                type="number"
                tick={{ fontSize: 10, fill: "#7c8598" }}
                dataKey="y"
                domain={[0, 100]}
                name="Adoption"
                unit="%"
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <ZAxis dataKey="z" domain={[0, 200]} range={[55, 1000]} name="Requests" unit="k" />
              <Chart.ScatterSeries
                material={material}
                seriesKey="regions"
                data={coverage.filter((row) => row.z == null || row.z >= 0)}
                fillOpacity={0.75}
              >
                <LabelList dataKey="id" position="top" fontSize={11} />
              </Chart.ScatterSeries>
              <Chart.ScatterTooltip<Observation>
                pointLabel={(row) => row.id}
                zDimension={{ dataKey: "z", name: "Requests", unit: "k" }}
              />
            </Chart.ScatterChart>
          </Chart.Root>
          <p className="scatter-note">
            Adoption (%) · North: 0k; South: no volume measurement. Central’s −12k is invalid as a
            count and appears only in the table. No jitter or imputed coordinates.
          </p>
          <DataTable rows={coverage} size />
        </section>
      </div>
      <footer className="scatter-footer">
        Hover a point for its values. Arrow keys follow the first series; tables include every
        observation. Motion respects reduced-motion preferences.
      </footer>
    </main>
  );
}
