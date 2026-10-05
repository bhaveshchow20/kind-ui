"use client";

import { useId, useState } from "react";
import { areaChartData, KindAreaChart } from "@/components/charts/area-chart";
import { barChartData, KindBarChart } from "@/components/charts/bar-chart";
import { KindLineChart, lineChartData } from "@/components/charts/line-chart";
import "./kind-chart.css";

export function ChartsDashboard() {
  const [period, setPeriod] = useState("half");
  const id = useId();
  const start = period === "quarter" ? 3 : 0;
  return (
    <section className="kind-dashboard" aria-labelledby={`${id}-title`}>
      <header className="kind-dashboard-header">
        <div>
          <p className="kind-recipe-eyebrow">YOUR BUSINESS, IN FOCUS</p>
          <h1 id={`${id}-title`}>Small signals. Clear direction.</h1>
          <p>A little perspective for your next big decision.</p>
        </div>
        <label className="kind-dashboard-filter">
          Reporting period
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="half">January – June</option>
            <option value="quarter">April – June</option>
          </select>
        </label>
      </header>
      <div className="kind-dashboard-grid">
        <KindLineChart data={lineChartData.slice(start)} />
        <KindAreaChart data={areaChartData.slice(start)} />
        <KindBarChart data={barChartData.slice(start)} />
      </div>
    </section>
  );
}
