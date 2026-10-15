"use client";

import {
  CartesianGrid,
  type CartesianGridProps,
  XAxis as NativeXAxis,
  YAxis as NativeYAxis,
  ZAxis as NativeZAxis,
  type XAxisProps,
  type YAxisProps,
  type ZAxisProps,
} from "recharts";

export const axisTick = {
  fontSize: 12,
  fill: "var(--muted-foreground, #6b7280)",
};
export function Grid(props: CartesianGridProps) {
  return (
    <CartesianGrid
      vertical={false}
      stroke="var(--border, #d1d5db)"
      strokeDasharray="3 3"
      {...props}
    />
  );
}
export function XAxis<DataPoint = unknown, DataValue = unknown>(
  props: XAxisProps<DataPoint, DataValue>,
) {
  return <NativeXAxis axisLine={false} tickLine={false} tick={axisTick} {...props} />;
}
export function YAxis<DataPoint = unknown, DataValue = unknown>(
  props: YAxisProps<DataPoint, DataValue>,
) {
  return <NativeYAxis axisLine={false} tickLine={false} tick={axisTick} {...props} />;
}
export function ScatterXAxis<DataPoint = unknown, DataValue = unknown>(
  props: XAxisProps<DataPoint, DataValue>,
) {
  return <XAxis type="number" {...props} />;
}
export function ScatterYAxis<DataPoint = unknown, DataValue = unknown>(
  props: YAxisProps<DataPoint, DataValue>,
) {
  return <YAxis type="number" {...props} />;
}
export function ZAxis<DataPoint = unknown, DataValue = unknown>(
  props: ZAxisProps<DataPoint, DataValue>,
) {
  return <NativeZAxis {...props} />;
}
