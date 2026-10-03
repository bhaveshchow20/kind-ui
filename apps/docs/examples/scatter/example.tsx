"use client";
// Adapted from examples/chart/scatter-recipes.tsx at 218ac66.
import * as Chart from "@kind-ui/charts";
import { CartesianGrid, XAxis, YAxis, ZAxis } from "recharts";
import { type CommonSettings, Controls, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";
export type ExampleSettings = CommonSettings & { material: "plain" | "paper"; visible: string[] };
type Row = { id: string; x: number; y: number; z: number | null };
const weekday: Row[] = [
  { id: "Search", x: 28, y: 84, z: 45 },
  { id: "Summarize", x: 45, y: 79, z: 90 },
  { id: "Extract", x: 56, y: 93, z: 165 },
  { id: "Classify", x: 22, y: 72, z: 0 },
];
const weekend: Row[] = [
  { id: "Search / weekend", x: 36, y: 81, z: 30 },
  { id: "Summarize / weekend", x: 58, y: 87, z: 55 },
  { id: "Extract / weekend", x: 71, y: 91, z: null },
];
function CircleIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle cx="8" cy="8" r="5" fill="#733bff" />
    </svg>
  );
}
function DiamondIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M8 1 15 8 8 15 1 8Z" fill="#119548" />
    </svg>
  );
}
const config = {
  weekday: { label: "Weekday", color: "#733bff", icon: CircleIcon },
  weekend: { label: "Weekend", color: "#119548", icon: DiamondIcon },
} satisfies Chart.SeriesConfig;
export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);
  return (
    <section className="chart-example" aria-label="Scatter markers and legend example">
      <Controls settings={s} onChange={set}>
        <label>
          Finish
          <select
            value={s.material}
            onChange={(e) =>
              set({ ...s, material: e.target.value === "paper" ? "paper" : "plain" })
            }
          >
            <option value="plain">Plain</option>
            <option value="paper">Paper</option>
          </select>
        </label>
      </Controls>
      <Chart.Root
        config={config}
        visibleSeries={s.visible}
        onVisibleSeriesChange={(visible) => set({ ...s, visible })}
      >
        <Chart.Legend />
        <p className="chart-help">
          x: latency (ms), y: acceptance (%), z: request count. Matching legend glyphs are explicit
          config icons.
        </p>
        <Chart.ScatterChart
          key={s.animate ? "entrance" : "still"}
          responsive
          style={{ width: "100%", height: 320 }}
          animate={s.animate}
          aria-label="Latency and acceptance by task"
          margin={{ top: 16, right: 14, left: 0, bottom: 24 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="x"
            name="Latency"
            unit=" ms"
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            label={{ value: "Latency (ms)", position: "bottom", offset: 6 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Acceptance"
            unit="%"
            domain={[60, 100]}
            width={42}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis type="number" dataKey="z" name="Requests" domain={[0, 200]} range={[24, 240]} />
          <Chart.ScatterSeries
            seriesKey="weekday"
            data={weekday}
            shape="circle"
            material={s.material}
          />
          <Chart.ScatterSeries
            seriesKey="weekend"
            data={weekend}
            shape="diamond"
            material={s.material}
          />
          <Chart.ScatterTooltip<Row>
            pointLabel={(row) => row.id}
            zDimension={{ dataKey: "z", name: "Requests" }}
            missingValue="No data"
          />
        </Chart.ScatterChart>
        <p className="chart-help">
          Native arrows visit only the first registered series, in data order. The table includes
          both cohorts. Native Z scaling gives a minimum marker area; zero and missing counts remain
          distinct in the tooltip and table.
        </p>
        <details>
          <summary>View data</summary>
          <div className="table-scroll">
            <table>
              <caption>All task observations</caption>
              <thead>
                <tr>
                  <th scope="col">Task</th>
                  <th scope="col">Latency (ms)</th>
                  <th scope="col">Acceptance (%)</th>
                  <th scope="col">Requests</th>
                </tr>
              </thead>
              <tbody>
                {[...weekday, ...weekend].map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.id}</th>
                    <td>{row.x}</td>
                    <td>{row.y}</td>
                    <td>{row.z ?? "No data"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Chart.Root>
    </section>
  );
}
