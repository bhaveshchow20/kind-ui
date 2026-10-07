import {
  type ConfiguredLineChartProps,
  type ConfiguredLineSeries,
  LineChart,
  type LineChartProps,
  Root,
} from "@kind-ui/charts";
import { createRef } from "react";

type Row = { month: string; total: number; other: number | null };
const data: Row[] = [{ month: "Jan", total: 0, other: null }];
const config = { total: { label: "Total", color: "red" } };
const props: ConfiguredLineChartProps<Row> = {
  data,
  config,
  xDataKey: (row) => row.month,
  "aria-label": "Totals",
  ref: createRef<SVGSVGElement>(),
  xAxis: { tickFormatter: (value) => String(value) },
  series: [
    {
      seriesKey: "total",
      dataKey: (row) => row.total,
      material: "clay",
      pointStyle: "border",
      activePointStyle: "colored-border",
      onClick: (_curve, event) => {
        const path: SVGPathElement = event.currentTarget;
        void path;
      },
    },
  ],
};
void (<LineChart {...props} />);
void (<LineChart config={config} data={data} xDataKey="month" aria-label="Totals" />);
void (
  <LineChart config={config} data={data} aria-label="Explicit" layout="vertical">
    {null}
  </LineChart>
);
void (
  <Root config={config}>
    <LineChart width={300} height={200} />
  </Root>
);
const legacy: LineChartProps = { data, children: null, animate: { revealDurationMs: 120 } };
void legacy;
const numeric: ConfiguredLineSeries<{ 0: number; name: string }> = {
  seriesKey: "total",
  dataKey: 0,
};
void numeric;
void (
  (
    // @ts-expect-error Generated configured charts require xDataKey.
    <LineChart data={data} config={config} aria-label="Totals" />
  )
);
void (
  (
    // @ts-expect-error Configured charts require an accessible name.
    <LineChart data={data} config={config} xDataKey="month" />
  )
);
void (
  (
    // @ts-expect-error Generated-part options cannot coexist with explicit children.
    <LineChart data={data} config={config} xDataKey="month" aria-label="Totals">
      {null}
    </LineChart>
  )
);
void (
  (
    // @ts-expect-error Controlled and default visibility cannot coexist.
    <LineChart
      data={data}
      config={config}
      xDataKey="month"
      aria-label="Totals"
      visibleSeries={[]}
      defaultVisibleSeries={[]}
    />
  )
);
void (
  (
    // @ts-expect-error Accessors receive the inferred row shape.
    <LineChart data={data} config={config} xDataKey={(row) => row.typo} aria-label="Totals" />
  )
);
// @ts-expect-error Function-key series must provide metadata identity.
const missingIdentity: ConfiguredLineSeries<Row> = { dataKey: (row) => row.total };
void missingIdentity;
// @ts-expect-error No data key is guessed for explicit series overrides.
const invalid: ConfiguredLineSeries<Row> = { seriesKey: "total" };
void invalid;

const invalidMarker: ConfiguredLineSeries<Row> = {
  seriesKey: "total",
  dataKey: "total",
  // @ts-expect-error Marker styles are a closed union.
  pointStyle: "glow",
};
void invalidMarker;
