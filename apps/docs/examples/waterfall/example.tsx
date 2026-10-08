"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

// Values are USD thousands. Checkpoints are absolute; deltas are signed changes.
const entries = [
  { id: "opening", label: "Opening", kind: "start", value: 120 },
  { id: "sales", label: "Sales", kind: "delta", value: 75 },
  { id: "refunds", label: "Refunds", kind: "delta", value: -15 },
  { id: "operating", label: "Subtotal", kind: "subtotal" },
  { id: "costs", label: "Costs", kind: "delta", value: -65 },
  { id: "tax", label: "Tax", kind: "delta", value: -20 },
  { id: "closing", label: "Closing", kind: "end", value: 95 },
] satisfies Chart.WaterfallEntry[];
const data = Chart.computeWaterfallData(entries);
const labels = new Map(data.map((row) => [row.id, row.label]));
const money = (value: number | null) => (value === null ? "Unknown" : `$${value}k`);
const config = {
  range: { label: "Cash balance", color: "#733bff" },
} satisfies Chart.SeriesConfig;

export function CashFlowChart({ state = "ready" }: { state?: "ready" | "loading" }) {
  return (
    <Chart.Root config={config}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }}>
        <span>
          <span aria-hidden="true" style={{ color: "#733bff" }}>
            ●
          </span>{" "}
          Checkpoint
        </span>
        <span>
          <span aria-hidden="true" style={{ color: "#15803d" }}>
            ●
          </span>{" "}
          Increase
        </span>
        <span>
          <span aria-hidden="true" style={{ color: "#be123c" }}>
            ●
          </span>{" "}
          Decrease
        </span>
      </div>
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.WaterfallChart
          loading={state === "loading"}
          data={data}
          layout="vertical"
          animate
          accessibilityLayer
          aria-label="Quarterly cash contribution flow in USD thousands"
          margin={{ top: 12, right: 24, bottom: 4, left: 0 }}
          barCategoryGap="32%"
        >
          <Chart.CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <Chart.XAxis
            type="number"
            domain={[0, "auto"]}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => money(Number(value))}
            tickMargin={10}
            height={36}
          />
          <Chart.YAxis
            type="category"
            dataKey="id"
            width={76}
            axisLine={false}
            tickLine={false}
            tickFormatter={(id) => labels.get(String(id)) ?? String(id)}
            tickMargin={8}
          />
          <Chart.ReferenceLine x={0} stroke="currentColor" strokeOpacity={0.3} />
          <Chart.WaterfallConnectors
            data={data}
            position="middle"
            stroke="currentColor"
            strokeOpacity={0.35}
          />
          <Chart.WaterfallSeries radius={3}>
            {data.map((row) => (
              <Chart.Cell
                key={row.id}
                fill={
                  row.kind !== "delta" ? "#733bff" : (row.value ?? 0) < 0 ? "#be123c" : "#15803d"
                }
              />
            ))}
          </Chart.WaterfallSeries>
          <Chart.Tooltip
            filterNull={false}
            maxWidth={180}
            content={(tooltip) => {
              const row = data.find((row) => row.id === String(tooltip.label));
              if (!tooltip.active || !row) return null;
              return (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: "var(--kind-ui-chart-popover, var(--popover, Canvas))",
                    color:
                      "var(--kind-ui-chart-popover-foreground, var(--popover-foreground, CanvasText))",
                    border: "1px solid #8886",
                    fontSize: 12,
                  }}
                >
                  <strong>{row.label}</strong>
                  <div>
                    {row.kind === "delta"
                      ? "Change"
                      : row.kind === "subtotal"
                        ? "Subtotal"
                        : "Checkpoint"}
                    : {row.kind === "delta" && row.value !== null && row.value > 0 ? "+" : ""}
                    {money(row.value)}
                  </div>
                  <div>From: {money(row.start)}</div>
                  <div>Balance: {money(row.balance)}</div>
                </div>
              );
            }}
          />
        </Chart.WaterfallChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
