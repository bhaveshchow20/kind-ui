import { LineChart, type LineChartProps, type LineSeriesProps } from "@kind-ui/charts";
import { createRef } from "react";

type Row = { month: string; total: number; other: number | null };
const data: Row[] = [{ month: "Jan", total: 0, other: null }];
const config = { total: { label: "Total", color: "red" } };
const props: LineChartProps<Row> = {
  data,
  config,
  "aria-label": "Totals",
  ref: createRef<SVGSVGElement>(),
  children: null,
};
void (
  <LineChart {...props}>
    <LineChart.XAxis dataKey="month" tickFormatter={(value) => String(value)} />
    <LineChart.YAxis />
    <LineChart.Series<Row, number>
      dataKey={(row) => row.total}
      seriesKey="total"
      material="clay"
      pointStyle="border"
      activePointStyle="colored-border"
      onClick={(_curve, event) => {
        const path: SVGPathElement = event.currentTarget;
        void path;
      }}
    />
    <LineChart.Tooltip />
    <LineChart.Legend />
  </LineChart>
);
void (
  <LineChart config={config} data={data} aria-label="Explicit" layout="vertical">
    {null}
  </LineChart>
);
const numeric: LineSeriesProps<{ 0: number; name: string }, number> = {
  seriesKey: "total",
  dataKey: 0,
};
void numeric;
// @ts-expect-error Each chart requires configuration metadata.
const missingMetadata: LineChartProps<Row> = { data, children: null, "aria-label": "Totals" };
// @ts-expect-error Each chart requires an accessible name.
const missingName: LineChartProps<Row> = { data, config, children: null };
// @ts-expect-error Configuration does not generate content when children are omitted.
const missingChildren: LineChartProps<Row> = { data, config, "aria-label": "Totals" };
// @ts-expect-error Controlled and default visibility cannot coexist.
const twoOwners: LineChartProps<Row> = {
  data,
  config,
  "aria-label": "Totals",
  children: null,
  visibleSeries: [],
  defaultVisibleSeries: [],
};
// @ts-expect-error Typed series accessors receive the row shape.
const badAccessor: (row: Row) => number = (row) => row.typo;
const invalid: LineSeriesProps<Row, number> = {
  seriesKey: "total",
  // @ts-expect-error Numeric series accessors cannot return string values.
  dataKey: (row: Row) => row.month,
};
const invalidMarker: LineSeriesProps<Row, number> = {
  seriesKey: "total",
  dataKey: "total",
  // @ts-expect-error Marker styles are a closed union.
  pointStyle: "glow",
};
void [
  missingMetadata,
  missingName,
  missingChildren,
  twoOwners,
  badAccessor,
  invalid,
  invalidMarker,
];
