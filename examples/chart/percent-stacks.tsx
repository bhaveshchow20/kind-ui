import * as Chart from "@kind-ui/charts";

type Row = {
  category: string;
  first: number | null;
  second: number | null;
  latency: number;
};
const data: Row[] = [
  { category: "Mon", first: 1, second: 3, latency: 8 },
  { category: "Tue", first: 0, second: 0, latency: 4 },
  { category: "Wed", first: null, second: 2, latency: 6 },
];
const percent = Chart.createPercentStack({
  values: (entry) => {
    if (entry.dataKey !== "first" && entry.dataKey !== "second") return undefined;
    const row = entry.payload as Row | undefined;
    return row ? [row.first, row.second] : undefined;
  },
});

/** Native geometry, explicitly scoped formatting, and an unchanged raw data alternative. */
export function PercentStacks() {
  return (
    <>
      {(["Bar", "Horizontal Bar", "Area", "Combo"] as const).map((family) => {
        const horizontal = family === "Horizontal Bar";
        const Engine =
          family === "Area"
            ? Chart.AreaChart
            : family === "Combo"
              ? Chart.ComboChart
              : Chart.BarChart;
        const Series = family === "Area" ? Chart.AreaSeries : Chart.BarSeries;
        return (
          <section key={family} aria-label={`Percent ${family}`}>
            <h2>Percent {family}</h2>
            <Chart.Root
              config={{
                first: { label: "First", color: "#2563eb" },
                second: { label: "Second", color: "#15803d" },
                latency: { label: "Latency", color: "#9333ea" },
              }}
            >
              <Chart.ResponsiveContainer width="100%" height={240}>
                <Engine
                  data={data}
                  stackOffset="expand"
                  layout={horizontal ? "vertical" : "horizontal"}
                  accessibilityLayer
                >
                  {horizontal ? (
                    <>
                      <Chart.YAxis type="category" dataKey="category" />
                      <Chart.XAxis
                        type="number"
                        domain={[0, 1]}
                        ticks={[0, 0.5, 1]}
                        tickFormatter={percent.tickFormatter}
                      />
                    </>
                  ) : (
                    <>
                      <Chart.XAxis dataKey="category" />
                      <Chart.YAxis
                        yAxisId="share"
                        domain={[0, 1]}
                        ticks={[0, 0.5, 1]}
                        tickFormatter={percent.tickFormatter}
                      />
                    </>
                  )}
                  <Series dataKey="first" stackId="parts" yAxisId={horizontal ? 0 : "share"} />
                  <Series dataKey="second" stackId="parts" yAxisId={horizontal ? 0 : "share"} />
                  {family === "Combo" && (
                    <>
                      <Chart.YAxis yAxisId="latency" orientation="right" domain={[0, 10]} />
                      <Chart.LineSeries dataKey="latency" yAxisId="latency" />
                    </>
                  )}
                  <Chart.Tooltip normalizedValue={percent.normalizedValue} />
                </Engine>
              </Chart.ResponsiveContainer>
            </Chart.Root>
            <table aria-label={`${family} raw values`}>
              <caption>Original values; percentages appear in the chart tooltip</caption>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>First</th>
                  <th>Second</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.category}>
                    <th>{row.category}</th>
                    <td>{row.first ?? "No data"}</td>
                    <td>{row.second ?? "No data"}</td>
                    <td>{row.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </>
  );
}
