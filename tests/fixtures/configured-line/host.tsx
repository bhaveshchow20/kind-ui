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
          xDataKey="month"
          aria-label="Monthly totals"
          onVisibleSeriesChange={(next) => {
            setBasicVisible(next);
            setBasicCallbacks((n) => n + 1);
          }}
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
    </main>
  );
}
