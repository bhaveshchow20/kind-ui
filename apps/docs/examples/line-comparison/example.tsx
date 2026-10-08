"use client";
import * as Chart from "@kind-ui/charts";
import { useEffect, useState } from "react";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Jan", actual: 42, target: 48 },
  { period: "Feb", actual: 58, target: 54 },
  { period: "Mar", actual: 51, target: 60 },
  { period: "Apr", actual: 76, target: 66 },
  { period: "May", actual: 68, target: 72 },
  { period: "Jun", actual: 91, target: 78 },
  { period: "Jul", actual: 84, target: 84 },
  { period: "Aug", actual: 107, target: 90 },
  { period: "Sep", actual: 96, target: 96 },
  { period: "Oct", actual: 118, target: 102 },
  { period: "Nov", actual: 111, target: 108 },
  { period: "Dec", actual: 136, target: 114 },
];
const config = {
  actual: { label: "Revenue", color: "#733bff", formatValue: (value: unknown) => `$${value}k` },
  target: { label: "Target", color: "#119548", formatValue: (value: unknown) => `$${value}k` },
} satisfies Chart.SeriesConfig;

export function RevenueComparisonChart() {
  const [fontScale, setFontScale] = useState(1);
  useEffect(() => {
    const update = () =>
      setFontScale(
        Math.max(1, Number.parseFloat(getComputedStyle(document.documentElement).fontSize) / 16),
      );
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(document.documentElement);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <figure style={{ margin: 0 }}>
      <Chart.LineChart
        data={data}
        config={config}
        xDataKey="period"
        xAxis={{ tickMargin: 12, height: 48, interval: "preserveStartEnd" }}
        margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
        aria-label="Revenue and target in thousands of dollars"
        yAxis={{
          tickMargin: 12,
          width: 72 + 16 * fontScale,
          tickFormatter: (value) => `$${value}k`,
        }}
        series={[
          { seriesKey: "actual", dataKey: "actual" },
          { seriesKey: "target", dataKey: "target", type: "linear", strokeDasharray: "5 5" },
        ]}
      />
      <div
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        <table data-chart-alternative aria-label="Revenue and target in thousands of dollars data">
          <caption>Revenue and target in thousands of dollars</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Revenue ($k)</th>
              <th scope="col">Target ($k)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.period}>
                <th scope="row">{row.period}</th>
                <td>{row.actual}</td>
                <td>{row.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
