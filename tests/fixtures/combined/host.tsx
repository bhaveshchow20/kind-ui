// Host-only proof that both families coexist through packed public exports.
import * as Chart from "@kind-ui/charts";
import { XAxis, YAxis } from "@kind-ui/charts";
import { useState } from "react";

const data = [
  { category: "A", value: 8, other: 4 },
  { category: "B", value: 12, other: 6 },
  { category: "C", value: 6, other: 3 },
];
function Family({ family }: { family: "area" | "bar" }) {
  const [visible, setVisible] = useState(["value", "other"]);
  const [material, setMaterial] = useState<Chart.AreaMaterial>("plain");
  const ChartComponent = family === "area" ? Chart.AreaChart : Chart.BarChart;
  const Series = family === "area" ? Chart.AreaSeries : Chart.BarSeries;
  return (
    <section aria-label={family}>
      <select
        aria-label="Finish"
        value={material}
        onChange={(event) => setMaterial(event.target.value as Chart.AreaMaterial)}
      >
        {["plain", "clay", "glow"].map((value) => (
          <option key={value} value={value}>
            {value === "plain" ? "Default" : value}
          </option>
        ))}
      </select>
      <Chart.Root
        config={{
          value: { label: "Value", color: "#db7093" },
          other: { label: "Other", color: "#7c6ff0" },
        }}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <Chart.Legend />
        <ChartComponent
          width={400}
          height={220}
          data={data}
          animate={{ revealDurationMs: 5000 }}
          aria-label={`${family} chart`}
        >
          <XAxis dataKey="category" />
          <YAxis domain={[0, 16]} />
          <Series dataKey="value" material={material} fillOpacity={0.65} />
          <Series dataKey="other" material={material} fillOpacity={0.65} />
          <Chart.Tooltip />
        </ChartComponent>
      </Chart.Root>
    </section>
  );
}
export function CombinedHost() {
  return (
    <>
      <Family family="area" />
      <Family family="bar" />
    </>
  );
}
