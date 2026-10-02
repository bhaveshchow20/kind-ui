import * as Chart from "@kind-ui/charts";
import { useMemo, useState } from "react";
import { Cell, Label } from "recharts";

const defaultConfig = {
  research: { label: "Research", color: "#6366f1", formatValue: (v: unknown) => `${v} hours` },
  delivery: { label: "Delivery", color: "#0d9488", formatValue: (v: unknown) => `${v} hours` },
  support: { label: "Support", color: "#f59e0b", formatValue: (v: unknown) => `${v} hours` },
  unplanned: { label: "Unplanned", color: "#db2777", formatValue: (v: unknown) => `${v} hours` },
} satisfies Chart.SeriesConfig;
const defaultRows = [
  { id: "research", hours: 24 },
  { id: "delivery", hours: 48 },
  { id: "support", hours: 16 },
  { id: "unplanned", hours: 0 },
];
const itemKey: NonNullable<Chart.TooltipProps["itemKey"]> = (entry) => String(entry.payload.id);
export function Allocation({
  donut = false,
  config = defaultConfig,
  rows = defaultRows,
  animate: controlledAnimation,
}: {
  donut?: boolean;
  config?: Chart.SeriesConfig;
  rows?: { id: string; hours: number }[];
  animate?: boolean;
}) {
  const [visible, setVisible] = useState(Object.keys(config));
  const [localAnimation, setAnimate] = useState(false);
  const animate = controlledAnimation ?? localAnimation;
  const [selected, setSelected] = useState<string>();
  const data = useMemo(() => rows.filter((row) => visible.includes(row.id)), [visible, rows]);
  const total = data.reduce((sum, row) => sum + row.hours, 0);
  return (
    <article className="pie-card">
      <h2>{donut ? "Team capacity" : "Where the week went"}</h2>
      <p>Hours by category. The legend changes which categories contribute to the total.</p>
      {controlledAnimation === undefined && (
        <label>
          <input
            type="checkbox"
            checked={animate}
            onChange={(event) => setAnimate(event.target.checked)}
          />{" "}
          Animate
        </label>
      )}
      <Chart.Root
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={(next) => {
          setVisible(next);
          if (selected && !next.includes(selected)) setSelected(undefined);
        }}
      >
        <Chart.PieChart
          responsive
          style={{ width: "100%", height: 260 }}
          animate={animate}
          aria-label={donut ? "Team capacity donut" : "Weekly hours pie"}
        >
          <Chart.PieSeries
            data={data}
            dataKey="hours"
            nameKey="id"
            innerRadius={donut ? "52%" : 0}
            outerRadius="92%"
            onClick={(sector) => setSelected(String(sector.payload.id))}
          >
            {data.map((row) => (
              <Cell key={row.id} fill={`var(--color-${row.id})`} />
            ))}
            {donut && <Label position="center" value={`${total} hours`} />}
          </Chart.PieSeries>
          <Chart.Tooltip itemKey={itemKey} />
        </Chart.PieChart>
        <Chart.Legend />
        <p role="status">
          {total === 0 ? "No allocated hours in visible categories." : `${total} visible hours.`}{" "}
          {selected ? `Selected: ${config[selected]?.label}.` : "Select a slice to inspect it."}
        </p>
        <table>
          <caption>Weekly hours</caption>
          <thead>
            <tr>
              <th>Category</th>
              <th>Hours</th>
              <th>Included</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th>{config[row.id]?.label}</th>
                <td>{row.hours}</td>
                <td>{visible.includes(row.id) ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Chart.Root>
    </article>
  );
}
