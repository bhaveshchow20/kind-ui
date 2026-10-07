import * as Chart from "@kind-ui/charts";
import { Cell, Curve, LabelList, Rectangle } from "@kind-ui/charts";
import { type ComponentProps, createRef, type MouseEvent } from "react";
import { Bar, Line } from "recharts";

type Row = { id: string; value: number; nullable: number | null; range: [number, number] };
const rows: Row[] = [{ id: "a", value: 2, nullable: null, range: [1, 3] }];
type NativeLine = ComponentProps<typeof Line<Row, number>>;
type NativeBar = ComponentProps<typeof Bar<Row, number>>;

// Explicit row/value parameters follow the installed native component contracts.
const lineProps: Chart.LineSeriesProps<Row, number> = {
  data: rows,
  dataKey: "value",
  seriesKey: "value",
  material: "clay",
  connectNulls: true,
  strokeDasharray: "3 2",
  shape: <Curve pathRef={createRef<SVGPathElement>()} />,
  onClick: (curve, event) => {
    const width: string | number | undefined = curve.strokeWidth;
    const path: SVGPathElement = event.currentTarget;
    void [width, path];
  },
};
const barProps: Chart.BarSeriesProps<Row, number> = {
  dataKey: "value",
  seriesKey: "value",
  material: "clay",
  projection: {
    isProjected: (row) => row.id === "a",
    pattern: { kind: "hatch" },
  },
  radius: [3, 3, 0, 0],
  stackId: "stack",
  xAxisId: "category",
  yAxisId: "quantity",
  emphasisKey: (payload) => (payload === rows[0] ? "a" : undefined),
  shape: <Rectangle ref={createRef<SVGPathElement>()} />,
  onClick: (rectangle, index, event) => {
    const value: number | [number, number] = rectangle.value;
    const position: number = index;
    const path: SVGPathElement = event.currentTarget;
    void [value, position, path];
  },
};
void (
  <Chart.Root config={{ value: { label: "Value", color: "red" } }}>
    <Chart.ComboChart data={rows}>
      <Chart.LineSeries<Row, number> {...lineProps}>
        <LabelList dataKey="value" />
      </Chart.LineSeries>
      <Chart.BarSeries<Row, number> {...barProps}>
        <Cell fill="blue" />
        <LabelList dataKey="value" />
      </Chart.BarSeries>
    </Chart.ComboChart>
  </Chart.Root>
);

const nativeLineProps: Omit<NativeLine, "isAnimationActive"> = lineProps;
const nativeBarProps: Omit<NativeBar, "isAnimationActive"> = barProps;
void (<Chart.LineSeries<Row, number> {...nativeLineProps} />);
void (<Chart.BarSeries<Row, number> {...nativeBarProps} />);
void (<Chart.LineSeries<Row, number> data={rows} dataKey={(row) => row.value} />);
void (<Chart.BarSeries<Row, number> dataKey={(row) => row.value} />);
void (<Chart.LineSeries<Row, number | null> dataKey="nullable" />);
void (<Chart.BarSeries<Row, [number, number]> dataKey="range" />);
void (<Chart.LineSeries<Row> dataKey="id" />);
void (<Chart.BarSeries<Row> dataKey="id" />);
void (<Chart.LineSeries<{ 0: number; 1: string }, number> dataKey={0} />);
void (<Chart.BarSeries<[number, string], number> dataKey="0" />);

// Default/inferred calls still support chart-owned rows, typed accessors and open keys.
void (<Chart.LineSeries dataKey="chartOwnedKey" />);
void (<Chart.BarSeries dataKey="chartOwnedKey" />);
void (<Chart.LineSeries data={rows} dataKey="value" />);
void (<Chart.LineSeries data={rows} dataKey={(row) => row.value} />);
void (<Chart.LineSeries dataKey={(row: Row) => row.value} />);
void (<Chart.BarSeries dataKey={(row: Row) => row.value} />);
const legacyLineProps: Chart.LineSeriesProps = {
  data: rows,
  dataKey: (row: Row) => row.value,
};
const legacyBarProps: Chart.BarSeriesProps = { dataKey: "chartOwnedKey" };
void [legacyLineProps, legacyBarProps];
const dynamicKey: string = rows.map((row) => row.id).join("");
void (<Line data={rows} dataKey={dynamicKey} />);
void (<Chart.LineSeries data={rows} dataKey={dynamicKey} />);
void (<Line data={[{ metrics: { value: 2 } }]} dataKey="metrics.value" />);
void (<Chart.LineSeries data={[{ metrics: { value: 2 } }]} dataKey="metrics.value" />);

// Negative native cases act as the oracle for the wrappers' explicit parameters.
// @ts-expect-error Native numeric keys exclude misspellings.
void (<Line<Row, number> dataKey="typo" />);
// @ts-expect-error Native numeric keys exclude misspellings.
void (<Bar<Row, number> dataKey="typo" />);
// @ts-expect-error The public animated Line retains the row generic.
void (<Chart.LineSeries<Row, number> dataKey="typo" />);
// @ts-expect-error The public Bar retains the row generic.
void (<Chart.BarSeries<Row, number> dataKey="typo" />);
// @ts-expect-error Row fields must also match the selected native value type.
void (<Line<Row, number> dataKey="id" />);
// @ts-expect-error Row fields must also match the selected native value type.
void (<Bar<Row, number> dataKey="id" />);
// @ts-expect-error The public Line retains the value generic.
void (<Chart.LineSeries<Row, number> dataKey="id" />);
// @ts-expect-error The public Bar retains the value generic.
void (<Chart.BarSeries<Row, number> dataKey="id" />);
// @ts-expect-error A typed native accessor must return the selected value type.
void (<Line<Row, number> dataKey={(row) => row.id} />);
// @ts-expect-error A typed native accessor must return the selected value type.
void (<Bar<Row, number> dataKey={(row) => row.id} />);
// @ts-expect-error A typed Line accessor must return the selected value type.
void (<Chart.LineSeries<Row, number> dataKey={(row) => row.id} />);
// @ts-expect-error A typed Bar accessor must return the selected value type.
void (<Chart.BarSeries<Row, number> dataKey={(row) => row.id} />);
// @ts-expect-error Accessors receive the declared row.
void (<Chart.LineSeries<Row, number> dataKey={(row) => row.typo} />);
// @ts-expect-error Accessors receive the declared row.
void (<Chart.BarSeries<Row, number> dataKey={(row) => row.typo} />);
// @ts-expect-error Line's own data retains the row type.
void (<Chart.LineSeries<Row, number> data={[{ id: "a", value: "wrong" }]} />);
// @ts-expect-error Typed prop objects reject misspelled keys too.
const badLineProps: Chart.LineSeriesProps<Row, number> = { dataKey: "typo" };
// @ts-expect-error Typed prop objects reject incompatible fields too.
const badBarProps: Chart.BarSeriesProps<Row, number> = { dataKey: "id" };
void [badLineProps, badBarProps];

// Generics preserve native ref/handler boundaries and Kind's existing prop exclusions.
// @ts-expect-error Native Line has no component ref; use a shape's pathRef.
void (<Line<Row, number> ref={createRef<SVGPathElement>()} />);
// @ts-expect-error Native Bar has no component ref; use a shape's ref.
void (<Bar<Row, number> ref={createRef<SVGPathElement>()} />);
// @ts-expect-error The public Line retains the native ref boundary.
void (<Chart.LineSeries<Row, number> ref={createRef<SVGPathElement>()} />);
// @ts-expect-error The public Bar retains the native ref boundary.
void (<Chart.BarSeries<Row, number> ref={createRef<SVGPathElement>()} />);
const htmlHandler = (curve: ComponentProps<typeof Curve>, event: MouseEvent<HTMLDivElement>) =>
  void [curve, event];
// @ts-expect-error Native Line's handler event targets an SVG path.
void (<Line<Row, number> onClick={htmlHandler} />);
// @ts-expect-error The public Line retains the native SVG event target.
void (<Chart.LineSeries<Row, number> onClick={htmlHandler} />);
// @ts-expect-error Bar's first handler argument is a native rectangle, not the declared row.
void (<Chart.BarSeries<Row, number> onClick={(row: Row) => void row} />);
// @ts-expect-error Kind continues to own engine animation.
void (<Chart.LineSeries<Row, number> isAnimationActive />);
// @ts-expect-error Kind continues to own engine animation.
void (<Chart.BarSeries<Row, number> isAnimationActive />);
// @ts-expect-error Existing material vocabulary stays bounded.
void (<Chart.LineSeries<Row, number> material="metal" />);
// @ts-expect-error Existing material vocabulary stays bounded.
void (<Chart.BarSeries<Row, number> material="metal" />);

// Radar selection preserves typed native composition and makes controlled ownership explicit.
void (
  <Chart.RadarChart<Row>
    selection="series"
    data={rows}
    selectedSeries="value"
    onSelectedSeriesChange={(next: string | null) => void next}
  >
    <Chart.RadarSeries<Row, number> dataKey="value" />
  </Chart.RadarChart>
);
void (
  <Chart.RadarChart<Row>
    selection="series"
    data={rows}
    onSelectedSeriesChange={(next: string | null) => void next}
  />
);
const radarSelection: Chart.RadarSelectionProps = {
  selection: "series",
  selectedSeries: null,
  onSelectedSeriesChange: (next) => void next,
};
void radarSelection;
// @ts-expect-error Controlled Radar selection requires its owner callback.
void (<Chart.RadarChart selectedSeries="value" selection="series" />);
// @ts-expect-error The selection target is a series key, never a row index.
void (<Chart.RadarChart selectedSeries={1} onSelectedSeriesChange={() => {}} />);
// @ts-expect-error No implicit spoke selection or universal emphasis mode is exposed.
void (<Chart.RadarChart selection="category" />);

const invalidProjection: Chart.BarProjection<Row> = {
  // @ts-expect-error selection returns a boolean, not a forecast value
  isProjected: (row) => row.value,
  pattern: { kind: "dots" },
};
void invalidProjection;
