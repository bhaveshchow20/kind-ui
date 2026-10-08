"use client";

import {
  BarSeries,
  CartesianGrid,
  ComboChart,
  Legend,
  LineSeries,
  ResponsiveContainer,
  Root,
  type SeriesConfig,
  Tooltip,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { useState } from "react";

// Import @kind-ui/charts/styles.css once at the app entry/root layout.
type Row = { month: string; revenue: number | null; conversion: number | null };
const money = (value: number) => `$${value.toLocaleString("en-US")}`;
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const config = {
  revenue: {
    label: "Revenue (USD)",
    color: "#3157a5",
    formatValue: (value) => (typeof value === "number" ? money(value) : "No observation"),
  },
  conversion: {
    label: "Conversion (%)",
    color: "#a74718",
    formatValue: (value) => (typeof value === "number" ? percent(value) : "No observation"),
  },
} satisfies SeriesConfig;

export function RevenueAndConversion({
  rows,
  pending = false,
}: {
  rows: Row[];
  pending?: boolean;
}) {
  const [visible, setVisible] = useState<string[]>(["revenue", "conversion"]);
  if (!pending && rows.length === 0) return <p>No monthly observations.</p>;
  return (
    <section>
      <Root
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
        role="region"
        aria-label="Monthly revenue and conversion"
      >
        <ResponsiveContainer width="100%" height={300}>
          <ComboChart
            data={rows}
            loading={pending}
            loadingLabel="Loading monthly metrics"
            animate={false}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" />
            <YAxis yAxisId="money" tickFormatter={money} />
            <YAxis yAxisId="rate" orientation="right" domain={[0, 1]} tickFormatter={percent} />
            <Tooltip />
            <BarSeries dataKey="revenue" seriesKey="revenue" yAxisId="money" />
            <LineSeries
              dataKey="conversion"
              seriesKey="conversion"
              yAxisId="rate"
              connectNulls={false}
            />
          </ComboChart>
        </ResponsiveContainer>
        <Legend />
      </Root>
      {pending ? (
        <p>Observations are loading.</p>
      ) : (
        <table>
          <caption>All monthly observations; legend toggles affect chart marks only.</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Revenue (USD)</th>
              <th scope="col">Conversion (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <th scope="row">{row.month}</th>
                <td>{row.revenue === null ? "No observation" : money(row.revenue)}</td>
                <td>{row.conversion === null ? "No observation" : percent(row.conversion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
