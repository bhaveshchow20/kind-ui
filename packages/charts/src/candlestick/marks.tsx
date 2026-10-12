"use client";

import {
  type ComponentProps,
  type ComponentPropsWithRef,
  createContext,
  type ReactNode,
  use,
  useId,
  useLayoutEffect,
  useRef,
} from "react";
import {
  Bar,
  type BarShapeProps,
  DefaultZIndexes,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  YAxis,
  ZIndexLayer,
} from "recharts";
import { type InteractionPaint, useInteractionOpacity } from "../animation.js";
import { useChart } from "../chart-context.js";
import { useLineInteraction } from "../line-chart.js";
import { SeriesInteractionLayer, useSeriesInteraction } from "../series-interaction.js";
import { type NativePoint, useCandlestick } from "./context.js";
import type { CandlestickDatum, CandlestickPoint } from "./model.js";
import { getCandlestickVisiblePoints } from "./viewport.js";
export type CandlestickMarkProps = Omit<ComponentPropsWithRef<"g">, "children"> & {
  center: number;
  width: number;
  open: number;
  high: number;
  low: number;
  close: number;
  direction: "rising" | "falling" | "unchanged";
};
export function CandlestickMark({
  center,
  width,
  open,
  high,
  low,
  close,
  direction,
  ...props
}: CandlestickMarkProps) {
  return (
    <g
      data-kind-ui="candlestick-mark"
      data-direction={direction}
      fill="currentColor"
      stroke="currentColor"
      {...props}
    >
      <line data-candle-part="wick" x1={center} x2={center} y1={high} y2={low} />
      {open === close ? (
        <line
          data-candle-part="doji"
          x1={center - width / 2}
          x2={center + width / 2}
          y1={open}
          y2={open}
        />
      ) : (
        <rect
          data-candle-part="body"
          x={center - width / 2}
          y={Math.min(open, close)}
          width={width}
          height={Math.abs(open - close)}
        />
      )}
    </g>
  );
}
export type CandlestickSeriesProps<Row extends object = CandlestickDatum> = {
  seriesKey: string;
  rising?: string;
  falling?: string;
  unchanged?: string;
  barSize?: number;
  maxBarSize?: number;
  markProps?: Omit<ComponentPropsWithRef<"g">, "children">;
  shape?: (
    props: CandlestickMarkProps & { point: CandlestickPoint<Row>; native: BarShapeProps },
  ) => ReactNode;
};
const ShapeContext = createContext<CandlestickSeriesProps | null>(null);
function CandleShape(native: BarShapeProps) {
  const options = use(ShapeContext);
  const context = useCandlestick();
  const x = useXAxisScale();
  const y = useYAxisScale();
  if (!options || !x || !y) return null;
  const point = native.payload as NativePoint;
  if (
    point.gap ||
    point.open === undefined ||
    point.close === undefined ||
    point.low === undefined ||
    point.high === undefined
  )
    return null;
  const coordinates = [
    x(point.coordinate),
    y(point.open),
    y(point.high),
    y(point.low),
    y(point.close),
  ];
  if (!coordinates.every((value) => typeof value === "number" && Number.isFinite(value)))
    return null;
  const [center, open, high, low, close] = coordinates as [number, number, number, number, number];
  const direction =
    point.close > point.open ? "rising" : point.close < point.open ? "falling" : "unchanged";
  const props: CandlestickMarkProps = {
    ...options.markProps,
    center,
    width: Math.max(1, Math.min(native.width, options.maxBarSize ?? 24)),
    open,
    high,
    low,
    close,
    direction,
    color: options.markProps?.color ?? options[direction] ?? native.fill ?? "currentColor",
    role: options.markProps?.role ?? "img",
    strokeWidth: options.markProps?.strokeWidth ?? 1.5,
    "aria-label":
      options.markProps?.["aria-label"] ??
      `${context.formatTime(point.time, point)}: open ${context.formatPrice(point.open, point)}, high ${context.formatPrice(point.high, point)}, low ${context.formatPrice(point.low, point)}, close ${context.formatPrice(point.close, point)}`,
  };
  return (
    <g clipPath={`url(#${context.priceClipId})`}>
      <g clipPath={`url(#${context.revealClipId})`}>
        {options.shape ? (
          options.shape({ ...props, point: point as CandlestickPoint<CandlestickDatum>, native })
        ) : (
          <CandlestickMark {...props} />
        )}
      </g>
    </g>
  );
}
const renderCandle = (native: BarShapeProps) => <CandleShape {...native} />;
const candleExtent = (value: unknown) => {
  const point = value as NativePoint;
  return point.gap ? null : [point.low, point.high];
};
export function CandlestickSeries<Row extends object = CandlestickDatum>(
  props: CandlestickSeriesProps<Row>,
) {
  useCandlestick();
  return (
    <ShapeContext value={props as CandlestickSeriesProps}>
      <CandlestickBar
        seriesKey={props.seriesKey}
        dataKey={candleExtent}
        shape={renderCandle}
        activeBar={false}
        {...(props.barSize !== undefined ? { barSize: props.barSize } : {})}
        maxBarSize={props.maxBarSize ?? 24}
      />
    </ShapeContext>
  );
}
export type CandlestickVolumeProps = Omit<
  ComponentProps<typeof Bar>,
  | "dataKey"
  | "yAxisId"
  | "isAnimationActive"
  | "xAxisId"
  | "stackId"
  | "data"
  | "minPointSize"
  | "background"
  | "layout"
> & {
  seriesKey: string;
  axisProps?: Omit<
    ComponentProps<typeof YAxis>,
    "yAxisId" | "domain" | "padding" | "scale" | "type" | "dataKey"
  >;
};
export function CandlestickVolume({ seriesKey, axisProps, ...props }: CandlestickVolumeProps) {
  if (Object.hasOwn(props, "data") || Object.hasOwn(props, "minPointSize"))
    throw new Error(
      "Candlestick Volume uses validated root observations and truthful volume heights",
    );
  const context = useCandlestick();
  const area = usePlotArea();
  const id = useId();
  useLayoutEffect(() => context.registerVolume(id), [context.registerVolume, id]);
  const max = getCandlestickVisiblePoints(context.points, context.viewport).reduce(
    (value, point) => Math.max(value, point.volume ?? 0),
    0,
  );
  return (
    <>
      <YAxis
        {...axisProps}
        yAxisId="candlestick-volume"
        domain={[0, max || 1]}
        allowDataOverflow
        padding={{ top: (area?.height ?? 0) * (1 - context.volumeRatio) + 8 }}
        tickFormatter={axisProps?.tickFormatter ?? ((value) => context.formatVolume(Number(value)))}
      />
      <CandlestickBar
        {...props}
        seriesKey={seriesKey}
        dataKey="volume"
        yAxisId="candlestick-volume"
        activeBar={false}
        shape={props.shape ?? renderVolume}
      />
    </>
  );
}
function VolumeShape(native: BarShapeProps) {
  const x = useXAxisScale();
  const context = useCandlestick();
  const point = native.payload as NativePoint;
  const center = x?.(point.coordinate);
  if (typeof center !== "number" || point.volume === undefined || point.gap) return null;
  return (
    <g clipPath={`url(#${context.volumeClipId})`}>
      <rect
        clipPath={`url(#${context.revealClipId})`}
        data-kind-ui="candlestick-volume-mark"
        x={center - native.width / 2}
        y={native.y}
        width={native.width}
        height={native.height}
        fill={native.fill}
        stroke={native.stroke}
        strokeWidth={native.strokeWidth}
        fillOpacity={native.fillOpacity}
        opacity={native.opacity}
        className={native.className}
        style={native.style}
      />
    </g>
  );
}
const renderVolume = (native: BarShapeProps) => <VolumeShape {...native} />;

/** Native registered Bars avoid a full Motion component inside strict LazyMotion. */
function CandlestickBar({
  seriesKey,
  fill,
  hide,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Bar>, "isAnimationActive"> & { seriesKey: string }) {
  const chart = useChart();
  const { registerSeries } = useLineInteraction();
  const generated = useId();
  const id = props.id ?? generated;
  const hidden =
    hide === true ||
    (chart.visibleSeries !== undefined && !chart.visibleSeries.includes(seriesKey));
  useLayoutEffect(() => registerSeries(id, seriesKey), [registerSeries, id, seriesKey]);
  const interaction = useSeriesInteraction(seriesKey, hidden, hide === true, undefined, onClick);
  return (
    <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.bar}>
      <SeriesInteractionLayer seriesKey={seriesKey} hidden={hidden} paint={CandlestickSeriesPaint}>
        <Bar
          {...props}
          zIndex={0}
          id={id}
          hide={hidden}
          fill={fill ?? chart.paints[seriesKey] ?? "currentColor"}
          isAnimationActive={false}
          {...(interaction.onClick ? { onClick: interaction.onClick } : {})}
        />
      </SeriesInteractionLayer>
    </ZIndexLayer>
  );
}

/** Plain SVG subscribes to shared Motion opacity without mounting a full motion component. */
function CandlestickSeriesPaint({
  opacity: factor,
  identity,
  children,
  "data-kind-ui": kind,
  className,
}: Parameters<typeof InteractionPaint>[0]) {
  const opacity = useInteractionOpacity(factor, identity);
  const paint = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    const node = paint.current;
    if (!node) return;
    node.style.opacity = String(opacity.get());
    return opacity.on("change", (value) => {
      node.style.opacity = String(value);
    });
  }, [opacity]);
  return (
    <g ref={paint} data-kind-ui={kind} className={className} style={{ opacity: opacity.get() }}>
      {children}
    </g>
  );
}
