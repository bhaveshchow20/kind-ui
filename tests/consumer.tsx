import * as Chart from "@kind-ui/charts";
import { Legend, Root, type SeriesConfig, TooltipContent } from "@kind-ui/charts";
import { createRef } from "react";
import { Line, LineChart, Tooltip } from "recharts";

const config = {
  count: { label: "Tasks", color: "#2563eb", formatValue: (value) => `${value}` },
} satisfies SeriesConfig;
const ref = createRef<HTMLDivElement>();
const component = (
  <Root
    config={config}
    visibleSeries={["count"]}
    onVisibleSeriesChange={() => {}}
    ref={ref}
    aria-label="Chart"
  >
    <Legend ref={createRef<HTMLUListElement>()} />
    <LineChart width={300} height={200} data={[{ count: 0 }]}>
      <Line dataKey="count" stroke="var(--color-count)" />
      <Tooltip
        content={(tooltip) => <TooltipContent tooltip={tooltip} ref={ref} className="custom" />}
      />
    </LineChart>
  </Root>
);
void component;
const rootProps = { config, ref } satisfies Chart.RootProps;
const legendProps = { ref: createRef<HTMLUListElement>() } satisfies Chart.LegendProps;
const namespaceComponent = (
  <Chart.Root {...rootProps}>
    <Chart.Legend {...legendProps} />
    <LineChart width={300} height={200} data={[{ count: 0 }]}>
      <Line dataKey="count" stroke="var(--color-count)" />
      <Tooltip
        content={(tooltip) => {
          const props = { tooltip, ref } satisfies Chart.TooltipContentProps;
          return <Chart.TooltipContent {...props} />;
        }}
      />
    </LineChart>
  </Chart.Root>
);
void namespaceComponent;
// @ts-expect-error A change callback requires consumer-owned visibility.
const invalidControl = <Root config={config} onVisibleSeriesChange={() => {}} />;
// @ts-expect-error Series colors must be CSS strings.
const invalidConfig: SeriesConfig = { count: { label: "Tasks", color: 1 } };
void invalidControl;
void invalidConfig;

// All animation modes share the public components and declarations.
void (
  <Chart.Root config={config}>
    <Chart.LineChart width={300} height={200} ref={createRef<SVGSVGElement>()}>
      <Chart.LineSeries
        dataKey={(point: { count: number }) => point.count}
        seriesKey="count"
        dot={false}
      />
      <Chart.Tooltip
        ref={createRef<HTMLDivElement>()}
        frameProps={{ onFocus: (event) => event.currentTarget.focus() }}
      />
    </Chart.LineChart>
  </Chart.Root>
);
// @ts-expect-error The old motion prop is not part of the public API.
void (<Chart.LineChart motion={{ revealDurationMs: 10 }} />);
// @ts-expect-error Recharts Line does not provide a component ref; use a custom shape's pathRef.
void (<Chart.LineSeries dataKey="count" ref={createRef<SVGPathElement>()} />);
// @ts-expect-error Kind owns the bounded tooltip anchor.
void (<Chart.Tooltip position={{ x: 0, y: 0 }} />);

for (const animate of [
  false,
  true,
  { revealDurationMs: 10, hoverTransition: { duration: 0.2 } },
] satisfies Chart.LineChartProps["animate"][]) {
  void (<Chart.LineChart animate={animate} />);
}
// @ts-expect-error Motion owns animation; Recharts animation cannot compete.
void (<Chart.LineSeries dataKey="count" isAnimationActive />);
// @ts-expect-error Invalid animation configuration.
void (<Chart.LineChart animate={{ revealDurationMs: "fast" }} />);

for (const material of ["plain", "paper", "clay"] satisfies Chart.LineMaterial[]) {
  void (
    <Chart.LineSeries
      dataKey="count"
      material={material}
      stroke="var(--host-color)"
      strokeWidth={4}
    />
  );
}
// @ts-expect-error Material is independent of palette and limited to the supported SVG options.
void (<Chart.LineSeries dataKey="count" material="neon" />);

for (const material of ["plain", "paper", "clay", "glow"] satisfies Chart.AreaMaterial[]) {
  void (<Chart.AreaSeries dataKey="count" material={material} fill="url(#host-gradient)" />);
}
// @ts-expect-error Unsupported area finish.
void (<Chart.AreaSeries dataKey="count" material="neon" />);
for (const material of ["plain", "paper", "clay", "glow"] satisfies Chart.BarMaterial[]) {
  void (<Chart.BarSeries dataKey="count" material={material} radius={[3, 3, 0, 0]} />);
}
// @ts-expect-error Bar finishes use the established material vocabulary.
void (<Chart.BarSeries dataKey="count" material="metal" />);
const categoryKey: NonNullable<Chart.TooltipProps["itemKey"]> = (entry) => String(entry.payload.id);
void (<Chart.PieChart defaultPinnedCategory="beta" />);
// @ts-expect-error Initial identity is a category string, never a row index.
void (<Chart.PieChart defaultPinnedCategory={1} />);
void (<Chart.Tooltip itemKey={categoryKey} />);
const categoryContent: Chart.TooltipContentProps = {
  tooltip: {
    active: true,
    payload: [],
    activeIndex: "0",
    coordinate: undefined,
    accessibilityLayer: true,
  },
  itemKey: categoryKey,
};
void categoryContent;

const radialLabel: Chart.RadialBarLabelProps = {
  show: true,
  fontSize: 12,
  minFontSize: 9,
  padding: 2,
  ref: (node) => {
    if (node) node.dataset.owner = "consumer";
    return () => {};
  },
};
void radialLabel;
// @ts-expect-error Ring fitting requires a numeric pixel font size.
const invalidRadialLabel: Chart.RadialBarLabelProps = { fontSize: "12px" };
void invalidRadialLabel;
function TaskIcon() {
  return <svg aria-hidden="true" viewBox="0 0 16 16" />;
}
const iconConfig = {
  count: { label: "Tasks", color: "var(--tasks)", icon: TaskIcon },
} satisfies SeriesConfig;
void (
  <Chart.Root config={iconConfig}>
    <Chart.Legend hideIcon>
      {({ key, label, visible, marker }) => (
        <>
          {marker}
          <span data-key={key}>
            {label}: {visible ? "Shown" : "Hidden"}
          </span>
        </>
      )}
    </Chart.Legend>
    <LineChart>
      <Tooltip
        content={(tooltip) => (
          <Chart.TooltipContent
            tooltip={tooltip}
            indicator="dashed"
            hideIndicator
            hideLabel
            itemKey={(entry) => String(entry.dataKey)}
          />
        )}
      />
    </LineChart>
  </Chart.Root>
);
for (const indicator of [
  "dot",
  "line",
  "dashed",
] satisfies Chart.TooltipContentProps["indicator"][]) {
  void (
    <LineChart>
      <Tooltip
        content={(tooltip) => <Chart.TooltipContent tooltip={tooltip} indicator={indicator} />}
      />
    </LineChart>
  );
}
void (
  <LineChart>
    <Tooltip
      // @ts-expect-error Unsupported decorative marker.
      content={(tooltip) => <Chart.TooltipContent tooltip={tooltip} indicator="triangle" />}
    />
  </LineChart>
);
// @ts-expect-error Icons are renderable component types, not arbitrary strings.
const invalidIcon: SeriesConfig = { count: { label: "Tasks", color: "red", icon: "task" } };
void invalidIcon;

for (const legendShape of [
  "circle",
  "cross",
  "diamond",
  "square",
  "star",
  "triangle",
  "wye",
] as const) {
  const sharedConfig = {
    search: { label: "Search", color: "#333", legendShape },
  } satisfies SeriesConfig;
  void (
    <Chart.Root config={sharedConfig}>
      <Chart.Legend />
      <Chart.ScatterChart>
        <Chart.ScatterSeries seriesKey="search" shape={sharedConfig.search.legendShape} />
      </Chart.ScatterChart>
    </Chart.Root>
  );
}
const invalidLegendShape: SeriesConfig = {
  // @ts-expect-error Only native scatter symbols belong in legendShape; custom glyphs use icon/children.
  search: { label: "Search", color: "#333", legendShape: "hexagon" },
};
const invalidLegendRenderer: SeriesConfig = {
  // @ts-expect-error Custom point callbacks are not legend renderers.
  search: { label: "Search", color: "#333", legendShape: () => <svg /> },
};
void invalidLegendShape;
void invalidLegendRenderer;

export function CompleteNamespaceChart() {
  return (
    <Chart.Root config={{ count: { label: "Count", color: "#4055ee" } }}>
      <Chart.ResponsiveContainer width="100%" height={240}>
        <Chart.LineChart
          data={[{ month: "Jan", count: 0 }]}
          animate
          accessibilityLayer
          aria-label="Count by month"
        >
          <Chart.CartesianGrid vertical={false} />
          <Chart.XAxis dataKey="month" />
          <Chart.YAxis />
          <Chart.ReferenceLine y={0} />
          <Chart.LineSeries dataKey="count" />
          <Chart.Tooltip />
        </Chart.LineChart>
      </Chart.ResponsiveContainer>
      <Chart.Legend />
    </Chart.Root>
  );
}

const clockwisePie = {
  animate: true,
  animationDirection: "clockwise",
} satisfies Chart.PieChartProps;
const anticlockwisePie = {
  animate: { revealDurationMs: 600 },
  animationDirection: "anticlockwise",
} satisfies Chart.PieChartProps;
// @ts-expect-error Entrance direction has two explicit physical sweep values.
const invalidPieDirection = { animationDirection: "reverse" } satisfies Chart.PieChartProps;
void [clockwisePie, anticlockwisePie, invalidPieDirection];

const inferredConfig = { monthlyVisitors: { color: "#3659b8" } } satisfies SeriesConfig;
const inferredRoot = (
  <Root config={inferredConfig}>
    <Legend>{({ label }) => label.toUpperCase()}</Legend>
  </Root>
);
void inferredRoot;
// @ts-expect-error Labels remain strings when supplied.
const invalidInferredLabel: SeriesConfig = { visitors: { label: 123, color: "red" } };
void invalidInferredLabel;

const fillPattern: Chart.FillPattern = {
  kind: "hatch",
  color: "CanvasText",
  size: 10,
  width: 2,
  angle: 45,
};
void (<Chart.BarSeries dataKey="count" pattern={fillPattern} material="clay" />);
void (<Chart.BarSeries dataKey="count" pattern="none" fill="url(#host)" />);
void (<Chart.FillPatternSwatch pattern={{ kind: "duotone" }} color="var(--color-count)" />);
const patternConfig: Chart.SeriesConfig = { count: { color: "red", pattern: fillPattern } };
void patternConfig;
// @ts-expect-error Patterns expose explicit encodings.
void (<Chart.BarSeries dataKey="count" pattern={{ kind: "dots" }} />);

for (const revealDirection of [
  "left-to-right",
  "right-to-left",
  "center-out",
  "edges-in",
] satisfies Chart.RevealDirection[]) {
  const line = { revealDirection } satisfies Chart.LineAnimation;
  const area = { revealDirection } satisfies Chart.AreaAnimation;
  const combo = {
    revealDirection,
    lineReveal: { revealDirection: "right-to-left" },
    areaReveal: { revealDirection: "edges-in" },
    barReveal: false,
  } satisfies Chart.ComboAnimation;
  void (<Chart.LineChart animate={line} />);
  void (<Chart.AreaChart animate={area} />);
  void (<Chart.ComboChart animate={combo} />);
}
// @ts-expect-error Direction names are a closed physical-direction union.
const invalidReveal: Chart.LineAnimation = { revealDirection: "up" };
// @ts-expect-error Direction overrides belong to Line and Area families only.
const invalidBarReveal: Chart.ComboAnimation = { barReveal: { revealDirection: "center-out" } };
// @ts-expect-error Entrance configuration is chart/family-owned, not a native series prop.
void (<Chart.LineSeries dataKey="count" revealDirection="center-out" />);
void [invalidReveal, invalidBarReveal];

// @ts-expect-error Horizontal reveal directions do not belong to Bar entrances.
const invalidBarDirection: Chart.BarAnimation = { revealDirection: "edges-in" };
// @ts-expect-error Polar sweeps keep their existing direction contract.
const invalidPieReveal: Chart.PieAnimation = { revealDirection: "center-out" };
void [invalidBarDirection, invalidPieReveal];

// Complete README directional example, checked through packed public exports.
import {
  AreaChart,
  AreaSeries,
  ComboChart,
  LineChart as DirectionalLineChart,
  Root as DirectionalRoot,
  LineSeries,
} from "@kind-ui/charts";

const directionalData = [
  { day: "Mon", total: 12, forecast: 16 },
  { day: "Tue", total: 20, forecast: 24 },
];
const directionalConfig = {
  total: { label: "Total", color: "#3659b8" },
  forecast: { label: "Forecast", color: "#0d9488" },
} satisfies SeriesConfig;

export function DirectionalCharts() {
  return (
    <DirectionalRoot config={directionalConfig}>
      <DirectionalLineChart
        data={directionalData}
        width={480}
        height={240}
        aria-label="Daily total"
        animate={{ revealDirection: "right-to-left", revealDurationMs: 800 }}
      >
        <LineSeries dataKey="total" pointStyle="border" />
      </DirectionalLineChart>
      <AreaChart
        data={directionalData}
        width={480}
        height={240}
        aria-label="Daily forecast"
        animate={{ revealDirection: "center-out" }}
      >
        <AreaSeries dataKey="forecast" />
      </AreaChart>
      <ComboChart
        data={directionalData}
        width={480}
        height={240}
        aria-label="Total and forecast"
        animate={{
          revealDirection: "center-out",
          lineReveal: { revealDirection: "right-to-left" },
          areaReveal: { revealDirection: "edges-in", revealDurationMs: 1200 },
          barReveal: false,
        }}
      >
        <LineSeries dataKey="total" />
        <AreaSeries dataKey="forecast" />
      </ComboChart>
    </DirectionalRoot>
  );
}

// @ts-expect-error Radar keeps its center-out entrance contract.
const invalidRadarReveal: Chart.RadarAnimation = { revealDirection: "center-out" };
// @ts-expect-error RadialBar keeps its polar sweep contract.
const invalidRadialReveal: Chart.RadialBarAnimation = { revealDirection: "edges-in" };
// @ts-expect-error Scatter has no horizontal reveal direction option.
const invalidScatterReveal: Chart.ScatterAnimation = { revealDirection: "right-to-left" };
void [invalidRadarReveal, invalidRadialReveal, invalidScatterReveal];

const dashTiming = { durationMs: 700, direction: "reverse" } satisfies Chart.LineDashAnimation;
const dashedLine = (
  <Chart.LineSeries dataKey="count" strokeDasharray="6 4" dashAnimation={dashTiming} />
);
// @ts-expect-error Dash direction is explicit.
const invalidDash = <Chart.LineSeries dataKey="count" dashAnimation={{ direction: "left" }} />;
// @ts-expect-error Area perimeter animation is not the open-line contract.
const invalidAreaDash = <Chart.AreaSeries dataKey="count" dashAnimation={{}} />;
void [dashedLine, invalidDash, invalidAreaDash];

const selectiveGlow = {
  data: [{ id: "design", value: 10 }],
  dataKey: "value",
  categoryKey: "id",
  glowCategories: ["design", "removed"] as const,
  material: "paper",
} satisfies Chart.PieSeriesProps<{ id: string; value: number }>;
const accessorGlow = {
  ...selectiveGlow,
  categoryKey: (row: { id: string; value: number }) => row.id,
} satisfies Chart.PieSeriesProps<{ id: string; value: number }>;
void (<Chart.PieSeries {...selectiveGlow} />);
void (<Chart.PieSeries {...accessorGlow} />);
// @ts-expect-error Category identity is a string, not a positional index.
void (<Chart.PieSeries dataKey="value" glowCategories={[0]} />);

const sankeyIconConfig = {
  source: { label: "Legend source", color: "red", icon: <path d="M0 0h24v24z" /> },
  sink: { label: "Legend sink", color: "blue" },
} satisfies Chart.SankeyNodeConfig;
const sankeyIconData: Chart.SankeyFlowData = {
  nodes: [
    { id: "source", name: "Source" },
    { id: "sink", name: "Sink" },
  ],
  links: [{ id: "flow", source: "source", target: "sink", value: 7 }],
};
const sankeyIconConsumer = (
  <Chart.SankeyChart
    data={sankeyIconData}
    nodeConfig={sankeyIconConfig}
    node={(node) => (
      <g>
        <Chart.SankeyNode {...node} />
        <Chart.SankeyNodeLabel
          node={node}
          data={sankeyIconData}
          nodeConfig={sankeyIconConfig}
          iconSize={18}
          iconGap={3}
          position="outside"
          showValues
          ref={createRef<SVGTextElement>()}
        >
          <tspan>Custom name</tspan>
        </Chart.SankeyNodeLabel>
      </g>
    )}
  />
);
void sankeyIconConsumer;
