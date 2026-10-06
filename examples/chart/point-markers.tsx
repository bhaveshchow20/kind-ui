import "@kind-ui/charts/styles.css";
import { LineChart, type PointStyle } from "@kind-ui/charts";
import { type CSSProperties, useState } from "react";
import { createRoot } from "react-dom/client";

const data = [
  { month: "Jan", total: 4 },
  { month: "Feb", total: 9 },
  { month: "Mar", total: 6 },
];
const variants: PointStyle[] = ["default", "border", "colored-border"];
export function MarkerGallery() {
  const [dark, setDark] = useState(false);
  return (
    <main
      style={
        {
          "--gallery-series": dark ? "#9eaaff" : "#4055ee",
          "--kind-ui-chart-marker-surface": dark ? "#172033" : "white",
          background: dark ? "#172033" : "white",
          color: dark ? "white" : "#172033",
          padding: 24,
        } as CSSProperties
      }
    >
      <button type="button" onClick={() => setDark(!dark)}>
        Toggle theme
      </button>
      <h1>Point markers</h1>
      <p>Focus a chart and use arrow keys, or move the pointer, to inspect values.</p>
      {variants.map((variant) => (
        <section key={variant}>
          <h2>{variant}</h2>
          <LineChart
            config={{ total: { label: "Total", color: "var(--gallery-series)" } }}
            data={data}
            xDataKey="month"
            aria-label={`${variant} markers`}
            series={[
              {
                seriesKey: "total",
                dataKey: "total",
                pointStyle: variant,
                activePointStyle: variant,
              },
            ]}
          />
        </section>
      ))}
      <table>
        <caption>Monthly totals</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td>{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<MarkerGallery />);
