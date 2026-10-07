"use client";

import { LineChart, type SeriesConfig } from "@kind-ui/charts";

// Import @kind-ui/charts/styles.css once at the app entry/root layout.
type Row = { week: string; orders: number | null };
const config = {
  orders: { label: "Orders", color: "#3157a5" },
} satisfies SeriesConfig;

export function WeeklyOrders({ rows, pending = false }: { rows: Row[]; pending?: boolean }) {
  if (!pending && rows.length === 0) return <p>No weekly observations.</p>;
  return (
    <section>
      <LineChart
        config={config}
        data={rows}
        xDataKey="week"
        height={280}
        aria-label="Weekly orders (count)"
        series={[{ seriesKey: "orders", dataKey: "orders", connectNulls: false }]}
        loading={pending}
        loadingLabel="Loading weekly orders"
        animate={false}
      />
      {pending ? (
        <p>Observations are loading.</p>
      ) : (
        <table>
          <caption>Weekly orders (count)</caption>
          <thead>
            <tr>
              <th scope="col">Week</th>
              <th scope="col">Orders</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.week}>
                <th scope="row">{row.week}</th>
                <td>{row.orders === null ? "No observation" : row.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
