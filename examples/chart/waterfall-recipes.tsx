import * as Chart from "@kind-ui/charts";
import {
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { useId } from "react";

export const waterfallSample: Chart.WaterfallEntry[] = [
  { id: "opening", label: "Opening", kind: "start", value: 80 },
  { id: "sales", label: "Sales", kind: "delta", value: 50 },
  { id: "costs", label: "Costs", kind: "delta", value: -160 },
  { id: "net", label: "Net", kind: "subtotal" },
  { id: "refund", label: "Refund", kind: "delta", value: 0 },
  { id: "recovery", label: "Recovery", kind: "delta", value: 70 },
  { id: "closing", label: "Closing", kind: "end", value: 40 },
];
const format = (value: number | null) =>
  value === null ? "Unknown" : value.toLocaleString("en-US");

export function WaterfallTable({ data }: { data: Chart.WaterfallDatum[] }) {
  return (
    <details>
      <summary>View data</summary>
      <table>
        <caption>Waterfall values and balances · sample units</caption>
        <thead>
          <tr>
            {["Step", "Kind", "Value", "From", "To", "Balance"].map((label) => (
              <th scope="col" key={label}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.label}</th>
              <td>{row.kind}</td>
              <td>{format(row.value)}</td>
              <td>{format(row.start)}</td>
              <td>{format(row.end)}</td>
              <td>{format(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

export function WaterfallRecipe({
  data,
  label,
  material = "plain",
  animate = true,
  visible = true,
  hide = false,
  custom = false,
  onClick,
}: {
  data: Chart.WaterfallDatum[];
  label: string;
  material?: Chart.BarMaterial;
  animate?: boolean;
  visible?: boolean;
  hide?: boolean;
  custom?: boolean;
  onClick?: () => void;
}) {
  const help = useId();
  const labels = new Map(data.map((row) => [row.id, row.label]));
  return (
    <Chart.Root
      config={{ range: { label: "Balance", color: "var(--chart-1)" } }}
      visibleSeries={visible ? ["range"] : []}
      className="recipe-chart"
    >
      <p id={help} className="recipe-help">
        Focus the chart and use left/right arrows to explore; Escape dismisses. Values are sample
        units.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <Chart.WaterfallChart
          data={data}
          animate={animate}
          accessibilityLayer
          aria-label={label}
          aria-describedby={help}
          margin={{ top: 25, right: 12, bottom: 5, left: 0 }}
          barCategoryGap="32%"
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="id"
            tickFormatter={(id) => labels.get(String(id)) ?? String(id)}
            tickLine={false}
            axisLine={false}
            minTickGap={5}
          />
          <YAxis domain={["auto", "auto"]} width={40} tickLine={false} axisLine={false} />
          <ReferenceLine y={0} stroke="var(--foreground)" />
          <Chart.WaterfallConnectors data={data} hide={hide} stroke="var(--muted-foreground)" />
          <Chart.WaterfallSeries
            material={material}
            hide={hide}
            {...(onClick ? { onClick } : {})}
            {...(custom
              ? {
                  shape: (props) => (
                    <rect
                      data-native-extension="shape"
                      x={props.x}
                      y={props.y}
                      width={props.width}
                      height={props.height}
                      fill={props.fill}
                      stroke="var(--foreground)"
                    />
                  ),
                }
              : {})}
          >
            {data.map((row) => (
              <Cell
                key={row.id}
                fill={
                  row.kind !== "delta"
                    ? "var(--chart-1)"
                    : (row.value ?? 0) < 0
                      ? "var(--chart-3)"
                      : "var(--chart-2)"
                }
              />
            ))}
            {custom && (
              <LabelList
                dataKey="value"
                position="top"
                formatter={(value) => (typeof value === "number" ? String(value) : "")}
              />
            )}
          </Chart.WaterfallSeries>
          <Chart.Tooltip
            filterNull={false}
            content={(tooltip) => {
              const row = data.find((row) => row.id === String(tooltip.label));
              return tooltip.active && row && visible && !hide ? (
                <div role="status" aria-live="polite" className="waterfall-tooltip">
                  <strong>{row.label}</strong>
                  <div>
                    {row.kind}: {format(row.value)}
                  </div>
                  <div>Balance: {format(row.balance)}</div>
                </div>
              ) : null;
            }}
          />
        </Chart.WaterfallChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
