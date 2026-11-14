import {
  Cell,
  Legend,
  LineChart,
  LineSeries,
  PieChart,
  PieSeries,
  type PieSeriesProps,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  type RadialBarChartProps,
  RadialBarSeries,
  Root,
  SankeyChart,
  type SankeyFlowData,
  SankeyLegend,
  SankeyLink,
  type SankeyLinkProps,
  SankeyNode,
  type SankeyNodeConfig,
  type SankeyNodeProps,
  Sector,
  type SeriesConfig,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { useState } from "react";

const initial = [
  { id: "alpha", value: 35 },
  { id: "beta", value: 65 },
];
type Row = (typeof initial)[number];
const accessor = (row: Row) => row.id;
const pieProps: PieSeriesProps<Row, number> = { dataKey: "value", categoryKey: accessor };
const radialProps: RadialBarChartProps<Row> = { categoryKey: "id" };
void pieProps;
void radialProps;
// @ts-expect-error Category accessors must return a config ID.
const invalid: PieSeriesProps<Row> = { categoryKey: (row: Row) => row.value };
void invalid;
const flows: SankeyFlowData = {
  nodes: [
    { id: "input / a", name: "Input" },
    { id: "output:b", name: "Output" },
  ],
  links: [{ id: "flow", source: "input / a", target: "output:b", value: 20 }],
};
const customNode = (props: SankeyNodeProps) => (
  <SankeyNode {...props} color="#996633" rectProps={{ "aria-label": props.payload.id }} />
);
const customLink = (props: SankeyLinkProps) => (
  <SankeyLink {...props} color="#335599" targetColor="#993355" material="gradient" />
);

export function Host() {
  const [rows, setRows] = useState(initial);
  const [updated, setUpdated] = useState(false);
  const [override, setOverride] = useState(false);
  const [gradient, setGradient] = useState(false);
  const [custom, setCustom] = useState(false);
  const [painted, setPainted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [clicks, setClicks] = useState(0);
  const config: SeriesConfig = {
    alpha: { label: "Alpha", color: updated ? "#117744" : "#cc2244" },
    beta: { label: "Beta", color: "#2255cc" },
  };
  const nodeConfig: SankeyNodeConfig = {
    "input / a": { label: "Input", color: updated ? "#117744" : "#cc2244" },
    "output:b": { label: "Output", color: "#2255cc" },
  };
  const data = (hidden ? rows.filter((row) => row.id !== "alpha") : rows).map((row) =>
    painted && row.id === "alpha" ? { ...row, fill: "#664499" } : row,
  );
  const flow = {
    ...flows,
    nodes: rows[0]?.id === "beta" ? [...flows.nodes].reverse() : flows.nodes,
  };
  const cell = (row: Row) => (
    <Cell
      key={row.id}
      {...(override && row.id === "beta" ? { fill: "#aa7700" } : {})}
      data-cell={row.id}
      onClick={() => setClicks((count) => count + 1)}
    />
  );
  return (
    <main>
      <button type="button" onClick={() => setGradient((old) => !old)}>
        Gradient defaults
      </button>
      <button type="button" onClick={() => setRows((old) => [...old].reverse())}>
        Reorder
      </button>
      <button type="button" onClick={() => setUpdated((old) => !old)}>
        Update colors
      </button>
      <button type="button" onClick={() => setOverride((old) => !old)}>
        Cell override
      </button>
      <button type="button" onClick={() => setPainted((old) => !old)}>
        Datum override
      </button>
      <button type="button" onClick={() => setCustom((old) => !old)}>
        Custom owners
      </button>
      <button type="button" onClick={() => setHidden((old) => !old)}>
        Filter
      </button>
      <output aria-label="Cell clicks">{clicks}</output>
      <section aria-label="Pie">
        <Root config={config}>
          <PieChart width={320} height={240}>
            <PieSeries
              data={data}
              dataKey="value"
              nameKey="id"
              categoryKey={accessor}
              {...(custom
                ? { fill: "#446677", shape: (props) => <Sector {...props} data-custom="pie" /> }
                : {})}
            >
              {/* Exercise native Cell discovery through nested fragments. */}
              <>{data.map(cell)}</>
            </PieSeries>
          </PieChart>
          <Legend>
            {custom ? ({ key }) => <span data-custom-legend={key}>Owned {key}</span> : undefined}
          </Legend>
        </Root>
      </section>
      <section aria-label="Donut">
        <Root config={config}>
          <PieChart width={320} height={240}>
            <PieSeries data={data} dataKey="value" nameKey="id" categoryKey="id" innerRadius={45} />
          </PieChart>
          <Legend />
        </Root>
      </section>
      <section aria-label="Radial">
        <Root config={config}>
          <RadialBarChart
            width={320}
            height={240}
            data={data}
            categoryKey="id"
            innerRadius={30}
            outerRadius={100}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <PolarRadiusAxis type="category" dataKey="id" tick={false} />
            <RadialBarSeries
              dataKey="value"
              {...(custom
                ? { fill: "#446677", shape: (props) => <Sector {...props} data-custom="radial" /> }
                : {})}
            >
              {data.map(cell)}
            </RadialBarSeries>
          </RadialBarChart>
          <Legend />
        </Root>
      </section>
      <section aria-label="Sankey">
        <SankeyChart
          width={320}
          height={240}
          data={flow}
          nodeConfig={nodeConfig}
          {...(gradient
            ? { link: (props: SankeyLinkProps) => <SankeyLink {...props} material="gradient" /> }
            : {})}
          {...(custom ? { node: customNode, link: customLink } : {})}
        />
        <SankeyLegend config={nodeConfig}>
          {custom ? ({ key }) => <span data-custom-node-legend={key}>Owned {key}</span> : undefined}
        </SankeyLegend>
      </section>
      <section aria-label="Series">
        <Root config={config}>
          <LineChart
            width={320}
            height={240}
            data={[
              { label: "One", alpha: 20, beta: 40 },
              { label: "Two", alpha: 30, beta: 50 },
            ]}
          >
            <XAxis dataKey="label" />
            <YAxis />
            {rows.map((row) => (
              <LineSeries key={row.id} seriesKey={row.id} dataKey={row.id} />
            ))}
          </LineChart>
          <Legend />
        </Root>
      </section>
    </main>
  );
}
