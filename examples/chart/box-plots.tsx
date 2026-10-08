import * as Chart from "@kind-ui/charts";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  type TooltipRenderProps as TooltipContentProps,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { useState } from "react";
import { createRoot } from "react-dom/client";

import "@kind-ui/charts/styles.css";
import "./box-plots.css";

type Row = { category: string; summary: Chart.BoxPlotSummary | null };
const latency: Row[] = [
  {
    category: "Search",
    summary: { lowerWhisker: 18, q1: 32, median: 44, q3: 61, upperWhisker: 84, outliers: [112] },
  },
  {
    category: "Checkout",
    summary: { lowerWhisker: 26, q1: 46, median: 68, q3: 88, upperWhisker: 126, outliers: [154] },
  },
  {
    category: "Profile",
    summary: { lowerWhisker: 12, q1: 22, median: 31, q3: 46, upperWhisker: 72 },
  },
];
const changes: Row[] = [
  {
    category: "North",
    summary: {
      lowerWhisker: -16,
      q1: -8,
      median: -2,
      q3: 5,
      upperWhisker: 14,
      outliers: [-26, 24],
    },
  },
  { category: "South", summary: { lowerWhisker: -7, q1: 2, median: 8, q3: 13, upperWhisker: 21 } },
  { category: "West", summary: { lowerWhisker: -12, q1: -5, median: 1, q3: 8, upperWhisker: 18 } },
];
const degenerate: Row[] = [
  { category: "Stable", summary: { lowerWhisker: 5, q1: 5, median: 5, q3: 5, upperWhisker: 5 } },
  { category: "Zero", summary: { lowerWhisker: 0, q1: 0, median: 0, q3: 0, upperWhisker: 0 } },
  { category: "Pending", summary: null },
];
const fields = ["lowerWhisker", "q1", "median", "q3", "upperWhisker"] as const;
const labels = ["Lower whisker", "Q1", "Median", "Q3", "Upper whisker"];
function Summary({
  active,
  payload,
  label,
  unit,
}: Partial<TooltipContentProps> & { unit: string }) {
  const row = payload?.[0]?.payload as Row | undefined;
  if (!active || !row?.summary) return null;
  const summary = row.summary;
  return (
    <div data-kind-ui="chart-tooltip">
      <strong>{label}</strong>
      <dl>
        {fields.map((field, i) => (
          <div key={field}>
            <dt>{labels[i]}</dt>
            <dd>
              {summary[field]} {unit}
            </dd>
          </div>
        ))}
        <div>
          <dt>Outliers</dt>
          <dd>{summary.outliers?.map((v) => `${v} ${unit}`).join(", ") || "None"}</dd>
        </div>
      </dl>
    </div>
  );
}
function Distribution({
  title,
  rows,
  unit,
  horizontal = false,
  color,
  id,
  animate,
  material,
}: {
  title: string;
  rows: Row[];
  unit: string;
  horizontal?: boolean;
  color: string;
  id: string;
  animate: boolean;
  material: Chart.BoxPlotMaterial;
}) {
  const [visible, setVisible] = useState(["spread"]);
  return (
    <Chart.Root
      config={{ spread: { label: `Distribution · ${unit}`, color } }}
      visibleSeries={visible}
      onVisibleSeriesChange={setVisible}
    >
      <Chart.Legend aria-label={`${title} focus`} />
      <ResponsiveContainer width="100%" height={270}>
        <Chart.BoxPlotChart
          data={rows}
          animate={animate}
          layout={horizontal ? "vertical" : "horizontal"}
          aria-label={title}
          aria-describedby={`${id}-note`}
          margin={{ top: 20, right: 18, bottom: 12, left: 0 }}
        >
          <CartesianGrid stroke="#e1e6e3" vertical={horizontal} horizontal={!horizontal} />
          <XAxis
            type={horizontal ? "number" : "category"}
            {...(!horizontal ? { dataKey: "category" } : {})}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#52635c", fontSize: 11 }}
            {...(horizontal ? { domain: ["dataMin", "dataMax"] } : {})}
          />
          <YAxis
            type={horizontal ? "category" : "number"}
            {...(horizontal ? { dataKey: "category" } : {})}
            width={horizontal ? 56 : 38}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#52635c", fontSize: 11 }}
            {...(!horizontal ? { domain: ["dataMin", "dataMax"] } : {})}
          />
          <ReferenceLine {...(horizontal ? { x: 0 } : { y: 0 })} stroke="#b1bcb5" />
          <Chart.Tooltip content={<Summary unit={unit} />} maxWidth={250} />
          <Chart.BoxPlotSeries<Row>
            dataKey="summary"
            seriesKey="spread"
            barSize={32}
            material={material}
            fillOpacity={0.65}
          >
            {rows.map((row) => (
              <Cell key={row.category} fill={color} />
            ))}
          </Chart.BoxPlotSeries>
        </Chart.BoxPlotChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
function Table({ rows, title, unit }: { rows: Row[]; title: string; unit: string }) {
  return (
    <div className="table-scroll">
      <table>
        <caption>
          {title} · all values in {unit}
        </caption>
        <thead>
          <tr>
            <th scope="col">Group</th>
            {labels.map((label) => (
              <th scope="col" key={label}>
                {label}
              </th>
            ))}
            <th scope="col">Outliers</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ category, summary }) => (
            <tr key={category}>
              <th scope="row">{category}</th>
              {fields.map((field) => (
                <td key={field}>{summary?.[field] ?? "Missing"}</td>
              ))}
              <td>{summary ? summary.outliers?.join(", ") || "None" : "Missing"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Recipes() {
  const [material, setMaterial] = useState<Chart.BoxPlotMaterial>("plain");
  const [animate, setAnimate] = useState(false);
  return (
    <main>
      <header>
        <a href="./">kind / charts</a>
        <span className="tag">BOX PLOT STUDIES</span>
      </header>
      <div className="intro">
        <div>
          <p className="eyebrow">DISTRIBUTION, WITHOUT THE GUESSWORK</p>
          <h1>
            Spread tells
            <br />
            the story.
          </h1>
          <p>
            Compare the middle, the tails, and the observations beyond them.
            <br className="desktop" /> Explicit statistics. Honest quantitative scales.
          </p>
        </div>
        <button type="button" aria-pressed={animate} onClick={() => setAnimate(!animate)}>
          Motion {animate ? "on" : "off"}
        </button>
      </div>
      <nav aria-label="Box finish">
        {(["plain", "clay", "glow"] as const).map((finish) => (
          <button
            type="button"
            key={finish}
            aria-pressed={material === finish}
            onClick={() => setMaterial(finish)}
          >
            {finish === "plain" ? "Default" : finish}
          </button>
        ))}
      </nav>
      <div className="cards">
        <article>
          <div className="card-heading">
            <span>01 / VERTICAL</span>
            <span>ms</span>
          </div>
          <h2>Typical is only part of it.</h2>
          <p id="latency-note">Request latency by endpoint. Circles show supplied outliers.</p>
          <Distribution
            title="Request latency"
            rows={latency}
            unit="ms"
            color="#16756c"
            id="latency"
            animate={animate}
            material={material}
          />
          <div className="card-foot">
            <span>Box = Q1–Q3</span>
            <span>Center line = median</span>
          </div>
        </article>
        <article>
          <div className="card-heading">
            <span>02 / HORIZONTAL</span>
            <span>pp</span>
          </div>
          <h2>Both sides of zero.</h2>
          <p id="changes-note">Regional change in percentage points, including negative values.</p>
          <Distribution
            title="Regional change"
            rows={changes}
            unit="pp"
            horizontal
            color="#b76c38"
            id="changes"
            animate={animate}
            material={material}
          />
          <div className="card-foot">
            <span>Whiskers = supplied endpoints</span>
            <span>Zero = reference</span>
          </div>
        </article>
      </div>
      <article className="edge">
        <div>
          <span className="eyebrow">03 / EXACT & MISSING</span>
          <h2>Small spread. No invention.</h2>
          <p id="edge-note">
            Stable and Zero have identical quartiles and whiskers, so their boxes collapse to lines.
            Pending has no summary and no mark.
          </p>
          <p className="fine">
            Quartiles, whiskers, and outlier classification are computed by the caller. These
            illustrative summaries do not imply a raw-sample convention.
          </p>
        </div>
        <Distribution
          title="Exact and missing values"
          rows={degenerate}
          unit="units"
          color="#596f9d"
          id="edge"
          animate={animate}
          material={material}
        />
      </article>
      <section className="tables" aria-label="Full chart data">
        <p className="eyebrow">THE NUMBERS, ALWAYS AVAILABLE</p>
        <h2>Every supplied statistic.</h2>
        <p>
          These tables remain available when a chart series is hidden. Keyboard users can focus the
          chart and use arrow keys for the tooltip; the tables provide the complete alternative.
        </p>
        <Table rows={latency} title="Request latency" unit="ms" />
        <Table rows={changes} title="Regional change" unit="pp" />
        <Table rows={degenerate} title="Exact and missing" unit="units" />
      </section>
      <footer>Kind UI · caller-owned statistics / native Recharts axes / optional Motion</footer>
    </main>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<Recipes />);
