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
