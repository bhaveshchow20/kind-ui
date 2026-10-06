import * as Chart from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import "./loading.css";

const config = { sales: { label: "Sales", color: "#568577" } };
const data = [
  { month: "Jan", sales: 24 },
  { month: "Feb", sales: 42 },
  { month: "Mar", sales: 34 },
  { month: "Apr", sales: 63 },
  { month: "May", sales: 52 },
];
function Preview() {
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [wide, setWide] = useState(true);
  const [events, setEvents] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [partialSize, setPartialSize] = useState(false);
  const rows = empty ? [] : data;
  return (
    <main>
      <p className="eyebrow">Kind UI / loading study</p>
      <h1>A quiet pause, then your chart.</h1>
      <p>
        The loading prop keeps real charts mounted. Use Load to finish immediately, or interrupt the
        reveal with Replay. Your operating system’s reduced motion preference disables the pulse and
        fade.
      </p>
      <nav aria-label="Preview controls">
        <button type="button" onClick={() => setLoading(true)}>
          Replay loading
        </button>
        <button type="button" onClick={() => setLoading(false)}>
          Load data
        </button>
        <button type="button" onClick={() => setLoading((value) => !value)}>
          Toggle loading
        </button>
        <label>
          <input
            type="checkbox"
            checked={empty}
            onChange={(event) => setEmpty(event.target.checked)}
          />{" "}
          Empty result
        </label>
        <label>
          <input
            type="checkbox"
            checked={wide}
            onChange={(event) => setWide(event.target.checked)}
          />{" "}
          Wide layout
        </label>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />{" "}
          Enable loading prop
        </label>
        <label>
          <input
            type="checkbox"
            checked={partialSize}
            onChange={(event) => setPartialSize(event.target.checked)}
          />{" "}
          Partial percentage size
        </label>
      </nav>
      <p role="status">
        {loading ? "Request pending" : empty ? "Loaded: no results" : "Loaded: five months"}
      </p>
      <section className="charts" style={{ maxWidth: wide ? 900 : 520 }}>
        <article>
          <h2>Configured line</h2>
          <Chart.LineChart
            loading={enabled ? loading : undefined}
            loadingLabel="Loading monthly sales"
            config={config}
            data={rows}
            xDataKey="month"
            aria-label="Monthly sales"
            height={280}
            animate={false}
          />
          {empty && !loading && <p>No sales found.</p>}
        </article>
        <article>
          <h2>Composed bar</h2>
          <Chart.Root config={config}>
            <Chart.ResponsiveContainer width="100%" height={280}>
              <div style={{ width: "100%", height: 280 }}>
                <Chart.BarChart
                  loading={enabled ? loading : undefined}
                  loadingLabel="Loading sales bars"
                  style={partialSize ? { width: "50%", height: "50%" } : undefined}
                  aria-label="Monthly sales bars"
                  data={rows}
                  animate={false}
                  onClick={() => setEvents((value) => value + 1)}
                >
                  <Chart.CartesianGrid vertical={false} stroke="#e1e6e2" />
                  <Chart.XAxis dataKey="month" />
                  <Chart.YAxis domain={[0, 80]} />
                  <Chart.BarSeries dataKey="sales" seriesKey="sales" />
                  <Chart.Tooltip />
                </Chart.BarChart>
              </div>
            </Chart.ResponsiveContainer>
            <Chart.Legend />
            {empty && !loading && <p>No sales found.</p>}
          </Chart.Root>
          <p>
            Consumer click events: <output>{events}</output>
          </p>
        </article>
      </section>
      {!loading && (
        <table>
          <caption>Monthly sales data{empty ? " — no results" : ""}</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Sales</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <th scope="row">{row.month}</th>
                <td>{row.sales}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>
        Legends remain available while chart content loads. This draft supports line and bar loading
        props; it does not reset their native entrance animation. Keep an accessible data
        alternative alongside your chart.
      </p>
    </main>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<Preview />);
