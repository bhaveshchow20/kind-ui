"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
  { month: "Jan", capacity: 960, shipped: 640, target: 700 },
  { month: "Feb", capacity: 960, shipped: 730, target: 720 },
  { month: "Mar", capacity: 1040, shipped: 780, target: 760 },
  { month: "Apr", capacity: 1040, shipped: 860, target: 820 },
  { month: "May", capacity: 1120, shipped: 920, target: 880 },
  { month: "Jun", capacity: 1120, shipped: 1020, target: 960 },
];
type Row = (typeof data)[number];
const config = {
  capacity: {
    color: { light: ["#c4b5fd", "#7c3aed"], dark: ["#ddd6fe", "#a78bfa"] },
    pattern: { kind: "dots" },
  },
  shipped: { color: "#2563eb", pattern: { kind: "hatch" } },
  target: { color: "#0f766e" },
} satisfies Chart.SeriesConfig;
const projected = (row: Row) => row.month === "Jun";
const background = Chart.defineChartBackgroundPattern(({ size, color }) => (
  <circle cx={size / 2} cy={size / 2} r={1} fill={color} />
));

/** The application supplies request state, errors, cancellation and retry. */
export function PresentationOptions({ loading = false }: { loading?: boolean }) {
  return (
    <section aria-label="Monthly production options">
      <Chart.Root
        config={config}
        interaction={{
          kind: "series",
          mode: "focus",
          eligibleKeys: Object.keys(config),
          markActivation: "matching-legend",
        }}
      >
        <Chart.Legend />
        <Chart.ResponsiveContainer width="100%" height={280}>
          <Chart.ComboChart
            data={data}
            loading={loading}
            loadingLabel="Loading monthly production"
            accessibilityLayer
            aria-label="Production, capacity and target in units"
            animate={{
              revealDirection: "center-out",
              lineReveal: { revealDirection: "right-to-left" },
            }}
          >
            <Chart.ChartBackgroundPattern pattern={background} />
            <Chart.XAxis dataKey="month" />
            <Chart.YAxis width={64} />
            <Chart.AreaSeries dataKey="capacity" fillOpacity={0.15} pointStyle="border" />
            <Chart.BarSeries<Row>
              dataKey="shipped"
              projection={{ isProjected: projected, pattern: { kind: "stripe" } }}
            />
            <Chart.LineSeries
              dataKey="target"
              strokeDasharray="6 4"
              dashAnimation={{ durationMs: 1000 }}
              pointStyle="colored-border"
              activePointStyle="border"
            />
            <Chart.Tooltip
              content={(tooltip) => (
                <Chart.TooltipContent
                  tooltip={tooltip}
                  isProjected={(entry) => entry.payload?.month === "Jun"}
                />
              )}
            />
          </Chart.ComboChart>
        </Chart.ResponsiveContainer>
      </Chart.Root>
      <table>
        <caption>Monthly production in units; June is projected</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Capacity</th>
            <th scope="col">Shipped</th>
            <th scope="col">Target</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td>{row.capacity}</td>
              <td>{row.shipped}</td>
              <td>{row.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const percent = Chart.createPercentStack({
  values: (entry) =>
    ["capacity", "shipped"].includes(String(entry.dataKey))
      ? [entry.payload.capacity, entry.payload.shipped]
      : undefined,
});
export function PercentageOptions() {
  return (
    <Chart.Root config={config}>
      <Chart.BarChart
        data={data}
        width={480}
        height={260}
        stackOffset="expand"
        aria-label="Capacity and shipped share; values in the production table"
      >
        <Chart.XAxis dataKey="month" />
        <Chart.YAxis domain={[0, 1]} tickFormatter={percent.tickFormatter} width={64} />
        <Chart.BarSeries dataKey="capacity" stackId="share" />
        <Chart.BarSeries dataKey="shipped" stackId="share" pattern={false} />
        <Chart.Tooltip normalizedValue={percent.normalizedValue} />
      </Chart.BarChart>
    </Chart.Root>
  );
}

const categories = [
  { id: "retail", value: 35 },
  { id: "service", value: 45 },
  { id: "other", value: 20 },
];
const categoryConfig = {
  retail: { color: "#2563eb" },
  service: { color: "#0f766e" },
  other: { color: "#7c3aed" },
} satisfies Chart.SeriesConfig;
export function PieOptions({ loading = false }: { loading?: boolean }) {
  return (
    <Chart.Root
      config={categoryConfig}
      defaultVisibleSeries={["service", "other"]}
      interaction={{ kind: "category", eligibleKeys: categories.map((row) => row.id) }}
    >
      <Chart.PieChart
        width={400}
        height={280}
        defaultPinnedCategory="service"
        loading={loading}
        loadingLabel="Loading allocation"
        aria-label="Allocation; retail 35, service 45, other 20"
      >
        <Chart.PieSeries
          data={categories}
          dataKey="value"
          categoryKey="id"
          interactionBinding="root"
          glowCategories={["service"]}
        />
        <Chart.Tooltip itemKey={(entry) => entry.payload.id} />
      </Chart.PieChart>
      <Chart.Legend />
      <table>
        <caption>Allocation</caption>
        <tbody>
          {categories.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.id}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Chart.Root>
  );
}

const flow = {
  nodes: [
    { id: "input", name: "Input" },
    { id: "output", name: "Output" },
  ],
  links: [{ id: "input-output", source: "input", target: "output", value: 20 }],
} satisfies Chart.SankeyFlowData;
const nodeConfig = {
  input: {
    label: "Input",
    color: "#2563eb",
    icon: <path d="M4 12h16M14 6l6 6-6 6" fill="none" stroke="currentColor" />,
  },
  output: { label: "Output", color: "#0f766e" },
} satisfies Chart.SankeyNodeConfig;
const units = (value: number) => `${value} units`;
export function FlowLabelOptions() {
  return (
    <>
      <Chart.SankeyChart
        data={flow}
        nodeConfig={nodeConfig}
        width={480}
        height={260}
        margin={{ left: 96, right: 96, top: 16, bottom: 16 }}
        aria-label="Twenty units from input to output"
        node={(node) => (
          <g>
            <Chart.SankeyNode {...node} />
            <Chart.SankeyNodeLabel
              node={node}
              data={flow}
              nodeConfig={nodeConfig}
              position="outside"
              showValues
              valueFormatter={units}
            />
          </g>
        )}
      />
      <Chart.SankeyTable data={flow} caption="Flow in units" formatValue={units} />
    </>
  );
}
