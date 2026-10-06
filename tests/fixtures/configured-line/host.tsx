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
      <ProjectionCases />
      <Boundary>
        <ProjectionGeometry />
      </Boundary>
      {new URLSearchParams(window.location.search).has("projection-contract") && (
        <ProjectionContract />
      )}
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
          <Chart.XAxis dataKey="month" />
          <Chart.YAxis domain={[-10, 30]} />
          <Chart.ReferenceLine y={10} />
          <Chart.LineSeries dataKey="total" material="paper" />
          <Chart.Tooltip valueAnimation="shuffle" />
        </Chart.LineChart>
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

const geometryRows = [
  { month: "Jan", total: 1, projected: false },
  { month: "Feb", total: 6, projected: false },
  { month: "Mar", total: 3, projected: false },
  { month: "Apr", total: 7, projected: true },
  { month: "May", total: 5, projected: true },
];

const geometryModes = ["linear", "monotone", "bump", "step", "basis", "basisOpen"] as const;
function ProjectionGeometry() {
  return (
    <section data-case="projection-geometry">
      <style>{`[data-case="projection-geometry"] svg.recharts-surface { overflow: visible; }`}</style>
      {geometryModes.map((type) => (
        <section data-curve={type} key={type}>
          {[false, true].map((projected) => (
            <section data-geometry={projected ? "projected" : "native"} key={String(projected)}>
              <Chart.Root config={config}>
                <Chart.ComboChart
                  width={500}
                  height={280}
                  data={geometryRows}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <Chart.XAxis dataKey="month" hide />
                  <Chart.YAxis hide domain={[1, 7]} />
                  <Chart.LineSeries<(typeof geometryRows)[number], number>
                    dataKey="total"
                    type={type}
                    strokeWidth={20}
                    {...(projected
                      ? {
                          projected: {
                            isProjected: (row: (typeof geometryRows)[number]) => row.projected,
                          },
                        }
                      : {})}
                  />
                </Chart.ComboChart>
              </Chart.Root>
            </section>
          ))}
        </section>
      ))}
      <Chart.Root config={config}>
        <Chart.ComboChart
          width={500}
          height={280}
          data={geometryRows}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <Chart.XAxis dataKey="month" hide reversed />
          <Chart.YAxis hide domain={[1, 7]} />
          <Chart.LineSeries<(typeof geometryRows)[number], number>
            dataKey="total"
            type="monotone"
            material="glow"
            projected={{ isProjected: (row) => row.projected }}
          />
        </Chart.ComboChart>
      </Chart.Root>
      <section data-vertical="true">
        <Chart.Root config={config}>
          <Chart.ComboChart width={500} height={280} data={geometryRows} layout="vertical">
            <Chart.XAxis type="number" />
            <Chart.YAxis type="category" dataKey="month" reversed />
            <Chart.LineSeries<(typeof geometryRows)[number], number>
              dataKey="total"
              type="monotoneY"
              projected={{ isProjected: (row) => row.projected }}
            />
          </Chart.ComboChart>
        </Chart.Root>
      </section>
    </section>
  );
}

function ProjectionContract() {
  const unsupported = [
    "natural",
    "basisClosed",
    "linearClosed",
    "stepBefore",
    "stepAfter",
    "monotoneY",
  ] as const;
  return (
    <section data-case="projection-contract">
      {unsupported.map((type) => (
        <section data-invalid={type} key={type}>
          <Boundary>
            <Chart.LineChart
              width={500}
              data={geometryRows}
              config={config}
              xDataKey="month"
              series={[
                {
                  seriesKey: "total",
                  dataKey: "total",
                  type,
                  projected: { isProjected: (row) => row.projected },
                },
              ]}
            />
          </Boundary>
        </section>
      ))}
      {[
        [0, 2, 1, 3, 4],
        [0, 1, 1, 3, 4],
      ].map((xs, index) => (
        <section data-invalid={index === 0 ? "reordered" : "repeated"} key={xs.join(",")}>
          <Boundary>
            <Chart.Root config={config}>
              <Chart.ComboChart
                width={500}
                height={280}
                data={geometryRows.map((row, i) => ({ ...row, category: xs[i] }))}
              >
                <Chart.XAxis type="number" dataKey="category" />
                <Chart.YAxis />
                <Chart.LineSeries<
                  (typeof geometryRows)[number] & { category: number | undefined },
                  number
                >
                  dataKey="total"
                  type="linear"
                  projected={{ isProjected: (row) => row.projected }}
                />
              </Chart.ComboChart>
            </Chart.Root>
          </Boundary>
        </section>
      ))}
    </section>
  );
}
const projectionSource = [
  { month: "Jan", total: 3, projected: false },
  { month: "Feb", total: null, projected: false },
  { month: "Mar", total: 7, projected: true },
  { month: "Apr", total: 0, projected: true },
];
const projectionConfig = { total: { label: "Total", color: "#4055ee" } };
const projectionOption = {
  isProjected: (row: (typeof projectionSource)[number]) => row.projected,
  strokeDasharray: "6 3",
};

function ProjectionCases() {
  const [order, setOrder] = useState(false);
  const [single, setSingle] = useState(false);
  const [emptyProjection, setEmptyProjection] = useState(false);
  const [missingProjection, setMissingProjection] = useState(false);
  const selected = single
    ? projectionSource.slice(-1)
    : order
      ? [...projectionSource].reverse()
      : projectionSource;
  const rows = emptyProjection
    ? []
    : missingProjection
      ? selected.map((row) => (row.month === "Apr" ? { ...row, total: null } : row))
      : selected;
  const start = Chart.getProjectedStart(rows, projectionOption.isProjected);
  return (
    <section data-case="projection-cases">
      <button type="button" onClick={() => setOrder(!order)}>
        Reorder projection
      </button>
      <button type="button" onClick={() => setSingle(!single)}>
        Filter projection
      </button>
      <button type="button" onClick={() => setEmptyProjection(!emptyProjection)}>
        Empty projection
      </button>
      <button type="button" onClick={() => setMissingProjection(!missingProjection)}>
        Missing projection
      </button>
      {[false, true].map((connectNulls) => (
        <section data-projection-connect={String(connectNulls)} key={String(connectNulls)}>
          <Chart.LineChart
            width={500}
            data={rows}
            config={projectionConfig}
            xDataKey="month"
            aria-label={`Projected totals ${connectNulls}`}
            series={[
              {
                seriesKey: "total",
                dataKey: "total",
                projected: projectionOption,
                connectNulls,
                type: "monotone",
                strokeWidth: 3,
                strokeDasharray: "2 1",
                pointStyle: "border",
                activePointStyle: "colored-border",
              },
            ]}
          />
        </section>
      ))}
      <section data-case="projection-combo">
        <Chart.Root config={projectionConfig}>
          <Chart.ComboChart width={500} height={280} data={rows}>
            <Chart.XAxis dataKey="month" />
            <Chart.YAxis />
            <Chart.BarSeries dataKey="total" />
            <Chart.LineSeries<(typeof projectionSource)[number], number | null>
              dataKey="total"
              projected={projectionOption}
              connectNulls
            />
            <Chart.Tooltip />
          </Chart.ComboChart>
        </Chart.Root>
      </section>
      <section data-case="projection-per-series">
        <Chart.Root config={config}>
          <Chart.LineChart
            width={500}
            height={280}
            data={rows.map((row) => ({ ...row, total: 100 }))}
          >
            <Chart.XAxis dataKey="month" />
            <Chart.YAxis />
            <Chart.LineSeries<(typeof projectionSource)[number], number | null>
              data={rows}
              dataKey="total"
              seriesKey="total"
              projected={projectionOption}
              connectNulls
            />
            <Chart.LineSeries<(typeof projectionSource)[number], number | null>
              data={rows}
              dataKey={(row) => row.total}
              seriesKey="other"
              projected={{ isProjected: () => false }}
              connectNulls
            />
            <Chart.Tooltip />
          </Chart.LineChart>
        </Chart.Root>
      </section>
      <section data-case="projection-native-shape">
        <Chart.LineChart
          width={500}
          data={rows}
          config={projectionConfig}
          xDataKey="month"
          aria-label="Custom projection shape"
          series={[
            {
              seriesKey: "total",
              dataKey: "total",
              projected: projectionOption,
              shape: (props) => <Chart.Curve {...props} data-custom-projection="owned" />,
            },
          ]}
        />
      </section>
      <table>
        <caption>Caller-supplied monthly totals</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.month}>
              <th scope="row">{row.month}</th>
              <td>{row.total ?? "No data"}</td>
              <td>{index >= start ? "Projected" : "Historical"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
