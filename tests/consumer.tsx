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

// Static line declarations resolve without Motion installed.
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
// @ts-expect-error Motion options belong exclusively to the optional subpath.
void (<Chart.LineChart motion={{ revealDurationMs: 10 }} />);
// @ts-expect-error Recharts Line does not provide a component ref; use a custom shape's pathRef.
void (<Chart.LineSeries dataKey="count" ref={createRef<SVGPathElement>()} />);
// @ts-expect-error Kind owns the bounded tooltip anchor.
void (<Chart.Tooltip position={{ x: 0, y: 0 }} />);
