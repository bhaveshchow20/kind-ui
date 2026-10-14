"use client";

import { type ComponentPropsWithRef, type ReactNode, useId, useLayoutEffect, useRef } from "react";
import { DefaultZIndexes, usePlotArea, useYAxisScale, ZIndexLayer } from "recharts";
import { useChart } from "../chart-context.js";
import { useCandlestick } from "./context.js";
import { useLatestCandlestickGeometry } from "./latest-motion.js";
import type { CandlestickDatum, CandlestickPoint } from "./model.js";

export const candlestickDirectionColors = {
  rising: "#15803d",
  falling: "#be123c",
  unchanged: "#64748b",
};
export type CandlestickCurrentPriceProps<Row extends object = CandlestickDatum> = Omit<
  ComponentPropsWithRef<"g">,
  "children"
> & {
  seriesKey?: string;
  orientation?: "left" | "right";
  lineVisible?: boolean;
  axisLabelVisible?: boolean;
  rising?: string;
  falling?: string;
  unchanged?: string;
  lineProps?: ComponentPropsWithRef<"line">;
  labelProps?: ComponentPropsWithRef<"g">;
  labelTextColor?: string;
  children?: (point: CandlestickPoint<Row>, label: string) => ReactNode;
};

/** The last observed close remains independent of transient inspection and persistent selection. */
export function CandlestickCurrentPrice<Row extends object = CandlestickDatum>({
  seriesKey,
  orientation = "right",
  lineVisible = true,
  axisLabelVisible = true,
  rising,
  falling,
  unchanged,
  lineProps,
  labelProps,
  labelTextColor = "white",
  children,
  color,
  ...props
}: CandlestickCurrentPriceProps<Row>) {
  const context = useCandlestick();
  const chart = useChart();
  const area = usePlotArea();
  const scale = useYAxisScale();
  const observations = context.points.filter((point) => !point.gap && point.close !== undefined);
  const point = observations.at(-1);
  const prior = observations.at(-2)?.close ?? point?.open;
  const last = useRef<{
    price: number | undefined;
    original: object | undefined;
    direction: "rising" | "falling" | "unchanged";
  }>({ price: prior, original: point?.original, direction: "unchanged" });
  const value = point?.close;
  const direction =
    value === last.current.price
      ? point?.original !== last.current.original
        ? "unchanged"
        : last.current.direction
      : value !== undefined && last.current.price !== undefined
        ? value > last.current.price
          ? "rising"
          : value < last.current.price
            ? "falling"
            : "unchanged"
        : "unchanged";
  useLayoutEffect(() => {
    last.current = { price: value, original: point?.original, direction };
  }, [value, direction, point?.original]);
  const y = value === undefined ? undefined : scale?.(value);
  const moving = useRef<SVGGElement>(null);
  const labelMoving = useRef<SVGGElement>(null);
  const labelId = useId();
  const reserveLabel = () => {
    const node = labelMoving.current;
    const label = node?.firstElementChild;
    context.axisLabels.set(
      labelId,
      axisLabelVisible ? node : null,
      0,
      label instanceof SVGElement ? label : node,
    );
  };
  useLayoutEffect(() => {
    reserveLabel();
    return () => context.axisLabels.set(labelId, null);
  });
  const frame = `${area?.x},${area?.y},${area?.width},${area?.height}`;
  useLatestCandlestickGeometry(
    `price:${seriesKey ?? ""}`,
    point?.identity ?? "",
    frame,
    `${point?.identity}:${value}`,
    [typeof y === "number" ? y : 0],
    !!point,
    true,
    ([position]) => {
      moving.current?.setAttribute("transform", `translate(0 ${position})`);
      labelMoving.current?.setAttribute("transform", `translate(0 ${position})`);
      reserveLabel();
    },
  );
  if (
    !point ||
    value === undefined ||
    !area ||
    typeof y !== "number" ||
    !Number.isFinite(y) ||
    y < area.y ||
    y > area.y + area.height * (1 - context.volumeRatio) ||
    (seriesKey && chart.visibleSeries && !chart.visibleSeries.includes(seriesKey))
  )
    return null;
  const label = context.formatPrice(value, point);
  const width = Math.max(44, label.length * 7 + 16);
  const x = orientation === "right" ? area.x + area.width : area.x - width;
  const paint =
    color ?? { rising, falling, unchanged }[direction] ?? candlestickDirectionColors[direction];
  return (
    <ZIndexLayer zIndex={DefaultZIndexes.cursorLine}>
      <g
        data-kind-ui="candlestick-current-price"
        data-direction={direction}
        color={paint}
        pointerEvents="none"
        {...props}
      >
        {lineVisible && (
          <g clipPath={`url(#${context.priceClipId})`}>
            <g ref={moving} transform={`translate(0 ${y})`}>
              <line
                data-current-price-part="line"
                x1={area.x}
                x2={area.x + area.width}
                y1={0}
                y2={0}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray="4 3"
                {...lineProps}
              />
            </g>
          </g>
        )}
        {axisLabelVisible && (
          <g ref={labelMoving} transform={`translate(0 ${y})`}>
            <g
              data-current-price-part="label"
              role={labelProps?.role ?? "img"}
              aria-label={`Current price ${label}`}
              transform={`translate(${x} -11)`}
              {...labelProps}
            >
              {children ? (
                children(point as unknown as CandlestickPoint<Row>, label)
              ) : (
                <>
                  <rect width={width} height={22} rx={4} fill="currentColor" />
                  <text
                    x={width / 2}
                    y={15}
                    textAnchor="middle"
                    fill={labelTextColor}
                    fontSize={11}
                  >
                    {label}
                  </text>
                </>
              )}
            </g>
          </g>
        )}
      </g>
    </ZIndexLayer>
  );
}
