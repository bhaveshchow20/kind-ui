import { LineChart } from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import "./loading.css";

const config = { sales: { label: "Sales", color: "#568577" } };
const data = [
  { day: "Mon", sales: 15 },
  { day: "Tue", sales: 48 },
  { day: "Wed", sales: 32 },
  { day: "Thu", sales: 67 },
  { day: "Fri", sales: 44 },
];
function Preview() {
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(true);
  return (
    <main>
      <p className="eyebrow">Kind UI / Line loading study</p>
      <h1>A chart-shaped pause.</h1>
      <p>
        A decorative curve reveals horizontally, fades away, and returns with a fresh shape.
        It never uses chart data. Reduced motion shows a static silhouette.
      </p>
      <nav aria-label="Preview controls">
        <button type="button" onClick={() => setLoading(true)}>
          Replay loading
        </button>
        <button
          type="button"
          onClick={() => {
            setEmpty(false);
            setLoading(false);
          }}
        >
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
          Empty input data
        </label>
      </nav>
      <article>
        <LineChart
          config={config}
          data={empty ? [] : data}
          xDataKey="day"
          aria-label="Weekly sales"
          height={320}
          loading={loading}
          loadingLabel="Loading weekly sales"
          animate={{ revealDurationMs: 650 }}
          legend={false}
        />
      </article>
      <p>
        {loading
          ? "Loading uses the same design with empty or populated data."
          : empty
            ? "Loaded: no results."
            : "Loaded: actual sales data."}
      </p>
    </main>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<Preview />);
