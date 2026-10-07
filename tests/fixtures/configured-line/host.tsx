"use client";
import * as Chart from "@kind-ui/charts";
import { LineChart } from "@kind-ui/charts";
import { Component, type ErrorInfo, type ReactNode, useCallback, useState } from "react";

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
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    return this.state.error ? <p role="alert">{this.state.error}</p> : this.props.children;
  }
}
export function ConfiguredHost() {
  const [markerClicks, setMarkerClicks] = useState(0);
  const [width, setWidth] = useState(500);
  const [updated, setUpdated] = useState(false);
  const [extra, setExtra] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [controlled, setControlled] = useState(false);
  const [visible, setVisible] = useState<string[]>(["total"]);
  const [callbacks, setCallbacks] = useState(0);
  const [moves, setMoves] = useState(0);
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
      <output data-callbacks>{callbacks}</output>
      <output data-moves>{moves}</output>
      <section data-case="basic" style={{ width }}>
        <LineChart
          data={data}
          config={currentConfig}
          xDataKey="month"
          backgroundPattern={{ pattern: "pinpoints", color: "var(--background-ink, CanvasText)" }}
          aria-label="Monthly totals"
          animate={animate}
          ref={ref}
          onMouseMove={() => setMoves((n) => n + 1)}
        />
      </section>
      <section data-case="controlled" style={{ width }}>
        <Boundary>
          {controlled ? (
            <LineChart
              data={data}
              config={config}
              xDataKey="month"
              aria-label="Controlled totals"
              onVisibleSeriesChange={(next) => {
                setVisible(next);
                setCallbacks((n) => n + 1);
              }}
            />
          ) : (
            <LineChart
              data={data}
              config={config}
              xDataKey="month"
              aria-label="Controlled totals"
              visibleSeries={visible}
              onVisibleSeriesChange={(next) => {
                setVisible(next);
                setCallbacks((n) => n + 1);
              }}
            />
          )}
        </Boundary>
      </section>
      <section data-case="advanced" style={{ width }}>
        <Chart.LineChart
          config={config}
          data={data}
          aria-label="Explicit totals"
          legend={false}
          animate={false}
        >
          <Chart.ChartBackgroundPattern pattern={customBackground} opacity={0.25} />
          <Chart.ChartBackgroundPattern pattern="waves" opacity={0} />
          <Chart.XAxis dataKey="month" />
          <Chart.YAxis domain={[-10, 30]} />
          <Chart.ReferenceLine y={10} />
          <Chart.LineSeries dataKey="total" material="paper" />
          <Chart.Tooltip valueAnimation="shuffle" />
        </Chart.LineChart>
      </section>
      <section data-case="bar-background" style={{ width }}>
        <Chart.Root config={config}>
          <Chart.BarChart
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
        </Chart.Root>
      </section>
      <section data-case="accessor" style={{ width }}>
        <Chart.LineChart
          config={config}
          data={data}
          xDataKey={(row) => row.month}
          aria-label="Function keys"
          series={[{ seriesKey: "other", dataKey: (row) => row.other, material: "glow" }]}
          tooltip={false}
          grid={false}
          yAxis={{ domain: [-10, 30] }}
        />
      </section>
      <section data-case="empty-parts" style={{ width }}>
        {explicitEmpty ? (
          <Chart.LineChart config={{}} data={data} aria-label="No plot parts" legend={false}>
            {null}
          </Chart.LineChart>
        ) : (
          <Chart.LineChart
            config={{}}
            data={data}
            xDataKey="month"
            aria-label="No configured series"
          />
        )}
      </section>
      <output data-marker-clicks>{markerClicks}</output>
      <section data-case="markers">
        <LineChart
          config={config}
          data={allRows}
          xDataKey="month"
          aria-label="Styled markers"
          width={500}
          rootProps={{
            style: { "--kind-ui-chart-marker-surface": "#172033" } as import("react").CSSProperties,
          }}
          series={[
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
          ]}
        />
      </section>
      <section data-case="native-markers">
        <LineChart
          config={config}
          data={allRows}
          xDataKey="month"
          aria-label="Native markers"
          width={500}
          series={[
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
          ]}
        />
      </section>
      <section data-case="renderer-markers">
        <LineChart
          config={config}
          data={allRows}
          xDataKey="month"
          aria-label="Renderer markers"
          width={500}
          series={[
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
          ]}
        />
      </section>
      <section data-case="area-markers">
        <Chart.Root config={config}>
          <Chart.AreaChart width={500} height={280} data={allRows} aria-label="Area markers">
            <Chart.XAxis dataKey="month" />
            <Chart.YAxis />
            <Chart.AreaSeries
              dataKey="total"
              pointStyle="colored-border"
              activePointStyle="border"
            />
            <Chart.Tooltip />
          </Chart.AreaChart>
        </Chart.Root>
      </section>
    </main>
  );
}
