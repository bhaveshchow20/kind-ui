"use client";

import {
  type ComponentProps,
  type ComponentPropsWithRef,
  cloneElement,
  createContext,
  isValidElement,
  type ReactNode,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  Bar,
  type BarShapeProps,
  DefaultZIndexes,
  Rectangle,
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
import { type NativePoint, useCandlestick, useCandlestickSeriesTarget } from "./context.js";
import { candlestickDirectionColors } from "./current-price.js";
import { useLatestCandlestickGeometry } from "./latest-motion.js";
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
const ShapeContext = createContext<(CandlestickSeriesProps & { latestIdentity?: string }) | null>(
  null,
);
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
    color: options.markProps?.color ?? options[direction] ?? candlestickDirectionColors[direction],
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
          <LatestCandlestickMark
            {...props}
            point={point}
            seriesKey={options.seriesKey}
            latest={options.latestIdentity === point.identity}
          />
        )}
      </g>
    </g>
  );
}
function LatestCandlestickMark({
  point,
  seriesKey,
  latest,
  ...props
}: CandlestickMarkProps & { point: NativePoint; seriesKey: string; latest: boolean }) {
  const area = usePlotArea();
  const mark = useRef<SVGGElement>(null);
  const frame = `${area?.x},${area?.y},${area?.width},${area?.height}`;
  useLatestCandlestickGeometry(
    `candle:${seriesKey}`,
    point.identity,
    frame,
    `${point.open},${point.high},${point.low},${point.close}`,
    [props.center, props.width, props.open, props.high, props.low, props.close],
    latest,
    false,
    ([
      center = props.center,
      width = props.width,
      open = props.open,
      high = props.high,
      low = props.low,
      close = props.close,
    ]) => {
      const node = mark.current;
      if (!node) return;
      const wick = node.querySelector('[data-candle-part="wick"]');
      for (const [key, value] of Object.entries({ x1: center, x2: center, y1: high, y2: low }))
        wick?.setAttribute(key, String(value));
      const body = node.querySelector('[data-candle-part="body"]');
      for (const [key, value] of Object.entries({
        x: center - width / 2,
        y: Math.min(open, close),
        width,
        height: Math.abs(open - close),
      }))
        body?.setAttribute(key, String(value));
      const doji = node.querySelector('[data-candle-part="doji"]');
      for (const [key, value] of Object.entries({
        x1: center - width / 2,
        x2: center + width / 2,
        y1: close,
        y2: close,
      }))
        doji?.setAttribute(key, String(value));
    },
  );
  return (
    <g ref={mark}>
      <CandlestickMark {...props} />
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
  const context = useCandlestick();
  const latestIdentity = useMemo(() => {
    for (let index = context.points.length - 1; index >= 0; index--) {
      const point = context.points[index];
      if (point && !point.gap) return point.identity;
    }
    return undefined;
  }, [context.points]);
  return (
    <ShapeContext
      value={{
        ...(props as CandlestickSeriesProps),
        ...(latestIdentity ? { latestIdentity } : {}),
      }}
    >
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
  rising?: string;
  falling?: string;
  unchanged?: string;
  axisProps?: Omit<
    ComponentProps<typeof YAxis>,
    "yAxisId" | "domain" | "padding" | "scale" | "type" | "dataKey"
  >;
};
const VolumeShapeContext = createContext<{
  shape?: CandlestickVolumeProps["shape"];
  fill?: string | undefined;
  rising?: string | undefined;
  falling?: string | undefined;
  unchanged?: string | undefined;
}>({});
export function CandlestickVolume({
  seriesKey,
  axisProps,
  rising,
  falling,
  unchanged,
  ...props
}: CandlestickVolumeProps) {
  for (const key of [
    "dataKey",
    "yAxisId",
    "isAnimationActive",
    "xAxisId",
    "stackId",
    "data",
    "minPointSize",
    "background",
    "layout",
  ] as const) {
    if (Object.hasOwn(props, key))
      throw new Error(
        `Candlestick Volume cannot set ${key}; geometry uses validated root observations and truthful volume heights`,
      );
  }
  if (axisProps !== undefined) {
    for (const key of ["yAxisId", "domain", "padding", "scale", "type", "dataKey"] as const) {
      if (Object.hasOwn(axisProps, key))
        throw new Error(
          `Candlestick Volume axisProps cannot set ${key}; the aligned volume axis owns its geometry`,
        );
    }
  }
  const context = useCandlestick();
  const area = usePlotArea();
  const id = useId();
  useLayoutEffect(() => context.registerVolume(id), [context.registerVolume, id]);
  const max = getCandlestickVisiblePoints(context.points, context.viewport).reduce(
    (value, point) => Math.max(value, point.volume ?? 0),
    0,
  );
  const domain = useMemo<[number, number]>(() => [0, max || 1], [max]);
  const top = (area?.height ?? 0) * (1 - context.volumeRatio) + 8;
  const padding = useMemo(() => ({ top }), [top]);
  const defaultFormatter = useCallback(
    (value: unknown) => context.formatVolume(Number(value)),
    [context.formatVolume],
  );
  return (
    <>
      <YAxis
        {...axisProps}
        yAxisId="candlestick-volume"
        domain={domain}
        allowDataOverflow
        padding={padding}
        tickFormatter={axisProps?.tickFormatter ?? defaultFormatter}
      />
      <VolumeShapeContext
        value={{ shape: props.shape, fill: props.fill, rising, falling, unchanged }}
      >
        <CandlestickBar
          {...props}
          seriesKey={seriesKey}
          regionClip={{ pane: context.volumeClipId, reveal: context.revealClipId }}
          dataKey="volume"
          yAxisId="candlestick-volume"
          activeBar={false}
          shape={renderVolume}
        />
      </VolumeShapeContext>
    </>
  );
}
function VolumeShape(native: BarShapeProps) {
  const options = use(VolumeShapeContext);
  const option = options.shape;
  const x = useXAxisScale();
  const context = useCandlestick();
  const point = native.payload as NativePoint;
  const center = x?.(point.coordinate);
  if (
    typeof center !== "number" ||
    point.volume === undefined ||
    point.gap ||
    point.close === undefined ||
    point.open === undefined
  )
    return null;
  const direction =
    point.close > point.open ? "rising" : point.close < point.open ? "falling" : "unchanged";
  const centered = {
    ...native,
    x: center - native.width / 2,
    fill: options.fill ?? options[direction] ?? candlestickDirectionColors[direction],
    fillOpacity: native.fillOpacity ?? 0.35,
  };
  // Preserve native shape dispatch and explicit consumer props after supplying the owned X geometry.
  if (isValidElement<BarShapeProps>(option))
    return cloneElement(option, { ...centered, ...option.props });
  if (typeof option === "function") return option(centered);
  if (option !== undefined)
    return (
      <Rectangle
        {...centered}
        {...(typeof option === "object" && !isValidElement(option) ? option : {})}
      />
    );
  return (
    <g clipPath={`url(#${context.volumeClipId})`}>
      <rect
        clipPath={`url(#${context.revealClipId})`}
        data-kind-ui="candlestick-volume-mark"
        data-direction={direction}
        x={center - native.width / 2}
        y={native.y}
        width={native.width}
        height={native.height}
        fill={centered.fill}
        stroke={native.stroke}
        strokeWidth={native.strokeWidth}
        fillOpacity={centered.fillOpacity}
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
  regionClip,
  ...props
}: Omit<ComponentProps<typeof Bar>, "isAnimationActive"> & {
  seriesKey: string;
  regionClip?: { pane: string; reveal: string };
}) {
  const chart = useChart();
  const { registerSeries } = useLineInteraction();
  const generated = useId();
  const id = props.id ?? generated;
  const hidden =
    hide === true ||
    (chart.visibleSeries !== undefined && !chart.visibleSeries.includes(seriesKey));
  const keyboardTarget = useCandlestickSeriesTarget(seriesKey, hidden);
  useLayoutEffect(() => registerSeries(id, seriesKey), [registerSeries, id, seriesKey]);
  const interaction = useSeriesInteraction(seriesKey, hidden, hide === true, undefined, onClick);
  const bar = (
    <Bar
      {...props}
      zIndex={0}
      id={id}
      hide={hidden}
      fill={fill ?? chart.paints[seriesKey] ?? "currentColor"}
      isAnimationActive={false}
      {...(interaction.onClick ? { onClick: interaction.onClick } : {})}
    />
  );
  return (
    <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.bar}>
      <SeriesInteractionLayer
        seriesKey={seriesKey}
        hidden={hidden}
        paint={CandlestickSeriesPaint}
        keyboardTarget={keyboardTarget}
      >
        {regionClip ? (
          <g clipPath={`url(#${regionClip.pane})`}>
            <g clipPath={`url(#${regionClip.reveal})`}>{bar}</g>
          </g>
        ) : (
          bar
        )}
      </SeriesInteractionLayer>
    </ZIndexLayer>
  );
}

/** Plain SVG subscribes to shared Motion opacity without mounting a full motion component. */
export function CandlestickSeriesPaint({
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
