import * as Chart from "@kind-ui/charts";
import { type CSSProperties, type ReactNode, useState } from "react";

const config = {
  value: { label: "Value", color: "#733bff" },
  other: { label: "Other", color: "#159c91" },
} satisfies Chart.SeriesConfig;
const categoryConfig = {
  A: { label: "A", color: "#733bff" },
  B: { label: "B", color: "#159c91" },
  C: { label: "C", color: "#447fd1" },
};
const data = [
  { label: "A", value: 4, other: 2 },
  { label: "B", value: 8, other: 5 },
  { label: "C", value: 3, other: 6 },
];
const value = (row: (typeof data)[number]) => row.value;
const bins = Chart.binHistogram([1, 2, 3, 5, 7], [0, 4, 8]).bins;
const waterfall = Chart.computeWaterfallData([
  { id: "a", label: "A", kind: "start", value: 4 },
  { id: "b", label: "B", kind: "delta", value: 2 },
]);
const flow = {
  nodes: [
    { id: "source one", name: "Source" },
    { id: "target two", name: "Target" },
  ],
  links: [{ id: "flow", source: "source one", target: "target two", value: 5 }],
} satisfies Chart.SankeyFlowData;
const flowConfig = {
  "source one": { label: "Source", color: "#733bff" },
  "target two": { label: "Target", color: "#159c91" },
};
const heatScale = Chart.createHeatmapScale({ domain: [0, 10], colors: ["#eff6ff", "#2563eb"] });
function Parts({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
function Group({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section data-compound={name} style={{ width: "100%" }}>
      <h2>{name}</h2>
      {children}
    </section>
  );
}
export function FamilyCompositions() {
  const [mounted, setMounted] = useState(true);
  const [small, setSmall] = useState(false);
  const [omit, setOmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(false);
  const [flowNodes, setFlowNodes] = useState(true);
  const [flowLinks, setFlowLinks] = useState(true);
  const [visible, setVisible] = useState(["value", "other"]);
  const frame = { config, data, height: 200, animate: true, accessibilityLayer: true };
  return (
    <div data-compound-suite="" style={{ width: small ? 360 : 520 }}>
      <button type="button" onClick={() => setSmall(!small)}>
        Compound resize
      </button>
      <button type="button" onClick={() => setOmit(!omit)}>
        Compound omit
      </button>
      <button type="button" onClick={() => setLoading(!loading)}>
        Compound loading
      </button>
      <button type="button" onClick={() => setTheme(!theme)}>
        Compound theme
      </button>
      <button type="button" onClick={() => setFlowNodes(!flowNodes)}>
        Compound flow nodes
      </button>
      <button type="button" onClick={() => setFlowLinks(!flowLinks)}>
        Compound flow links
      </button>
      <button type="button" onClick={() => setMounted(!mounted)}>
        Compound mount
      </button>
      {mounted && (
        <>
          <Group name="line">
            <Chart.LineChart
              {...frame}
              aria-label="Compound line"
              ref={(node) => {
                if (node) node.dataset.compoundChartRef = "attached";
              }}
              loading={loading}
              visibleSeries={visible}
              onVisibleSeriesChange={setVisible}
              rootProps={{
                style: { "--color-value": theme ? "#dc2626" : "#733bff" } as CSSProperties,
                interaction: {
                  kind: "series",
                  mode: "visibility",
                  eligibleKeys: ["value", "other"],
                },
              }}
            >
              <Parts>
                <>
                  <Chart.LineChart.Grid />
                  <Chart.LineChart.XAxis dataKey="label" />
                  <Chart.LineChart.YAxis />
                  {!omit && (
                    <Chart.LineChart.Series
                      dataKey={value}
                      seriesKey="value"
                      type="monotone"
                      dot={false}
                    />
                  )}
                  <Chart.LineChart.Tooltip />
                  <Chart.LineChart.Legend
                    ref={(node) => {
                      if (node) node.dataset.compoundRef = "legend";
                    }}
                  />
                </>
              </Parts>
            </Chart.LineChart>
          </Group>
          <Group name="area">
            <Chart.AreaChart {...frame} aria-label="Compound area">
              <Parts>
                <Chart.AreaChart.Grid />
                <Chart.AreaChart.XAxis dataKey="label" />
                <Chart.AreaChart.YAxis />
                <Chart.AreaChart.Series dataKey="value" />
                <Chart.AreaChart.Tooltip />
                <Chart.AreaChart.Legend />
              </Parts>
            </Chart.AreaChart>
          </Group>
          <Group name="bar">
            <Chart.BarChart {...frame} aria-label="Compound bar">
              <Parts>
                <Chart.BarChart.Grid />
                <Chart.BarChart.XAxis dataKey="label" />
                <Chart.BarChart.YAxis />
                <Chart.BarChart.Series dataKey="value" />
                <Chart.BarChart.Tooltip />
                <Chart.BarChart.Legend />
              </Parts>
            </Chart.BarChart>
          </Group>
          <Group name="combo">
            <Chart.ComboChart {...frame} aria-label="Compound combo">
              <Parts>
                <Chart.ComboChart.Grid />
                <Chart.ComboChart.XAxis dataKey="label" />
                <Chart.ComboChart.YAxis />
                <Chart.ComboChart.Bar dataKey="value" />
                <Chart.ComboChart.Line dataKey="other" />
                <Chart.ComboChart.Tooltip />
                <Chart.ComboChart.Legend />
              </Parts>
            </Chart.ComboChart>
          </Group>
          <Group name="pie">
            <Chart.PieChart
              {...frame}
              config={categoryConfig}
              aria-label="Compound pie"
              defaultPinnedCategory="B"
            >
              <Parts>
                <Chart.PieChart.Series
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  categoryKey="label"
                />
                <Chart.PieChart.Tooltip />
                <Chart.PieChart.Legend />
              </Parts>
            </Chart.PieChart>
          </Group>
          <Group name="radar">
            <Chart.RadarChart {...frame} aria-label="Compound radar">
              <Parts>
                <Chart.RadarChart.Grid />
                <Chart.RadarChart.AngleAxis dataKey="label" />
                <Chart.RadarChart.RadiusAxis />
                <Chart.RadarChart.Series dataKey="value" />
                <Chart.RadarChart.Tooltip />
                <Chart.RadarChart.Legend />
              </Parts>
            </Chart.RadarChart>
          </Group>
          <Group name="radial">
            <Chart.RadialBarChart {...frame} aria-label="Compound radial">
              <Parts>
                <Chart.RadialBarChart.AngleAxis type="number" domain={[0, 10]} tick={false} />
                <Chart.RadialBarChart.RadiusAxis type="category" dataKey="label" tick={false} />
                <Chart.RadialBarChart.Series dataKey="value" />
                <Chart.RadialBarChart.Tooltip />
                <Chart.RadialBarChart.Legend />
              </Parts>
            </Chart.RadialBarChart>
          </Group>
          <Group name="scatter">
            <Chart.ScatterChart {...frame} aria-label="Compound scatter">
              <Parts>
                <Chart.ScatterChart.Grid />
                <Chart.ScatterChart.XAxis dataKey="value" />
                <Chart.ScatterChart.YAxis dataKey="other" />
                <Chart.ScatterChart.ZAxis />
                <Chart.ScatterChart.Series data={data} seriesKey="value" />
                <Chart.ScatterChart.Tooltip />
                <Chart.ScatterChart.Legend />
              </Parts>
            </Chart.ScatterChart>
          </Group>
          <Group name="waterfall">
            <Chart.WaterfallChart
              config={config}
              data={waterfall}
              height={200}
              animate
              aria-label="Compound waterfall"
            >
              <Parts>
                <Chart.WaterfallChart.XAxis dataKey="label" />
                <Chart.WaterfallChart.YAxis />
                <Chart.WaterfallChart.Connectors data={waterfall} seriesKey="value" />
                <Chart.WaterfallChart.Series seriesKey="value" />
                <Chart.WaterfallChart.Tooltip />
                <Chart.WaterfallChart.Legend />
              </Parts>
            </Chart.WaterfallChart>
          </Group>
          <Group name="histogram">
            <Chart.HistogramChart
              config={config}
              bins={bins}
              measure="count"
              height={200}
              animate
              aria-label="Compound histogram"
            >
              <Parts>
                <Chart.HistogramChart.Grid />
                <Chart.HistogramChart.XAxis />
                <Chart.HistogramChart.YAxis />
                <Chart.HistogramChart.Series seriesKey="value" />
                <Chart.HistogramChart.Tooltip />
                <Chart.HistogramChart.Legend />
              </Parts>
            </Chart.HistogramChart>
          </Group>
          <Group name="box">
            <Chart.BoxPlotChart
              config={config}
              data={[
                {
                  label: "A",
                  summary: { lowerWhisker: 1, q1: 2, median: 3, q3: 4, upperWhisker: 5 },
                },
              ]}
              height={200}
              animate
              aria-label="Compound box"
            >
              <Parts>
                <Chart.BoxPlotChart.XAxis dataKey="label" />
                <Chart.BoxPlotChart.YAxis />
                <Chart.BoxPlotChart.Series<{ label: string; summary: Chart.BoxPlotSummary }>
                  dataKey="summary"
                  seriesKey="value"
                />
                <Chart.BoxPlotChart.Tooltip />
                <Chart.BoxPlotChart.Legend />
              </Parts>
            </Chart.BoxPlotChart>
          </Group>
          <Group name="activity">
            <Chart.ActivityRings
              config={config}
              rings={[
                { key: "value", value: 70 },
                { key: "other", value: 40 },
              ]}
              height={200}
              animate
              aria-label="Compound activity"
            >
              <Parts>
                <Chart.ActivityRings.Series>
                  <Chart.ActivityRings.Labels />
                </Chart.ActivityRings.Series>
                <Chart.ActivityRings.Tooltip />
                <Chart.ActivityRings.Legend />
              </Parts>
            </Chart.ActivityRings>
          </Group>
          <Group name="heatmap">
            <Chart.HeatmapChart
              rows={["A"]}
              columns={["B", "C"]}
              data={[{ row: "A", column: "B", value: 5 }]}
              scale={heatScale}
              aria-label="Compound heatmap"
              animate
            >
              <Parts>
                <Chart.HeatmapChart.Grid caption="Compound cells" />
                <Chart.HeatmapChart.Tooltip />
                <Chart.HeatmapChart.Legend label="Cell scale" />
                <Chart.HeatmapChart.DataTable caption="Cell values" />
              </Parts>
            </Chart.HeatmapChart>
          </Group>
          <Group name="sankey">
            <Chart.SankeyChart
              config={flowConfig}
              data={flow}
              height={200}
              animate
              aria-label="Compound sankey"
            >
              <Parts>
                {flowNodes && <Chart.SankeyChart.Nodes />}
                {flowLinks && <Chart.SankeyChart.Links />}
                <Chart.SankeyChart.Tooltip />
                <Chart.SankeyChart.Legend />
                <Chart.SankeyChart.Table caption="Flow values" />
              </Parts>
            </Chart.SankeyChart>
          </Group>
        </>
      )}
    </div>
  );
}

/** Isolate Kind's preference consumers from the engine's independent media hooks. */
export function MotionPreferences() {
  const [mounted, setMounted] = useState(true);
  return (
    <section>
      <button type="button" onClick={() => setMounted(!mounted)}>
        Preference mount
      </button>
      {mounted &&
        [0, 1].map((id) => (
          <Chart.Root key={id} config={config}>
            {[1, 2, 3, 4].map((value) => (
              <Chart.TooltipContent
                key={value}
                tooltip={{
                  active: true,
                  accessibilityLayer: true,
                  label: "Preference value",
                  activeIndex: "0",
                  coordinate: undefined,
                  payload: [
                    {
                      dataKey: "value",
                      value,
                      name: "value",
                      graphicalItemId: `preference-${value}`,
                    },
                  ],
                }}
              />
            ))}
          </Chart.Root>
        ))}
    </section>
  );
}
