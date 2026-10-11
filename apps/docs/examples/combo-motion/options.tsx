"use client";
import {
  BarChart,
  ComboChart,
  createPercentStack,
  defineChartBackgroundPattern,
  PieChart,
  SankeyChart,
  type SankeyFlowData,
  SankeyNode,
  type SankeyNodeConfig,
  SankeyNodeLabel,
  type SeriesConfig,
  TooltipContent,
} from "@kind-ui/charts";

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
} satisfies SeriesConfig;
const projected = (row: Row) => row.month === "Jun";
const background = defineChartBackgroundPattern(({ size, color }) => (
  <circle cx={size / 2} cy={size / 2} r={1} fill={color} />
));

/** The application supplies request state, errors, cancellation and retry. */
export function PresentationOptions({ loading = false }: { loading?: boolean }) {
  return (
    <section aria-label="Monthly production options">
      <>
        <>
          <ComboChart
            legendPosition="top"
            config={config}
            interaction={{
              kind: "series",
              mode: "focus",
              eligibleKeys: Object.keys(config),
              markActivation: "matching-legend",
            }}
            width="100%"
            height={280}
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
            <ComboChart.Background pattern={background} />
            <ComboChart.XAxis dataKey="month" tick={{ fill: "#666" }} />
            <ComboChart.YAxis width={80} tick={{ fill: "#666" }} />
            <ComboChart.Area dataKey="capacity" fillOpacity={0.15} pointStyle="border" />
            <ComboChart.Bar<Row>
              dataKey="shipped"
              projection={{ isProjected: projected, pattern: { kind: "stripe" } }}
            />
            <ComboChart.Line
              dataKey="target"
              strokeDasharray="6 4"
              dashAnimation={{ durationMs: 1000 }}
              pointStyle="colored-border"
              activePointStyle="border"
            />
            <ComboChart.Tooltip
              content={(tooltip) => (
                <TooltipContent
                  tooltip={tooltip}
                  isProjected={(entry) => entry.payload?.month === "Jun"}
                />
              )}
            />
            <ComboChart.Legend />
          </ComboChart>
        </>
      </>
    </section>
  );
}

const percent = createPercentStack({
  values: (entry) =>
    ["capacity", "shipped"].includes(String(entry.dataKey))
      ? [entry.payload.capacity, entry.payload.shipped]
      : undefined,
});
export function PercentageOptions() {
  return (
    <>
      <BarChart
        config={config}
        defaultVisibleSeries={Object.keys(config)}
        data={data}
        width={480}
        height={260}
        stackOffset="expand"
        aria-label="Capacity and shipped share; values in the production table"
      >
        <BarChart.XAxis dataKey="month" tick={{ fill: "#666" }} />
        <BarChart.YAxis
          domain={[0, 1]}
          tickFormatter={percent.tickFormatter}
          width={80}
          tick={{ fill: "#666" }}
        />
        <BarChart.Series dataKey="capacity" stackId="share" />
        <BarChart.Series dataKey="shipped" stackId="share" pattern={false} />
        <BarChart.Tooltip normalizedValue={percent.normalizedValue} />
      </BarChart>
    </>
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
} satisfies SeriesConfig;
export function PieOptions({ loading = false }: { loading?: boolean }) {
  return (
    <>
      <PieChart
        config={categoryConfig}
        defaultVisibleSeries={["service", "other"]}
        interaction={{ kind: "category", eligibleKeys: categories.map((row) => row.id) }}
        width={400}
        height={280}
        defaultPinnedCategory="service"
        loading={loading}
        loadingLabel="Loading allocation"
        aria-label="Allocation; retail 35, service 45, other 20"
      >
        <PieChart.Series
          data={categories}
          dataKey="value"
          categoryKey="id"
          glowCategories={["service"]}
        />
        <PieChart.Tooltip itemKey={(entry) => entry.payload.id} />
        <PieChart.Legend />
      </PieChart>
    </>
  );
}

const flow = {
  nodes: [
    { id: "input", name: "Input" },
    { id: "output", name: "Output" },
  ],
  links: [{ id: "input-output", source: "input", target: "output", value: 20 }],
} satisfies SankeyFlowData;
const nodeConfig = {
  input: {
    label: "Input",
    color: "#2563eb",
    icon: <path d="M4 12h16M14 6l6 6-6 6" fill="none" stroke="currentColor" />,
  },
  output: { label: "Output", color: "#0f766e" },
} satisfies SankeyNodeConfig;
const units = (value: number) => `${value} units`;
export function FlowLabelOptions() {
  return (
    <>
      <SankeyChart
        data={flow}
        width={480}
        height={260}
        margin={{ left: 96, right: 96, top: 16, bottom: 16 }}
        aria-label="Twenty units from input to output"
        config={nodeConfig}
      >
        <SankeyChart.Links />
        <SankeyChart.Nodes
          render={(node) => (
            <g>
              <SankeyNode {...node} />
              <SankeyNodeLabel
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
      </SankeyChart>
    </>
  );
}
