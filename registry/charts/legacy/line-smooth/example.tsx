"use client";
import * as Chart from "@kind-ui/charts";
import { useEffect, useState } from "react";
import "@kind-ui/charts/styles.css";
import "../styles.css";

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
} satisfies Chart.SeriesConfig;

function VisitorCurveChartComposition({
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
    <Chart.LineChart
      data={data}
      config={config}
      legend={{}}
      margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
      aria-label="Monthly visitors"
    >
      <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
      <Chart.XAxis
        dataKey="period"
        axisLine={false}
        tickLine={false}
        tickMargin={8}
        height={48}
        interval="preserveStartEnd"
      />
      <Chart.YAxis axisLine={false} tickLine={false} tickMargin={8} width={44 + 16 * fontScale} />
      <Chart.LineSeries dataKey="visitors" type={curve} strokeWidth={2} dot={{ r: 2.5 }} />
      <Chart.Tooltip />
    </Chart.LineChart>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function VisitorCurveChart(props: import("react").ComponentProps<typeof VisitorCurveChartComposition>) {
  return (
    <div className="chart-example">
      <VisitorCurveChartComposition {...props} />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Curve types data">
          <caption>{"Visitors"}</caption>
          <thead><tr><th scope="col">{"Month"}</th><th scope="col">{"Visitors"}</th></tr></thead>
          <tbody><tr><th scope="row">{"Jan"}</th><td>{420}</td></tr><tr><th scope="row">{"Feb"}</th><td>{580}</td></tr><tr><th scope="row">{"Mar"}</th><td>{510}</td></tr><tr><th scope="row">{"Apr"}</th><td>{760}</td></tr><tr><th scope="row">{"May"}</th><td>{680}</td></tr><tr><th scope="row">{"Jun"}</th><td>{910}</td></tr><tr><th scope="row">{"Jul"}</th><td>{840}</td></tr><tr><th scope="row">{"Aug"}</th><td>{1070}</td></tr><tr><th scope="row">{"Sep"}</th><td>{960}</td></tr><tr><th scope="row">{"Oct"}</th><td>{1180}</td></tr><tr><th scope="row">{"Nov"}</th><td>{1110}</td></tr><tr><th scope="row">{"Dec"}</th><td>{1360}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
