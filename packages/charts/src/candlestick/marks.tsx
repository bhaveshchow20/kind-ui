"use client";

import {
  type ComponentProps,
  type ComponentPropsWithRef,
  cloneElement,
  createContext,
  Fragment,
  isValidElement,
  memo,
  type ReactNode,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
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
import {
  type Context,
  type NativePoint,
  useCandlestick,
  useCandlestickSeriesTarget,
} from "./context.js";
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
type ShapeOptions = CandlestickSeriesProps &
  Pick<Context, "formatTime" | "formatPrice" | "priceClipId" | "revealClipId"> & {
    latestIdentity?: string;
    xScale: ReturnType<typeof useXAxisScale>;
    yScale: ReturnType<typeof useYAxisScale>;
    frame: string;
    points: NativePoint[];
    labels: WeakMap<NativePoint, string>;
  };
const ShapeContext = createContext<ShapeOptions | null>(null);
const HistoricalCandlestickMark = memo(CandlestickMark);
function CandleShape(native: BarShapeProps) {
  const options = use(ShapeContext);
  return options ? renderCandlePoint(native, options) : null;
}
function renderCandlePoint(native: BarShapeProps, options: ShapeOptions, unclipped = false) {
  const x = options?.xScale;
  const y = options?.yScale;
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
  let label = options.markProps?.["aria-label"] ?? options.labels.get(point);
  if (label === undefined) {
    label = `${options.formatTime(point.time, point)}: open ${options.formatPrice(point.open, point)}, high ${options.formatPrice(point.high, point)}, low ${options.formatPrice(point.low, point)}, close ${options.formatPrice(point.close, point)}`;
    options.labels.set(point, label);
  }
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
    "aria-label": label,
  };
  const mark = options.shape ? (
    options.shape({ ...props, point: point as CandlestickPoint<CandlestickDatum>, native })
  ) : options.latestIdentity !== point.identity ? (
    <HistoricalCandlestickMark {...props} />
  ) : (
    <LatestCandlestickMark
      {...props}
      point={point}
      seriesKey={options.seriesKey}
      frame={options.frame}
      latest={options.latestIdentity === point.identity}
    />
  );
  return unclipped ? (
    mark
  ) : (
    <g clipPath={`url(#${options.priceClipId})`}>
      <g clipPath={`url(#${options.revealClipId})`}>{mark}</g>
    </g>
  );
}
function LatestCandlestickMark({
  point,
  seriesKey,
  latest,
  frame,
  ...props
}: CandlestickMarkProps & {
  point: NativePoint;
  seriesKey: string;
  latest: boolean;
  frame: string;
}) {
  const mark = useRef<SVGGElement>(null);
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
function DefaultCandleLayer({ native }: { native: BarShapeProps }) {
  const options = use(ShapeContext);
  if (!options) return null;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Native mark activation shares the series keyboard target.
    <g
      clipPath={`url(#${options.priceClipId})`}
      onClick={native.onClick as ComponentProps<"g">["onClick"]}
    >
      <g clipPath={`url(#${options.revealClipId})`}>
        {options.points.map((point) => (
          <Fragment key={point.identity}>
            {renderCandlePoint({ ...native, payload: point }, options, true)}
          </Fragment>
        ))}
      </g>
    </g>
  );
}

const candleExtent = (value: unknown) => {
  const point = value as NativePoint;
  return point.gap ? null : [point.low, point.high];
};
export function CandlestickSeries<Row extends object = CandlestickDatum>(
  props: CandlestickSeriesProps<Row>,
) {
  const context = useCandlestick();
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  // Keep mounted marks during the layout-only handoff between owned and implicit native axes.
  const committedScales = useRef({ x: xScale, y: yScale });
  useLayoutEffect(() => {
    if (xScale) committedScales.current.x = xScale;
    if (yScale) committedScales.current.y = yScale;
  }, [xScale, yScale]);
  const area = usePlotArea();
  const frame = `${area?.x},${area?.y},${area?.width},${area?.height}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: Formatter identity invalidates cached accessible labels.
  const labels = useMemo(
    () => new WeakMap<NativePoint, string>(),
    [context.formatTime, context.formatPrice],
  );
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
        xScale: props.shape ? xScale : (xScale ?? committedScales.current.x),
        yScale: props.shape ? yScale : (yScale ?? committedScales.current.y),
        frame,
        points: context.rendered,
        labels,
        formatTime: context.formatTime,
        formatPrice: context.formatPrice,
        priceClipId: context.priceClipId,
        revealClipId: context.revealClipId,
        ...(latestIdentity ? { latestIdentity } : {}),
      }}
    >
      <CandlestickBar
        seriesKey={props.seriesKey}
        dataKey={candleExtent}
        shape={props.shape ? renderCandle : renderWidthProbe}
        {...(!props.shape ? { defaultLayer: "candle" as const } : {})}
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
  preserveWidth?: boolean;
  points?: NativePoint[];
  nativeProps?: Partial<BarShapeProps>;
  xScale?: ReturnType<typeof useXAxisScale>;
  volumeClipId?: string;
  revealClipId?: string;
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
  const denseDefault =
    props.shape === undefined &&
    props.children === undefined &&
    !props.label &&
    !Object.keys(props).some((key) => key.startsWith("on"));
  const area = usePlotArea();
  const xScale = useXAxisScale();
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
        value={{
          shape: props.shape,
          points: context.rendered,
          nativeProps: {
            stroke: props.stroke,
            strokeWidth: props.strokeWidth,
            fillOpacity: props.fillOpacity,
            opacity: props.opacity,
            ...(props.className !== undefined ? { className: props.className } : {}),
            ...(props.style !== undefined ? { style: props.style } : {}),
          },
          xScale,
          volumeClipId: context.volumeClipId,
          revealClipId: context.revealClipId,
          fill: props.fill,
          rising,
          falling,
          unchanged,
          preserveWidth: props.barSize !== undefined || props.maxBarSize !== undefined,
        }}
      >
        <CandlestickBar
          {...props}
          seriesKey={seriesKey}
          regionClip={{ pane: context.volumeClipId, reveal: context.revealClipId }}
          dataKey="volume"
          yAxisId="candlestick-volume"
          activeBar={false}
          shape={denseDefault ? renderWidthProbe : renderVolume}
          {...(denseDefault ? { defaultLayer: "volume" as const } : {})}
        />
      </VolumeShapeContext>
    </>
  );
}
function VolumeShape(native: BarShapeProps) {
  const options = use(VolumeShapeContext);
  const option = options.shape;
  const x = options.xScale;
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
  // Native grouping can make dense default bars subpixel; match the candle's legible minimum.
  const width = options.preserveWidth ? native.width : Math.max(1, native.width);
  return (
    <g clipPath={`url(#${options.volumeClipId})`}>
      <rect
        clipPath={`url(#${options.revealClipId})`}
        data-kind-ui="candlestick-volume-mark"
        data-direction={direction}
        x={center - width / 2}
        y={native.y}
        width={width}
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

function DefaultVolumeLayer({ native }: { native: BarShapeProps }) {
  const options = use(VolumeShapeContext);
  const y = useYAxisScale("candlestick-volume");
  if (!y) return null;
  const baseline = y(0);
  if (typeof baseline !== "number") return null;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Native mark activation shares the series keyboard target.
    <g onClick={native.onClick as ComponentProps<"g">["onClick"]}>
      {options.points?.map((point) => {
        const top = y(point.volume ?? 0);
        if (typeof top !== "number") return null;
        return (
          <VolumeShape
            key={point.identity}
            {...native}
            {...options.nativeProps}
            payload={point}
            y={top}
            height={baseline - top}
          />
        );
      })}
    </g>
  );
}
const WidthContext = createContext<((width: number) => void) | null>(null);
function WidthProbe({ width }: { width: number }) {
  const report = use(WidthContext);
  useLayoutEffect(() => {
    report?.(width);
  }, [report, width]);
  return null;
}
// Native shape indexes enumerate surviving rectangles, including after leading gaps.
const renderWidthProbe = (native: BarShapeProps) =>
  native.index === 0 && typeof native.width === "number" ? (
    <WidthProbe width={native.width} />
  ) : null;

// The invisible native carrier retains real data keys/tooltip payloads, but needs only one
// grouped width. Undefined scale results skip unrelated native rectangles before prop adaptation.
function carrierScale(
  accepted: readonly number[],
  domain: number[] = [0, 1],
  range: number[] = [0, 1],
) {
  const scale = (value: number) =>
    accepted.includes(value) ? range[value === accepted[0] ? 0 : range.length - 1] : undefined;
  scale.domain = (next?: number[]) => {
    if (next === undefined) return domain.slice();
    domain = next.slice();
    return scale;
  };
  scale.range = (next?: number[]) => {
    if (next === undefined) return range.slice();
    range = next.slice();
    return scale;
  };
  scale.copy = () => carrierScale(accepted, domain, range);
  return scale;
}
const RegisteredBar = memo(Bar);
/** Native registered Bars avoid a full Motion component inside strict LazyMotion. */
function CandlestickBar({
  seriesKey,
  fill,
  hide,
  onClick,
  regionClip,
  defaultLayer,
  ...props
}: Omit<ComponentProps<typeof Bar>, "isAnimationActive"> & {
  seriesKey: string;
  regionClip?: { pane: string; reveal: string };
  defaultLayer?: "candle" | "volume";
}) {
  const [width, setWidth] = useState(0);
  const reportWidth = useCallback(
    (next: number) => setWidth((previous) => (previous === next ? previous : next)),
    [],
  );
  const context = useCandlestick();
  const first = context.rendered.find(
    (point) =>
      !point.gap &&
      (defaultLayer === "volume"
        ? point.volume !== undefined
        : point.low !== undefined && point.high !== undefined),
  );
  const low = defaultLayer === "volume" ? 0 : first?.low;
  const high = defaultLayer === "volume" ? first?.volume : first?.high;
  const privateAxis = useId();
  const optimizedCarrier =
    defaultLayer === "volume" || (defaultLayer === "candle" && context.hasPriceAxis);
  const carrier = useMemo(
    () => carrierScale(low === undefined || high === undefined ? [] : [low, high]),
    [low, high],
  );
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
    <RegisteredBar
      {...props}
      zIndex={0}
      {...(optimizedCarrier ? { yAxisId: privateAxis } : {})}
      id={id}
      hide={hidden}
      fill={fill ?? chart.paints[seriesKey] ?? "currentColor"}
      isAnimationActive={false}
      {...(!defaultLayer && interaction.onClick ? { onClick: interaction.onClick } : {})}
    />
  );
  const native = { width, onClick: interaction.onClick } as unknown as BarShapeProps;
  const sibling =
    hidden || width <= 0 ? null : defaultLayer === "candle" ? (
      <DefaultCandleLayer native={native} />
    ) : defaultLayer === "volume" ? (
      <DefaultVolumeLayer native={native} />
    ) : null;
  const content = (
    <WidthContext value={reportWidth}>
      {optimizedCarrier ? (
        <YAxis
          yAxisId={privateAxis}
          hide
          width={0}
          type="number"
          domain={[0, 1]}
          allowDataOverflow
          scale={carrier as NonNullable<ComponentProps<typeof YAxis>["scale"]>}
        />
      ) : null}
      {bar}
      {sibling}
    </WidthContext>
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
            <g clipPath={`url(#${regionClip.reveal})`}>{content}</g>
          </g>
        ) : (
          content
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
