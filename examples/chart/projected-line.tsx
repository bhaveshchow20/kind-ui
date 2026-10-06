import {
  ComboChart,
  getProjectedStart,
  LineSeries,
  Root,
  Tooltip,
  XAxis,
  YAxis,
} from "@kind-ui/charts";

type Row = { month: string; total: number | null; estimated: boolean };
const data: Row[] = [
  { month: "Jan", total: 12, estimated: false },
  { month: "Feb", total: null, estimated: false },
  { month: "Mar", total: 15, estimated: true },
  { month: "Apr", total: 17, estimated: true },
];
const isProjected = (row: Row) => row.estimated;
const start = getProjectedStart(data, isProjected);

/** Estimates come from the caller, including the status in the data alternative. */
export function ProjectedLineExample() {
  return (
    <section>
      <h2>Monthly totals and caller estimates</h2>
      <Root config={{ total: { label: "Total", color: "#4055ee" } }}>
        <ComboChart width={500} height={280} data={data} aria-label="Monthly totals and estimates">
          <XAxis dataKey="month" />
          <YAxis />
          <LineSeries<Row, number | null>
            dataKey="total"
            projected={{ isProjected, strokeDasharray: "6 3" }}
            type="monotone"
            connectNulls={false}
          />
          <Tooltip />
        </ComboChart>
      </Root>
      <table>
        <caption>Monthly totals and estimates</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td>{row.total ?? "No data"}</td>
              <td>{index >= start ? "Projected" : "Historical"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
