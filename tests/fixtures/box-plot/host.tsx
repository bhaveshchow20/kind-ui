// Host composition only. All statistics validation and marks come from the tarball.
import * as Chart from "@kind-ui/charts";
import { useCallback, useState } from "react";
import {
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";

type Row = { category: string; summary: Chart.BoxPlotSummary | null };
const data: Row[] = [
  {
    category: "Negative",
    summary: { lowerWhisker: -12, q1: -8, median: -3, q3: 2, upperWhisker: 7, outliers: [-20, 16] },
  },
  { category: "Zero", summary: { lowerWhisker: 0, q1: 0, median: 0, q3: 0, upperWhisker: 0 } },
  { category: "Missing", summary: null },
  {
    category: "Positive",
    summary: { lowerWhisker: 3, q1: 5, median: 8, q3: 13, upperWhisker: 17, outliers: [24, 24] },
  },
];
function Content({ active, payload, label }: Partial<TooltipContentProps>) {
  const row = payload?.[0]?.payload as Row | undefined;
  const summary = row?.summary;
  if (!active || !summary) return null;
  return (
    <div data-kind-ui="chart-tooltip">
      <strong>{label}</strong>
      <dl>
        {Object.entries(summary).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{Array.isArray(value) ? value.join(", ") : value} units</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
export function BoxHost() {
  const [mode, setMode] = useState<"mixed" | "equal" | "missing">("mixed");
  const [horizontal, setHorizontal] = useState(false);
  const [reordered, setReordered] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [custom, setCustom] = useState(false);
  const [small, setSmall] = useState(false);
  const [animate, setAnimate] = useState(new URLSearchParams(location.search).has("animate"));
  const [visible, setVisible] = useState(["distribution"]);
  const [events, setEvents] = useState(0);
  const [reversed, setReversed] = useState(false);
  const [domain, setDomain] = useState(false);
  const ref = useCallback((node: SVGSVGElement | null) => {
    if (node) node.dataset.hostRef = "yes";
  }, []);
  const markRef = useCallback((node: SVGGElement | null) => {
    if (node) node.dataset.markRef = "yes";
  }, []);
  const base: Row[] =
    mode === "equal"
      ? ["A", "B"].map((category) => ({
          category,
          summary: { lowerWhisker: 5, q1: 5, median: 5, q3: 5, upperWhisker: 5 },
        }))
      : mode === "missing"
        ? data.map((row) => ({ ...row, summary: null }))
        : data;
  const rows = empty ? [] : reordered ? [...base].reverse() : base;
  return (
    <section
      aria-label="Packed box plot"
      style={{ width: small ? 240 : "min(640px, 100%)", background: "white" }}
    >
      {(
        [
          ["Orientation", () => setHorizontal(!horizontal)],
          ["Reorder", () => setReordered(!reordered)],
          ["Empty", () => setEmpty(!empty)],
          ["Custom", () => setCustom(!custom)],
          ["Resize", () => setSmall(!small)],
          ["Animate", () => setAnimate(!animate)],
          ["Reverse", () => setReversed(!reversed)],
          ["Domain", () => setDomain(!domain)],
        ] as const
      ).map(([label, click]) => (
        <button type="button" key={label} onClick={click}>
          {label}
        </button>
      ))}
      <button type="button" onClick={() => setMode("equal")}>
        All equal
      </button>
      <button type="button" onClick={() => setMode("missing")}>
        All missing
      </button>
      <output aria-label="Events">{events}</output>
      <Chart.Root
        config={{ distribution: { label: "Distribution", color: "#176b69" } }}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <Chart.Legend />
        <ResponsiveContainer width="100%" height={320}>
          <Chart.BoxPlotChart
            data={rows}
            layout={horizontal ? "vertical" : "horizontal"}
            ref={ref}
            animate={animate ? { revealDurationMs: 10000 } : false}
            aria-label="Box distribution"
            onMouseMove={() => setEvents((v) => v + 1)}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              xAxisId="x"
              type={horizontal ? "number" : "category"}
              {...(!horizontal ? { dataKey: "category" } : {})}
              {...(horizontal
                ? { domain: domain ? [-30, 40] : ["dataMin", "dataMax"], reversed }
                : {})}
            />
            <YAxis
              yAxisId="y"
              type={horizontal ? "category" : "number"}
              {...(horizontal ? { dataKey: "category" } : {})}
              width={horizontal ? 76 : 44}
              {...(!horizontal
                ? { domain: domain ? [-30, 40] : ["dataMin", "dataMax"], reversed }
                : {})}
            />
            <ReferenceLine
              xAxisId="x"
              yAxisId="y"
              {...(horizontal ? { x: 0 } : { y: 0 })}
              stroke="#444"
            />
            <Chart.Tooltip axisId={horizontal ? "y" : "x"} content={<Content />} maxWidth={250} />
            <Chart.BoxPlotSeries<Row>
              dataKey="summary"
              seriesKey="distribution"
              xAxisId="x"
              yAxisId="y"
              barSize={36}
              markProps={{ ref: markRef, "aria-label": "summary mark" }}
              onClick={() => setEvents((v) => v + 1)}
              {...(custom
                ? {
                    shape: (props: Chart.BoxPlotShapeProps) => {
                      const { summary: _summary, native: _native, ...mark } = props;
                      return <Chart.BoxPlotMark {...mark} data-custom="yes" stroke="purple" />;
                    },
                  }
                : {})}
            >
              {rows.map((row) => (
                <Cell
                  strokeWidth={4}
                  strokeDasharray="4 2"
                  key={row.category}
                  fill={row.category === "Positive" ? "#935b2d" : "#176b69"}
                />
              ))}
              <LabelList dataKey={(row: unknown) => (row as Row).summary?.median} position="top" />
            </Chart.BoxPlotSeries>
          </Chart.BoxPlotChart>
        </ResponsiveContainer>
      </Chart.Root>
      <table>
        <caption>Full distribution statistics, units</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Lower whisker</th>
            <th>Q1</th>
            <th>Median</th>
            <th>Q3</th>
            <th>Upper whisker</th>
            <th>Outliers</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ category, summary }) => (
            <tr key={category}>
              <th>{category}</th>
              {(["lowerWhisker", "q1", "median", "q3", "upperWhisker"] as const).map((key) => (
                <td key={key}>{summary?.[key] ?? "Missing"}</td>
              ))}
              <td>{summary ? summary.outliers?.join(", ") || "None" : "Missing"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
// Guard the intentionally unsupported native transforms that would change summary semantics.
export const rejected: Chart.BoxPlotSeriesProps = {
  dataKey: "summary",
  seriesKey: "distribution",
  // @ts-expect-error Summaries cannot be stacked.
  stackId: "total",
};
