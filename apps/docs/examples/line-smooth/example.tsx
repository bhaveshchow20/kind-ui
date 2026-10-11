"use client";
import { LineChart, type SeriesConfig } from "@kind-ui/charts";
import { useEffect, useState } from "react";

const data = [
  { period: "Jan", visitors: 420 },
  { period: "Feb", visitors: 580 },
  { period: "Mar", visitors: 510 },
  { period: "Apr", visitors: 760 },
  { period: "May", visitors: 680 },
  { period: "Jun", visitors: 910 },
  { period: "Jul", visitors: 840 },
  { period: "Aug", visitors: 1070 },
  { period: "Sep", visitors: 960 },
  { period: "Oct", visitors: 1180 },
  { period: "Nov", visitors: 1110 },
  { period: "Dec", visitors: 1360 },
];
const config = {
  visitors: { label: "Visitors", color: "#733bff" },
} satisfies SeriesConfig;

export function VisitorCurveChart({
  curve = "monotone",
}: {
  curve?: "monotone" | "linear" | "stepAfter";
} = {}) {
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
    <LineChart
      data={data}
      config={config}
      margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
      aria-label="Monthly visitors"
    >
      <LineChart.Grid vertical={false} strokeDasharray="3 3" stroke="#ccc" />
      <LineChart.XAxis
        dataKey="period"
        axisLine={false}
        tickLine={false}
        tickMargin={8}
        height={48}
        interval="preserveStartEnd"
        tick={{ fill: "#666" }}
      />
      <LineChart.YAxis
        axisLine={false}
        tickLine={false}
        tickMargin={8}
        width={44 + 16 * fontScale}
        tick={{ fill: "#666" }}
      />
      <LineChart.Series dataKey="visitors" type={curve} strokeWidth={2} dot={{ r: 2.5 }} />
      <LineChart.Tooltip />
      <LineChart.Legend />
    </LineChart>
  );
}
