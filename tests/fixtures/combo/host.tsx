// Public-only host proof; native marks are a geometry oracle, not copied implementation.
import * as Chart from "@kind-ui/charts";
import { createRef, useState } from "react";
import { Area, Bar, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";

const points = [
  { category: "A", bar: 8, stacked: 4, area: 6, line: 40 },
  { category: "B", bar: -6, stacked: -3, area: -4, line: -20 },
  { category: "C", bar: 0, stacked: 0, area: 0, line: 0 },
  { category: "D", bar: null, stacked: null, area: null, line: null },
  { category: "E", bar: 10, stacked: 5, area: 8, line: 60 },
];
const config = {
  bar: { label: "Bar", color: "#2563eb" },
  stacked: { label: "Stacked", color: "#93c5fd" },
  area: { label: "Area", color: "#0d9488" },
  line: { label: "Line", color: "#d97706" },
} satisfies Chart.SeriesConfig;
const ref = createRef<SVGSVGElement>();
const timing = location.search.includes("timings");
const animation = {
  revealDurationMs: 60000,
  lineReveal: { revealDurationMs: timing ? 200 : 60000 },
  areaReveal: { revealDurationMs: timing ? 1200 : 50000 },
  barReveal: { revealDurationMs: timing ? 2400 : 40000 },
  hoverTransition: { duration: 0.2 },
} satisfies Chart.ComboAnimation;

export function ComboHost() {
  const [visible, setVisible] = useState(Object.keys(config));
  const [animate, setAnimate] = useState(true);
  const [barEntrance, setBarEntrance] = useState(!location.search.includes("bar-off"));
  const [updated, setUpdated] = useState(false);
  const [wide, setWide] = useState(false);
  const [gap, setGap] = useState(false);
  const [stack, setStack] = useState(true);
  const [color, setColor] = useState(false);
  const [axis, setAxis] = useState(false);
  const [events, setEvents] = useState(0);
  const data = updated
    ? points.map((point) => ({ ...point, bar: point.bar === null ? null : point.bar * 0.5 }))
    : points;
  const props = {
    width: wide ? 580 : 420,
    height: 260,
    data,
    barGap: gap ? 24 : 4,
    stackOffset: "sign",
    margin: { top: 16, right: 0, left: 0, bottom: 0 },
  } satisfies Chart.ComboChartProps;
  const axes = (
    <>
      <XAxis dataKey="category" />
      <YAxis yAxisId="left" domain={axis ? [-30, 30] : [-20, 20]} />
      <YAxis yAxisId="right" orientation="right" domain={[-80, 80]} />
      <ReferenceLine yAxisId="left" y={0} />
    </>
  );
  return (
    <>
      <label>
        <input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} />
        Animate
      </label>
      <label>
        <input
          type="checkbox"
          checked={barEntrance}
          onChange={(e) => setBarEntrance(e.target.checked)}
        />
        Bar entrance
      </label>
      <button type="button" onClick={() => setUpdated(!updated)}>
        Update data
      </button>
      <button type="button" onClick={() => setWide(!wide)}>
        Resize
      </button>
      <button type="button" onClick={() => setAxis(!axis)}>
        Change axis
      </button>
      <button type="button" onClick={() => ref.current?.focus()}>
        Focus via ref
      </button>
      <button type="button" onClick={() => setGap(!gap)}>
        Change gap
      </button>
      <button type="button" onClick={() => setStack(!stack)}>
        Change stack
      </button>
      <button type="button" onClick={() => setColor(!color)}>
        Change color
      </button>
      <output aria-label="Events">{events}</output>
      <output aria-label="Ref">{ref.current?.tagName ?? "pending"}</output>
      <section aria-label="Managed">
        <Chart.Root
          config={{ ...config, area: { ...config.area, color: color ? "#e11d48" : "#0d9488" } }}
          visibleSeries={visible}
          onVisibleSeriesChange={setVisible}
        >
          <Chart.Legend />
          <Chart.ComboChart
            {...props}
            ref={ref}
            animate={
              animate
                ? { ...animation, barReveal: barEntrance ? animation.barReveal : false }
                : false
            }
            aria-label="Managed combo"
            onMouseMove={() => setEvents((value) => value + 1)}
          >
            {axes}
            <Chart.AreaSeries
              dataKey="area"
              yAxisId="left"
              connectNulls={false}
              fillOpacity={0.2}
              dot={false}
            />
            <Chart.BarSeries dataKey="bar" yAxisId="left" stackId={stack ? "s" : undefined} />
            <Chart.BarSeries dataKey="stacked" yAxisId="left" stackId={stack ? "s" : undefined} />
            <Chart.LineSeries dataKey="line" yAxisId="right" dot={false} connectNulls={false} />
            <Chart.Tooltip />
          </Chart.ComboChart>
        </Chart.Root>
      </section>
      <section aria-label="Native">
        <ComposedChart {...props} aria-label="Native combo">
          {axes}
          <Area
            dataKey="area"
            yAxisId="left"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Bar
            dataKey="bar"
            yAxisId="left"
            stackId={stack ? "s" : undefined}
            isAnimationActive={false}
          />
          <Bar
            dataKey="stacked"
            yAxisId="left"
            stackId={stack ? "s" : undefined}
            isAnimationActive={false}
          />
          <Line
            dataKey="line"
            yAxisId="right"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </section>
    </>
  );
}
