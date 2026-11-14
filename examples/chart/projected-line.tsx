import "@kind-ui/charts/styles.css";
import {
  ComboChart,
  getProjectedStart,
  LineSeries,
  ResponsiveContainer,
  Root,
  Tooltip,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { createRoot } from "react-dom/client";

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
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>Projected line segments</h1>
      <p id="projected-line-description">
        Dashed line segments are caller-supplied projected estimates.
      </p>
      <Root config={{ total: { label: "Total", color: "#4055ee" } }}>
        <ResponsiveContainer width="100%" height={280}>
          <ComboChart
            data={data}
            aria-label="Monthly totals and estimates"
            aria-describedby="projected-line-description"
          >
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
        </ResponsiveContainer>
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
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<ProjectedLineExample />);
