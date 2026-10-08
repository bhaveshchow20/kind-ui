"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { period: "Fiction", print: 184, digital: 116 },
  { period: "History", print: 128, digital: 72 },
  { period: "Science", print: 156, digital: 104 },
  { period: "Arts", print: 112, digital: 88 },
  { period: "Travel", print: 96, digital: 64 },
];
const config = {
  print: { label: "Print", color: "#733bff" },
  digital: { label: "Digital", color: "#14a39a" },
} satisfies Chart.SeriesConfig;

export function LibraryLoansChart({
  arrangement = "grouped",
}: {
  arrangement?: "grouped" | "stacked";
} = {}) {
  const stackId = arrangement === "stacked" ? "loans" : undefined;
  return (
    <figure style={{ margin: 0 }}>
      <Chart.Root
        config={config}
        interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
      >
        <Chart.Legend />
        <Chart.ResponsiveContainer width="100%" height={280}>
          <Chart.BarChart
            data={data}
            animate
            accessibilityLayer
            emphasis="category"
            barGap={4}
            margin={{ top: 20, right: 32, bottom: 8, left: 0 }}
            aria-label="Library loans by subject and format"
          >
            <Chart.CartesianGrid vertical={false} strokeDasharray="3 3" />
            <Chart.XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tickMargin={16}
              height={56}
              interval="preserveStartEnd"
              minTickGap={32}
            />
            <Chart.YAxis axisLine={false} tickLine={false} tickMargin={10} width={72} />
            <Chart.BarSeries dataKey="print" stackId={stackId} maxBarSize={32} />
            <Chart.BarSeries dataKey="digital" stackId={stackId} maxBarSize={32} />
            <Chart.Tooltip />
          </Chart.BarChart>
        </Chart.ResponsiveContainer>
      </Chart.Root>
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
        <table data-chart-alternative aria-label="Library loans by subject and format data">
          <caption>Library loans by subject and format</caption>
          <thead>
            <tr>
              <th scope="col">Subject</th>
              <th scope="col">Print</th>
              <th scope="col">Digital</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.period}>
                <th scope="row">{row.period}</th>
                <td>{row.print}</td>
                <td>{row.digital}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
