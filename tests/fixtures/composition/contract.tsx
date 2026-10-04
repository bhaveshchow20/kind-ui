import * as Chart from "@kind-ui/charts";
import { createRef } from "react";
import type * as Native from "recharts";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// The engine declarations are the independent oracle, including generic signatures.
export type NativePropParity = [
  Expect<Equal<Chart.ActiveDotProps, Native.ActiveDotProps>>,
  Expect<Equal<Chart.AreaRevealShapeProps, Native.AreaRevealShapeProps>>,
  Expect<Equal<Chart.AxisDomainItem, Native.AxisDomainItem>>,
  Expect<Equal<Chart.BarShapeProps, Native.BarShapeProps>>,
  Expect<Equal<Chart.BarStackProps, Native.BarStackProps>>,
  Expect<Equal<Chart.BrushProps, Native.BrushProps>>,
  Expect<Equal<Chart.CartesianGridProps, Native.CartesianGridProps>>,
  Expect<Equal<Chart.CellProps, Native.CellProps>>,
  Expect<Equal<Chart.Coordinate, Native.Coordinate>>,
  Expect<Equal<Chart.CurveProps, Native.CurveProps>>,
  Expect<Equal<Chart.DataKey<{ value: number }>, Native.DataKey<{ value: number }>>>,
  Expect<Equal<Chart.DotItemDotProps, Native.DotItemDotProps>>,
  Expect<Equal<Chart.DotProps, Native.DotProps>>,
  Expect<Equal<Chart.ErrorBarProps, Native.ErrorBarProps>>,
  Expect<Equal<Chart.LabelListProps, Native.LabelListProps>>,
  Expect<Equal<Chart.LabelProps, Native.LabelProps>>,
  Expect<Equal<Chart.LineDrawShapeProps, Native.LineDrawShapeProps>>,
  Expect<Equal<Chart.Margin, Native.Margin>>,
  Expect<Equal<Chart.NumberDomain, Native.NumberDomain>>,
  Expect<Equal<Chart.PieLabelRenderProps, Native.PieLabelRenderProps>>,
  Expect<Equal<Chart.PieSectorShapeProps, Native.PieSectorShapeProps>>,
  Expect<Equal<Chart.PolarAngleAxisProps, Native.PolarAngleAxisProps>>,
  Expect<Equal<Chart.PolarGridProps, Native.PolarGridProps>>,
  Expect<Equal<Chart.PolarRadiusAxisProps, Native.PolarRadiusAxisProps>>,
  Expect<Equal<Chart.PolygonProps, Native.PolygonProps>>,
  Expect<Equal<Chart.RadialBarSectorProps, Native.RadialBarSectorProps>>,
  Expect<Equal<Chart.RectangleProps, Native.RectangleProps>>,
  Expect<Equal<Chart.ReferenceAreaProps, Native.ReferenceAreaProps>>,
  Expect<Equal<Chart.ReferenceDotProps, Native.ReferenceDotProps>>,
  Expect<Equal<Chart.ReferenceLineProps, Native.ReferenceLineProps>>,
  Expect<Equal<Chart.ResponsiveContainerProps, Native.ResponsiveContainerProps>>,
  Expect<Equal<Chart.ScaleFunction, Native.ScaleFunction>>,
  Expect<Equal<Chart.ScatterShapeProps, Native.ScatterShapeProps>>,
  Expect<Equal<Chart.SectorProps, Native.SectorProps>>,
  Expect<Equal<Chart.SymbolsProps, Native.SymbolsProps>>,
  Expect<Equal<Chart.TooltipRenderProps, Native.TooltipContentProps>>,
  Expect<Equal<Chart.TooltipPayloadEntry, Native.TooltipPayloadEntry>>,
  Expect<Equal<Chart.TooltipValueType, Native.TooltipValueType>>,
  Expect<Equal<Chart.XAxisProps, Native.XAxisProps>>,
  Expect<Equal<Chart.XAxisTickContentProps, Native.XAxisTickContentProps>>,
  Expect<Equal<Chart.YAxisProps, Native.YAxisProps>>,
  Expect<Equal<Chart.YAxisTickContentProps, Native.YAxisTickContentProps>>,
  Expect<Equal<Chart.ZAxisProps, Native.ZAxisProps>>,
  Expect<
    Equal<Chart.XAxisProps<{ value: number }, number>, Native.XAxisProps<{ value: number }, number>>
  >,
  Expect<
    Equal<
      Chart.PolarAngleAxisProps<{ value: number }, number>,
      Native.PolarAngleAxisProps<{ value: number }, number>
    >
  >,
  Expect<Equal<Chart.BrushProps, Native.BrushProps>>,
  Expect<
    Equal<Chart.TooltipRenderProps<number, string>, Native.TooltipContentProps<number, string>>
  >,
];

type Row = { category: string; value: number };
const x: Chart.XAxisProps<Row, number> = {
  dataKey: (row) => row.value,
  tickMargin: 8,
  tickFormatter: (value) => String(value),
  onClick: (_tick, _index, event) => {
    const node: SVGElement = event.currentTarget;
    void node;
  },
};
const angle: Chart.PolarAngleAxisProps<Row, string> = { dataKey: (row) => row.category };
const brush: Chart.BrushProps = {
  dataKey: (row: Row) => row.value,
  onChange: ({ startIndex, endIndex }) => void [startIndex, endIndex],
};
void [x, angle, brush];
void (<Chart.XAxis<Row, number> {...x} />);
void (<Chart.PolarAngleAxis<Row, string> {...angle} />);
void (
  <Chart.Rectangle
    ref={createRef<SVGPathElement>()}
    onClick={(event) => {
      const path: SVGPathElement = event.currentTarget;
      void path;
    }}
  />
);
void (<Chart.Curve pathRef={createRef<SVGPathElement>()} />);
// @ts-expect-error Explicit numeric axes retain upstream value constraints.
void (<Chart.XAxis<Row, number> dataKey="category" />);
// @ts-expect-error Native axis accessors reject incompatible return values.
void (<Chart.XAxis<Row, number> dataKey={(row) => row.category} />);
// @ts-expect-error No invented axis ref is introduced by the package.
void (<Chart.XAxis ref={createRef<SVGPathElement>()} />);
