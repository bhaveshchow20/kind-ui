"use client";
import * as Chart from "@kind-ui/charts";
import { LineChart } from "@kind-ui/charts";
import {
  Component,
  type CSSProperties,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useState,
} from "react";

const allRows = [
  { month: "Jan", total: 0, other: 6 },
  { month: "Feb", total: 12, other: null },
  { month: "Mar", total: -4, other: 8 },
];
const initial = new URLSearchParams(window.location.search).has("single")
  ? allRows.slice(0, 1)
  : allRows;
const customBackground = Chart.defineChartBackgroundPattern(({ size, color, idPrefix }) => (
  <g id={`${idPrefix}-tile`}>
    <path d={`M0 0L${size} ${size}`} stroke={color} />
  </g>
));
const config = {
  total: { label: "Total", color: "#4055ee" },
  other: { label: "Other", color: "#0d9488" },
};
class Boundary extends Component<{ children: ReactNode }, { error: string }> {
  override state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  override componentDidCatch(_error: Error, _info: ErrorInfo) {}
  override render() {
    return this.state.error ? <p role="alert">{this.state.error}</p> : this.props.children;
  }
}
export function ChartFrameHost() {
  const [markerClicks, setMarkerClicks] = useState(0);
  const [width, setWidth] = useState(500);
  const [updated, setUpdated] = useState(false);
  const [extra, setExtra] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [controlled, setControlled] = useState(false);
  const [visible, setVisible] = useState<string[]>(["total"]);
  const [callbacks, setCallbacks] = useState(0);
  const [moves, setMoves] = useState(0);
  const [basicVisible, setBasicVisible] = useState(Object.keys(config));
  const [basicCallbacks, setBasicCallbacks] = useState(0);
  const [animate, setAnimate] = useState<boolean | undefined>(undefined);
  const [explicitEmpty, setExplicitEmpty] = useState(false);
  const ref = useCallback((node: SVGSVGElement | null) => {
    if (node) node.dataset.hostRef = "attached";
  }, []);
  const data = empty
    ? []
    : updated
      ? initial.map((row) => ({ ...row, total: row.total + 10 }))
      : initial;
  const currentConfig = extra ? { ...config, added: { label: "Added", color: "red" } } : config;
  return (
    <main>
      <button type="button" onClick={() => setWidth(width === 500 ? 360 : 500)}>
        Resize
      </button>
      <button type="button" onClick={() => setUpdated(!updated)}>
        Update data
      </button>
      <button type="button" onClick={() => setExtra(!extra)}>
        Update config
      </button>
      <button type="button" onClick={() => setEmpty(!empty)}>
        Empty data
      </button>
      <button type="button" onClick={() => setControlled(!controlled)}>
        Switch control mode
      </button>
      <button type="button" onClick={() => setVisible([])}>
        Hide controlled
      </button>
      <button type="button" onClick={() => setAnimate(animate === false)}>
        Toggle motion
      </button>
      <button type="button" onClick={() => setExplicitEmpty(!explicitEmpty)}>
        Explicit empty
      </button>
      <span data-basic-visibility={basicVisible.join(",")} data-basic-callbacks={basicCallbacks} />
      <output data-callbacks>{callbacks}</output>
      <output data-moves>{moves}</output>
      <section data-case="basic" style={{ width }}>
        <LineChart
          data={data}
          config={currentConfig}
          aria-label="Monthly totals"
          defaultVisibleSeries={Object.keys(currentConfig)}
          onVisibleSeriesChange={(next: string[]) => {
            setBasicVisible(next);
            setBasicCallbacks((n) => n + 1);
          }}
          animate={animate}
          ref={ref}
          onMouseMove={() => setMoves((n) => n + 1)}
          interaction={{
            kind: "series",
            mode: "visibility",
            eligibleKeys: data.length ? Object.keys(currentConfig) : [],
          }}
          frameProps={{}}
        >
          <LineChart.Background pattern="pinpoints" color="var(--background-ink, currentColor)" />
          <LineChart.Grid />
          <LineChart.XAxis dataKey={"month"} />
          <LineChart.YAxis />
          {Object.keys(currentConfig).map((key) => (
            <LineChart.Series key={key} dataKey={key} />
          ))}
          <LineChart.Tooltip />
          <LineChart.Legend />
        </LineChart>
      </section>
      <section data-case="controlled" style={{ width }}>
        <Boundary>
          {controlled ? (
            // @ts-expect-error Intentionally exercise the missing visibility owner at runtime.
            <LineChart
              data={data}
              config={config}
              aria-label="Controlled totals"
              onVisibleSeriesChange={(next: string[]) => {
                setVisible(next);
                setCallbacks((n) => n + 1);
              }}
              interaction={{
                kind: "series",
                mode: "visibility",
                eligibleKeys: data.length ? Object.keys(config) : [],
              }}
              frameProps={{}}
            >
              <LineChart.Grid />
              <LineChart.XAxis dataKey={"month"} />
              <LineChart.YAxis />
              {Object.keys(config).map((key) => (
                <LineChart.Series key={key} dataKey={key} />
              ))}
              <LineChart.Tooltip />
              <LineChart.Legend />
            </LineChart>
          ) : (
            <LineChart
              data={data}
              config={config}
              aria-label="Controlled totals"
              visibleSeries={visible}
              onVisibleSeriesChange={(next) => {
                setVisible(next);
                setCallbacks((n) => n + 1);
              }}
              interaction={{
                kind: "series",
                mode: "visibility",
                eligibleKeys: data.length ? Object.keys(config) : [],
              }}
              frameProps={{}}
            >
              <LineChart.Grid />
              <LineChart.XAxis dataKey={"month"} />
              <LineChart.YAxis />
              {Object.keys(config).map((key) => (
                <LineChart.Series key={key} dataKey={key} />
              ))}
              <LineChart.Tooltip />
              <LineChart.Legend />
            </LineChart>
          )}
        </Boundary>
      </section>
      <section data-case="advanced" style={{ width }}>
        <Chart.LineChart config={config} data={data} aria-label="Explicit totals" animate={false}>
          <Chart.ChartBackgroundPattern pattern={customBackground} opacity={0.25} />
          <Chart.ChartBackgroundPattern pattern="waves" opacity={0} />
          <Chart.XAxis dataKey="month" />
          <Chart.YAxis domain={[-10, 30]} />
          <Chart.ReferenceLine y={10} />
          <Chart.LineSeries dataKey="total" material="clay" />
          <Chart.Tooltip valueAnimation="shuffle" />
        </Chart.LineChart>
      </section>
      <section data-case="bar-background" style={{ width }}>
        <Chart.BarChart
          config={config}
          aria-label="Chart fixture"
          data={data}
          responsive
          animate={false}
          style={{ width: "100%", height: 280 }}
        >
          <Chart.CartesianGrid />
          <Chart.BarSeries dataKey="total" />
          <Chart.ChartBackgroundPattern pattern="crossings" />
          <Chart.XAxis dataKey="month" />
          <Chart.YAxis />
          <Chart.Tooltip />
        </Chart.BarChart>
      </section>
      <section data-case="accessor" style={{ width }}>
        <Chart.LineChart config={config} data={data} aria-label="Function keys">
          <Chart.LineChart.XAxis dataKey={(row: (typeof allRows)[number]) => row.month} />
          <Chart.LineChart.YAxis {...{ domain: [-10, 30] }} />
          {(
            [
              {
                seriesKey: "other",
                dataKey: (row: (typeof allRows)[number]) => row.other,
                material: "glow",
              },
            ] satisfies Chart.LineSeriesProps<(typeof allRows)[number]>[]
          ).map((series) => (
            <Chart.LineChart.Series key={series.seriesKey ?? String(series.dataKey)} {...series} />
          ))}
          <Chart.LineChart.Legend />
        </Chart.LineChart>
      </section>
      <section data-case="empty-parts" style={{ width }}>
        {explicitEmpty ? (
          <Chart.LineChart config={{}} data={data} aria-label="No plot parts">
            {null}
          </Chart.LineChart>
        ) : (
          <Chart.LineChart config={{}} data={data} aria-label="No series">
            <Chart.LineChart.Grid />
            <Chart.LineChart.XAxis dataKey={"month"} />
            <Chart.LineChart.YAxis />
            {Object.keys({}).map((key) => (
              <Chart.LineChart.Series key={key} dataKey={key} />
            ))}
            <Chart.LineChart.Tooltip />
            <Chart.LineChart.Legend />
          </Chart.LineChart>
        )}
      </section>
      <output data-marker-clicks>{markerClicks}</output>
      <section data-case="markers">
        <LineChart
          frameProps={{ style: { "--card": "#172033" } as CSSProperties }}
          config={config}
          data={allRows}
          aria-label="Styled markers"
          width={500}
        >
          <LineChart.Grid />
          <LineChart.XAxis dataKey={"month"} />
          <LineChart.YAxis />
          {(
            [
              {
                seriesKey: "total",
                dataKey: "total",
                pointStyle: "border",
                activePointStyle: "colored-border",
              },
              {
                seriesKey: "other",
                dataKey: "other",
                stroke: "#a855f7",
                pointStyle: "colored-border",
                activePointStyle: "border",
              },
            ] satisfies Chart.LineSeriesProps<(typeof allRows)[number]>[]
          ).map((series) => (
            <LineChart.Series key={series.seriesKey ?? String(series.dataKey)} {...series} />
          ))}
          <LineChart.Tooltip />
          <LineChart.Legend />
        </LineChart>
      </section>
      <section data-case="native-markers">
        <LineChart config={config} data={allRows} aria-label="Native markers" width={500}>
          <LineChart.Grid />
          <LineChart.XAxis dataKey={"month"} />
          <LineChart.YAxis />
          {(
            [
              {
                seriesKey: "total",
                dataKey: "total",
                pointStyle: "border",
                activePointStyle: "colored-border",
                dot: {
                  r: 9,
                  fill: "gold",
                  stroke: "black",
                  onClick: () => setMarkerClicks((n) => n + 1),
                },
                activeDot: false,
              },
            ] satisfies Chart.LineSeriesProps<(typeof allRows)[number]>[]
          ).map((series) => (
            <LineChart.Series key={series.seriesKey ?? String(series.dataKey)} {...series} />
          ))}
          <LineChart.Tooltip />
          <LineChart.Legend />
        </LineChart>
      </section>
      <section data-case="renderer-markers">
        <LineChart config={config} data={allRows} aria-label="Renderer markers" width={500}>
          <LineChart.Grid />
          <LineChart.XAxis dataKey={"month"} />
          <LineChart.YAxis />
          {(
            [
              {
                seriesKey: "total",
                dataKey: "total",
                pointStyle: "border",
                dot: <Chart.PointMarker variant="colored-border" />,
                activeDot: (props) => (
                  <Chart.PointMarker
                    {...props}
                    stroke={props.fill}
                    variant="colored-border"
                    style={{ fill: "gold" }}
                    data-active-renderer="true"
                  />
                ),
              },
            ] satisfies Chart.LineSeriesProps<(typeof allRows)[number]>[]
          ).map((series) => (
            <LineChart.Series key={series.seriesKey ?? String(series.dataKey)} {...series} />
          ))}
          <LineChart.Tooltip />
          <LineChart.Legend />
        </LineChart>
      </section>
      <section data-case="area-markers">
        <Chart.AreaChart
          config={config}
          width={500}
          height={280}
          data={allRows}
          aria-label="Area markers"
        >
          <Chart.XAxis dataKey="month" />
          <Chart.YAxis />
          <Chart.AreaSeries dataKey="total" pointStyle="colored-border" activePointStyle="border" />
          <Chart.Tooltip />
        </Chart.AreaChart>
      </section>
      <ReadOnlyOwnershipSwitch initiallyControlled />
      <ReadOnlyOwnershipSwitch initiallyControlled={false} />
    </main>
  );
}

function ReadOnlyOwnershipSwitch({ initiallyControlled }: { initiallyControlled: boolean }) {
  const [controlled, setControlled] = useState(initiallyControlled);
  const direction = initiallyControlled ? "read-only to uncontrolled" : "uncontrolled to read-only";
  return (
    <section data-case={`ownership-${initiallyControlled ? "controlled" : "uncontrolled"}`}>
      <button type="button" onClick={() => setControlled(!controlled)}>
        Switch {direction}
      </button>
      <Boundary>
        <LineChart
          data={allRows}
          config={config}
          aria-label={`Ownership ${direction}`}
          width={500}
          animate={false}
          {...(controlled ? { visibleSeries: ["total"] } : { defaultVisibleSeries: ["total"] })}
        >
          <LineChart.XAxis dataKey="month" />
          <LineChart.Series dataKey="total" />
          <LineChart.Legend />
        </LineChart>
      </Boundary>
    </section>
  );
}
