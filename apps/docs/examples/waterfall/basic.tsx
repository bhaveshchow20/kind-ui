"use client";

import {
  Cell,
  computeWaterfallData,
  type SeriesConfig,
  WaterfallChart,
  type WaterfallEntry,
} from "@kind-ui/charts";

const entries = [
  { id: "opening", label: "Opening", kind: "start", value: 120 },
  { id: "sales", label: "Sales", kind: "delta", value: 75 },
  { id: "refunds", label: "Refunds", kind: "delta", value: -15 },
  { id: "subtotal", label: "Subtotal", kind: "subtotal" },
  { id: "costs", label: "Costs", kind: "delta", value: -65 },
  { id: "tax", label: "Tax", kind: "delta", value: -20 },
  { id: "closing", label: "Closing", kind: "end", value: 95 },
] satisfies WaterfallEntry[];

const data = computeWaterfallData(entries);

const config = {
  range: { label: "Cash", color: "#733bff" },
} satisfies SeriesConfig;

const labels = new Map(data.map((row) => [row.id, row.label]));

const money = (value: number) => `${value < 0 ? "-" : ""}$${Math.abs(value)}k`;

const fill = (row: (typeof data)[number]) =>
  row.kind !== "delta" ? "#733bff" : (row.value ?? 0) < 0 ? "#e11d48" : "#16a34a";

export default function CashFlowChart() {
  return (
    <WaterfallChart
      data={data}
      config={config}
      animate
      margin={{ right: 16 }}
      aria-label="Quarterly cash flow, in thousands of dollars"
    >
      <WaterfallChart.Grid vertical={false} />
      <WaterfallChart.XAxis dataKey="id" tickFormatter={(id) => labels.get(id) ?? id} />
      <WaterfallChart.YAxis width={40} />
      <WaterfallChart.Connectors data={data} />
      <WaterfallChart.Series radius={3}>
        {data.map((row) => (
          <Cell key={row.id} fill={fill(row)} />
        ))}
      </WaterfallChart.Series>
      <WaterfallChart.Tooltip
        labelFormatter={(id) => labels.get(String(id)) ?? id}
        formatter={(_value, _name, entry) => money(entry.payload.value)}
      />
    </WaterfallChart>
  );
}
