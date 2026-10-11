"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import "../styles.css";

const rows = ["North", "South", "East", "West"];
const columns = ["Apr", "May", "Jun", "Jul"];
const data: readonly Chart.HeatmapDatum[] = [
  { row: "North", column: "Apr", value: -12 },
  { row: "North", column: "May", value: -6 },
  { row: "North", column: "Jun", value: 0 },
  { row: "North", column: "Jul", value: 14 },
  { row: "South", column: "Apr", value: 4 },
  { row: "South", column: "May", value: 11 },
  { row: "South", column: "Jun", value: 18 },
  { row: "South", column: "Jul", value: 7 },
  { row: "East", column: "Apr", value: -20 },
  { row: "East", column: "May", value: -9 },
  { row: "East", column: "Jun", value: -3 },
  { row: "East", column: "Jul", value: null },
  { row: "West", column: "Apr", value: 2 },
  { row: "West", column: "May", value: 0 },
  { row: "West", column: "Jun", value: 9 },
  { row: "West", column: "Jul", value: 20 },
];
const scale = Chart.createHeatmapScale({
  domain: [-20, 20],
  colors: ["#9a3412", "#fff7ed", "#1e40af"],
});
const formatValue = (value: number) => `${value > 0 ? "+" : ""}${value}%`;

function RegionalHeatmapComposition() {
  return (
    <Chart.HeatmapChart
      rows={rows}
      columns={columns}
      data={data}
      scale={scale}
      formatValue={formatValue}
      missingLabel="No report"
      animate
    >
      <Chart.HeatmapGrid
        caption="Regional orders versus target"
        style={{ borderCollapse: "separate", borderSpacing: 3 }}
        cellProps={() => ({ style: { height: "2rem" } })}
      />
      <Chart.HeatmapLegend label="Difference from monthly target" />
      <Chart.HeatmapTooltip valueAnimation="shuffle" />
      <Chart.HeatmapDataTable
        caption="Regional orders versus target, exact values"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        }}
      />
    </Chart.HeatmapChart>
  );
}

// Editable composition; the chart engine remains in @kind-ui/charts@0.4.0.
export function RegionalHeatmap() {
  return (
    <div className="chart-example">
      <RegionalHeatmapComposition />
      <div className="sr-only">
        <table data-chart-alternative aria-label="Signed comparisons data">
          <caption>{"Regional orders versus monthly target"}</caption>
          <thead><tr><th scope="col">{"Region"}</th><th scope="col">{"Month"}</th><th scope="col">{"Difference (%)"}</th></tr></thead>
          <tbody><tr><th scope="row">{"North"}</th><td>{"Apr"}</td><td>{-12}</td></tr><tr><th scope="row">{"North"}</th><td>{"May"}</td><td>{-6}</td></tr><tr><th scope="row">{"North"}</th><td>{"Jun"}</td><td>{0}</td></tr><tr><th scope="row">{"North"}</th><td>{"Jul"}</td><td>{14}</td></tr><tr><th scope="row">{"South"}</th><td>{"Apr"}</td><td>{4}</td></tr><tr><th scope="row">{"South"}</th><td>{"May"}</td><td>{11}</td></tr><tr><th scope="row">{"South"}</th><td>{"Jun"}</td><td>{18}</td></tr><tr><th scope="row">{"South"}</th><td>{"Jul"}</td><td>{7}</td></tr><tr><th scope="row">{"East"}</th><td>{"Apr"}</td><td>{-20}</td></tr><tr><th scope="row">{"East"}</th><td>{"May"}</td><td>{-9}</td></tr><tr><th scope="row">{"East"}</th><td>{"Jun"}</td><td>{-3}</td></tr><tr><th scope="row">{"East"}</th><td>{"Jul"}</td><td>{"No report"}</td></tr><tr><th scope="row">{"West"}</th><td>{"Apr"}</td><td>{2}</td></tr><tr><th scope="row">{"West"}</th><td>{"May"}</td><td>{0}</td></tr><tr><th scope="row">{"West"}</th><td>{"Jun"}</td><td>{9}</td></tr><tr><th scope="row">{"West"}</th><td>{"Jul"}</td><td>{20}</td></tr></tbody>
        </table>
      </div>
    </div>
  );
}
