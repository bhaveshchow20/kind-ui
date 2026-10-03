"use client";
// Adapted from examples/chart/pie-recipes.tsx: Allocation, at 218ac66.
import * as Chart from "@kind-ui/charts";
import { Cell, Label } from "recharts";
import { type CommonSettings, useSettings } from "../shared/controls";
import { defaultSettings } from "./settings";
export type ExampleSettings = CommonSettings & {
  visible: string[];
  material: "plain" | "paper";
  hole: number;
};
const config = {
  research: { label: "Research", color: "#91a8e7", formatValue: (v: unknown) => `${v} hours` },
  delivery: { label: "Delivery", color: "#89bfb0", formatValue: (v: unknown) => `${v} hours` },
  support: { label: "Support", color: "#e7ba91", formatValue: (v: unknown) => `${v} hours` },
  unplanned: { label: "Unplanned", color: "#dda0b9", formatValue: (v: unknown) => `${v} hours` },
} satisfies Chart.SeriesConfig;
const rows = [
  { id: "research", hours: 24 },
  { id: "delivery", hours: 48 },
  { id: "support", hours: 16 },
  { id: "unplanned", hours: 12 },
];
const itemKey: NonNullable<Chart.TooltipProps["itemKey"]> = (entry) => String(entry.payload.id);
export function Example({
  onSettingsChange,
}: {
  onSettingsChange?: (settings: ExampleSettings) => void;
}) {
  const [s, set] = useSettings(defaultSettings, onSettingsChange);
  const data = rows.filter((row) => s.visible.includes(row.id));
  const total = data.reduce((sum, row) => sum + row.hours, 0);
  return (
    <section className="chart-example" aria-label="Filtered team capacity example">
      <Chart.Root
        config={config}
        emphasis={s.emphasis}
        visibleSeries={s.visible}
        onVisibleSeriesChange={(visible) => set({ ...s, visible })}
      >
        <Chart.Legend />
        <p className="chart-sr-only">
          The legend changes which categories contribute. Hover or focus a sector to emphasize it;
          emphasis keeps every value.
        </p>
        <Chart.PieChart
          responsive
          style={{ width: "100%", height: 290 }}
          animate={s.animate}
          aria-label="Included weekly hours"
        >
          <Chart.PieSeries
            material={s.material}
            data={data}
            dataKey="hours"
            nameKey="id"
            innerRadius={`${s.hole}%`}
            outerRadius="88%"
          >
            {data.map((row) => (
              <Cell key={row.id} fill={`var(--color-${row.id})`} />
            ))}
            {s.hole > 0 && (
              <Label position="center" value={`${total} hours`} fill="var(--foreground)" />
            )}
          </Chart.PieSeries>
          <Chart.Tooltip itemKey={itemKey} />
        </Chart.PieChart>
        <p role="status" className="chart-sr-only">
          {total === 0 ? "No allocated hours in included categories." : `${total} included hours.`}
        </p>
        <details>
          <summary>View data</summary>
          <div className="table-scroll">
            <table>
              <caption>Weekly hours and included shares</caption>
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Hours</th>
                  <th scope="col">Included</th>
                  <th scope="col">Share</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{config[row.id as keyof typeof config].label}</th>
                    <td>{row.hours}</td>
                    <td>{s.visible.includes(row.id) ? "Yes" : "No"}</td>
                    <td>
                      {s.visible.includes(row.id) && total > 0
                        ? `${((100 * row.hours) / total).toFixed(1)}%`
                        : "—"}
                    </td>
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
