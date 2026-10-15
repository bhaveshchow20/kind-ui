"use client";

import {
  type ComponentProps,
  type ComponentPropsWithRef,
  isValidElement,
  type ReactNode,
  type Ref,
  type RefCallback,
  type RefObject,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  DefaultZIndexes,
  Line,
  ReferenceLine,
  useChartHeight,
  useChartWidth,
  usePlotArea,
  useXAxisInverseScale,
  useXAxisScale,
  useYAxisInverseScale,
  useYAxisScale,
  type XAxis,
  type YAxis,
  ZIndexLayer,
} from "recharts";
import { axisTick, Grid, XAxis as SharedXAxis, YAxis as SharedYAxis } from "../cartesian-parts.js";
import { useChart } from "../chart-context.js";
import { useChartInteraction } from "../chart-interaction.js";
import { OutsidePlot } from "../family-root.js";
import { useLineInteraction } from "../line-chart.js";
import { SeriesInteractionLayer, useSeriesInteraction } from "../series-interaction.js";
import { StaticTooltipFrame, TooltipBase, type TooltipFrameProps } from "../tooltip.js";
import { TooltipItem, tooltipClassName } from "../tooltip-content.js";
import { TooltipNumber } from "../tooltip-number.js";
import { cn } from "../utils.js";
import {
  type NativePoint,
  useCandlestick,
  useCandlestickInspection,
  useCandlestickSeriesTarget,
} from "./context.js";
import { candlestickDirectionColors } from "./current-price.js";
import { CandlestickSeriesPaint } from "./marks.js";
import type { CandlestickPoint, CandlestickRecord } from "./model.js";
import { getCandlestickVisiblePoints } from "./viewport.js";
export type CandlestickXAxisProps = Omit<
  ComponentProps<typeof XAxis>,
  "dataKey" | "type" | "domain" | "scale" | "xAxisId"
>;
export function CandlestickXAxis(props: CandlestickXAxisProps) {
  const context = useCandlestick();
  const pointsByCoordinate = useMemo(
    () => new Map(context.points.map((point) => [point.coordinate, point])),
    [context.points],
  );
  const observationTicks = useMemo(
    () =>
      getCandlestickVisiblePoints(context.points, context.viewport)
        .filter((point) => !point.gap)
        .map((point) => point.coordinate),
    [context.points, context.viewport],
  );
  const defaultFormatter = useCallback(
    (value: unknown) => {
      const point = pointsByCoordinate.get(Number(value));
      return point ? context.formatTime(point.time, point) : String(value);
    },
    [pointsByCoordinate, context.formatTime],
  );
  return (
    <SharedXAxis
      {...props}
      dataKey="coordinate"
      type="number"
      domain={context.timeDomain}
      scale="linear"
      allowDataOverflow
      ticks={props.ticks ?? observationTicks}
      tickFormatter={props.tickFormatter ?? defaultFormatter}
    />
  );
}
export type CandlestickYAxisProps = Omit<
  ComponentProps<typeof YAxis>,
  "domain" | "scale" | "yAxisId" | "padding" | "type" | "dataKey"
>;
export function CandlestickYAxis(props: CandlestickYAxisProps) {
  const context = useCandlestick();
  const area = usePlotArea();
  const id = `candlestick-price-ticks-${useId().replace(/:/g, "")}`;
  useLayoutEffect(() => context.registerPriceAxis(id), [context.registerPriceAxis, id]);
  const ordinary =
    props.tick !== false && typeof props.tick !== "function" && !isValidElement(props.tick);
  useLayoutEffect(() => {
    if (!ordinary || props.hide) return;
    let unregister: (() => void) | undefined;
    const register = () => {
      unregister?.();
      unregister = context.axisLabels.register(
        id,
        Array.from(document.getElementsByClassName(id)).filter(
          (node): node is SVGElement => node instanceof SVGElement,
        ),
      );
    };
    register();
    const frame = requestAnimationFrame(register);
    return () => {
      cancelAnimationFrame(frame);
      unregister?.();
    };
  });
  const bottom = (area?.height ?? 0) * context.volumeRatio;
  const padding = useMemo(() => ({ bottom }), [bottom]);
  const defaultFormatter = useCallback(
    (value: unknown) => context.formatPrice(Number(value)),
    [context.formatPrice],
  );
  const tick = useMemo(
    () =>
      ordinary
        ? {
            ...axisTick,
            ...(typeof props.tick === "object" ? props.tick : {}),
            className: cn(
              typeof props.tick === "object" && props.tick && "className" in props.tick
                ? String(props.tick.className ?? "")
                : "",
              id,
            ),
          }
        : props.tick,
    [ordinary, props.tick, id],
  );
  return (
    <SharedYAxis
      {...props}
      {...(tick !== undefined ? { tick } : {})}
      domain={context.priceDomain}
      scale={context.priceScale}
      allowDataOverflow
      padding={padding}
      tickFormatter={props.tickFormatter ?? defaultFormatter}
    />
  );
}
export const CandlestickGrid = Grid;
export type CandlestickOverlayProps<Row extends object = CandlestickRecord> = Omit<
  ComponentProps<typeof Line>,
  "dataKey" | "data" | "isAnimationActive" | "xAxisId" | "yAxisId"
> & {
  seriesKey: string;
  dataKey: (keyof Row & string) | ((row: Row) => number | null | undefined);
  includeInDomain?: boolean;
};
export function CandlestickOverlay<Row extends object = CandlestickRecord>({
  seriesKey,
  dataKey,
  includeInDomain = false,
  ...props
}: CandlestickOverlayProps<Row>) {
  for (const key of ["data", "xAxisId", "yAxisId"] as const) {
    if (Object.hasOwn(props, key))
      throw new Error(`Candlestick Overlay owns ${key}; omit this prop`);
  }
  const context = useCandlestick();
  const { visibleSeries, paints } = useChart();
  const { registerSeries } = useLineInteraction();
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const hidden =
    props.hide === true || (visibleSeries !== undefined && !visibleSeries.includes(seriesKey));
  const keyboardTarget = useCandlestickSeriesTarget(seriesKey, hidden);
  useLayoutEffect(() => registerSeries(id, seriesKey), [registerSeries, id, seriesKey]);
  const interaction = useSeriesInteraction(
    seriesKey,
    hidden,
    props.hide === true,
    undefined,
    props.onClick,
  );
  const observations = useMemo(
    () =>
      context.points.map((point, index) => {
        const original = point.original as Row;
        let value: unknown;
        try {
          value = typeof dataKey === "function" ? dataKey(original) : original[dataKey];
        } catch (cause) {
          throw new Error(`Candlestick overlay data[${index}]: accessor failed`, { cause });
        }
        if (value == null) return { point, value: null };
        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new Error(`Candlestick overlay data[${index}]: value must be finite or missing`);
        }
        return { point, value };
      }),
    [context.points, dataKey],
  );
  const validated = useMemo(() => {
    for (const [index, { value }] of observations.entries()) {
      if (value === null) continue;
      if (context.priceScale === "log" && value <= 0) {
        throw new Error(`Candlestick overlay data[${index}]: logarithmic values must be positive`);
      }
      if (
        includeInDomain &&
        context.priceBounds !== undefined &&
        (value < context.priceBounds[0] || value > context.priceBounds[1])
      ) {
        throw new Error(`Candlestick overlay data[${index}]: value is outside price bounds`);
      }
    }
    return observations;
  }, [observations, context.priceScale, context.priceBounds, includeInDomain]);
  const cachedValues = useMemo(
    () => new Map(validated.map(({ point, value }) => [point.identity, value])),
    [validated],
  );
  const read = useCallback(
    (point: NativePoint) => cachedValues.get(point.identity) ?? null,
    [cachedValues],
  );
  const values = useMemo(
    () =>
      validated.flatMap(({ value }, index) => {
        const visible =
          context.autoscale === "all" ||
          (index >= Math.ceil(context.viewport.from) && index <= Math.floor(context.viewport.to));
        return visible && value !== null ? [value] : [];
      }),
    [validated, context.autoscale, context.viewport.from, context.viewport.to],
  );
  useLayoutEffect(
    () => (includeInDomain ? context.registerOverlay(id, values) : undefined),
    [includeInDomain, context.registerOverlay, id, values],
  );
  return (
    <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.line}>
      <SeriesInteractionLayer
        seriesKey={seriesKey}
        hidden={hidden}
        keyboardTarget={keyboardTarget}
        paint={CandlestickSeriesPaint}
      >
        <g clipPath={`url(#${context.priceClipId})`}>
          <g clipPath={`url(#${context.revealClipId})`}>
            <Line
              {...props}
              {...(interaction.onClick !== undefined ? { onClick: interaction.onClick } : {})}
              zIndex={0}
              id={id}
              hide={hidden}
              dataKey={read}
              stroke={props.stroke ?? paints[seriesKey] ?? "currentColor"}
              isAnimationActive={false}
              dot={props.dot ?? false}
            />
          </g>
        </g>
      </SeriesInteractionLayer>
    </ZIndexLayer>
  );
}
export type CandlestickReferenceLineProps = Omit<
  ComponentProps<typeof ReferenceLine>,
  "ifOverflow" | "xAxisId" | "yAxisId"
> & { ifOverflow?: Exclude<ComponentProps<typeof ReferenceLine>["ifOverflow"], "extendDomain"> };
export function CandlestickReferenceLine(props: CandlestickReferenceLineProps) {
  const context = useCandlestick();
  if ("ifOverflow" in props && (props.ifOverflow as string) === "extendDomain")
    throw new Error("Candlestick reference annotations cannot extend the price domain");
  return (
    <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.line}>
      <g clipPath={`url(#${context.priceClipId})`}>
        <ReferenceLine {...props} zIndex={0} ifOverflow={props.ifOverflow ?? "hidden"} />
      </g>
    </ZIndexLayer>
  );
}
export type CandlestickCrosshairProps = ComponentPropsWithRef<"g"> & {
  mode?: "free" | "snap";
  showLabels?: boolean;
  labelProps?: Omit<ComponentPropsWithRef<"text">, "children">;
};
function composeCrosshairLabelRef(
  internal: RefObject<SVGTextElement | null>,
  consumer: Ref<SVGTextElement> | undefined,
): RefCallback<SVGTextElement> {
  return (node) => {
    internal.current = node;
    const cleanup = typeof consumer === "function" ? consumer(node) : undefined;
    if (consumer && typeof consumer !== "function") consumer.current = node;
    if (!node) return;
    return () => {
      internal.current = null;
      if (typeof cleanup === "function") cleanup();
      else if (typeof consumer === "function") consumer(null);
      else if (consumer) consumer.current = null;
    };
  };
}
export function CandlestickCrosshair({
  mode = "free",
  showLabels = true,
  labelProps,
  ...props
}: CandlestickCrosshairProps) {
  if (mode !== "free" && mode !== "snap")
    throw new Error("Candlestick Crosshair mode must be free or snap");
  const context = useCandlestick();
  const x = useXAxisScale();
  const y = useYAxisScale();
  const timeAt = useXAxisInverseScale();
  const priceAt = useYAxisInverseScale();
  const volumeAt = useYAxisInverseScale("candlestick-volume");
  const area = usePlotArea();
  const id = useId();
  const frame = useRef<SVGGElement>(null);
  const chartWidth = useChartWidth() ?? 0;
  const chartHeight = useChartHeight() ?? 0;
  const vertical = useRef<SVGLineElement>(null);
  const horizontal = useRef<SVGLineElement>(null);
  const timeLabel = useRef<SVGTextElement>(null);
  const priceLabel = useRef<SVGTextElement>(null);
  const timeLabelRef = useMemo(
    () => composeCrosshairLabelRef(timeLabel, labelProps?.ref),
    [labelProps?.ref],
  );
  const priceLabelRef = useMemo(
    () => composeCrosshairLabelRef(priceLabel, labelProps?.ref),
    [labelProps?.ref],
  );
  const timePill = useRef<SVGRectElement>(null);
  const pricePill = useRef<SVGRectElement>(null);
  const timeMarker = useRef<SVGGElement>(null);
  const priceMarker = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    let lastTime = "";
    let timeWidth = 0;
    let lastPrice = "";
    let priceWidth = 0;
    const update = () => {
      const node = frame.current;
      if (!node) return;
      if (!x || !y || !area || !context.points.length) {
        node.style.display = "none";
        context.axisLabels.set(id, null);
        return;
      }
      const cursor = mode === "free" ? context.pointer.get() : null;
      const local = cursor ? context.geometry.current?.local(cursor.clientX, cursor.clientY) : null;
      if (cursor && !local) {
        node.style.display = "none";
        context.axisLabels.set(id, null);
        return;
      }
      const active = context.points.find((point) => point.time === context.inspection.get());
      const px = local?.x ?? (active ? x(active.coordinate) : undefined);
      const py = local?.y ?? (active?.close === undefined ? undefined : y(active.close));
      if (
        typeof px !== "number" ||
        !Number.isFinite(px) ||
        px < area.x ||
        px > area.x + area.width
      ) {
        node.style.display = "none";
        context.axisLabels.set(id, null);
        return;
      }
      node.style.display = "";
      vertical.current?.setAttribute("x1", String(px));
      vertical.current?.setAttribute("x2", String(px));
      const horizontalVisible =
        typeof py === "number" && Number.isFinite(py) && py >= area.y && py <= area.y + area.height;
      if (horizontal.current) {
        horizontal.current.style.display = horizontalVisible ? "" : "none";
        if (horizontalVisible) {
          horizontal.current.setAttribute("y1", String(py));
          horizontal.current.setAttribute("y2", String(py));
        }
      }
      if (!showLabels) {
        context.axisLabels.set(id, null);
        return;
      }
      let time = active?.time;
      if (local && context.spacing === "elapsed") {
        const value = timeAt?.(px);
        if (typeof value === "number" && Number.isFinite(value)) {
          time =
            context.timeMode === "business-date" && Math.abs(value) <= 8.64e15
              ? new Date(value).toISOString().slice(0, 10)
              : value;
        }
      }
      if (timeLabel.current) {
        const text = time === undefined ? "" : context.formatTime(time);
        if (text !== lastTime) {
          lastTime = text;
          timeLabel.current.textContent = text;
          timeWidth = timeLabel.current.getComputedTextLength() + 12;
          timeLabel.current.setAttribute("x", String(timeWidth / 2));
          timePill.current?.setAttribute("width", String(timeWidth));
        }
        const left = Math.max(0, Math.min(px - timeWidth / 2, chartWidth - timeWidth));
        const top =
          area.y + area.height + 24 <= chartHeight
            ? area.y + area.height + 3
            : area.y + area.height - 22;
        timeMarker.current?.setAttribute("transform", `translate(${left},${top})`);
      }
      if (priceLabel.current) {
        const inVolume =
          local &&
          py !== undefined &&
          context.volumeRatio > 0 &&
          py >= area.y + area.height * (1 - context.volumeRatio);
        const value =
          local && py !== undefined ? (inVolume ? volumeAt : priceAt)?.(py) : active?.close;
        const text =
          typeof value === "number" && Number.isFinite(value) && horizontalVisible
            ? inVolume
              ? context.formatVolume(value)
              : context.formatPrice(value)
            : "";
        if (text !== lastPrice) {
          lastPrice = text;
          priceLabel.current.textContent = text;
          priceWidth = priceLabel.current.getComputedTextLength() + 12;
          priceLabel.current.setAttribute("x", String(priceWidth / 2));
          pricePill.current?.setAttribute("width", String(priceWidth));
        }
        priceLabel.current.setAttribute("data-axis", inVolume ? "volume" : "price");
        if (priceMarker.current) {
          priceMarker.current.style.display = text ? "" : "none";
          const right = area.x + area.width;
          const left =
            right + priceWidth + 4 <= chartWidth ? right + 4 : Math.max(0, right - priceWidth - 4);
          const top = Math.max(area.y, Math.min((py ?? area.y) - 10, chartHeight - 22));
          priceMarker.current.setAttribute("transform", `translate(${left},${top})`);
          context.axisLabels.set(id, text && !inVolume ? priceMarker.current : null, 1);
        }
      }
    };
    update();
    const stopPointer = context.pointer.subscribe(update);
    const stopInspection = context.inspection.subscribe(update);
    return () => {
      stopPointer();
      stopInspection();
      context.axisLabels.set(id, null);
    };
  });
  if (!x || !y || !area) return null;
  return (
    <ZIndexLayer zIndex={DefaultZIndexes.cursorLine}>
      <g stroke="currentColor" strokeDasharray="3 3" pointerEvents="none" {...props}>
        <defs>
          <clipPath id={id}>
            <rect x={area.x} y={area.y} width={area.width} height={area.height} />
          </clipPath>
        </defs>
        <g ref={frame} data-kind-ui="candlestick-crosshair" style={{ display: "none" }}>
          <g clipPath={`url(#${id})`}>
            <line ref={vertical} y1={area.y} y2={area.y + area.height} />
            <line ref={horizontal} x1={area.x} x2={area.x + area.width} />
          </g>
          {showLabels && (
            <g stroke="none" fill="currentColor" fontSize={12} strokeDasharray="none">
              <g ref={timeMarker}>
                <rect
                  ref={timePill}
                  height={20}
                  rx={3}
                  fill="var(--background, Canvas)"
                  stroke="var(--border, currentColor)"
                  strokeWidth={0.5}
                />
                <text
                  data-kind-ui="candlestick-crosshair-time"
                  textAnchor="middle"
                  y={10}
                  dominantBaseline="middle"
                  {...labelProps}
                  ref={timeLabelRef}
                />
              </g>
              <g ref={priceMarker}>
                <rect
                  ref={pricePill}
                  height={20}
                  rx={3}
                  fill="var(--background, Canvas)"
                  stroke="var(--border, currentColor)"
                  strokeWidth={0.5}
                />
                <text
                  data-kind-ui="candlestick-crosshair-price"
                  textAnchor="middle"
                  y={10}
                  dominantBaseline="middle"
                  {...labelProps}
                  ref={priceLabelRef}
                />
              </g>
            </g>
          )}
        </g>
      </g>
    </ZIndexLayer>
  );
}
export type CandlestickReadoutProps<Row extends object = CandlestickRecord> = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  children?: (
    point: CandlestickPoint<Row> | null,
    selection: CandlestickPoint<Row> | null,
  ) => ReactNode;
  /** Animate formatted digits only; observations and calculations remain unchanged. */
  valueAnimation?: "shuffle";
};
/** A persistent readout follows inspection, then the latest observation—not persistent selection. */
export function CandlestickReadout<Row extends object = CandlestickRecord>({
  children,
  valueAnimation,
  className,
  ...props
}: CandlestickReadoutProps<Row>) {
  const context = useCandlestick();
  const id = useId();
  useLayoutEffect(() => context.registerContent(id), [context.registerContent, id]);
  const inspected = useCandlestickInspection();
  const latest = useMemo(() => {
    for (let index = context.points.length - 1; index >= 0; index--) {
      const item = context.points[index];
      if (item && !item.gap) return item;
    }
    return null;
  }, [context.points]);
  const point = inspected ?? latest;
  if (context.loading) return null;
  return (
    <OutsidePlot>
      <div
        role="status"
        aria-live={inspected ? "polite" : "off"}
        {...props}
        className={cn("text-xs tabular-nums", className)}
        data-kind-ui="candlestick-readout"
      >
        {children
          ? children(
              point as unknown as CandlestickPoint<Row> | null,
              context.selected as unknown as CandlestickPoint<Row> | null,
            )
          : point && <CandleValues point={point} inline valueAnimation={valueAnimation} />}
      </div>
    </OutsidePlot>
  );
}
function CandleValues({
  point,
  inline = false,
  valueAnimation,
}: {
  point: CandlestickPoint<object>;
  inline?: boolean;
  valueAnimation: "shuffle" | undefined;
}) {
  const context = useCandlestick();
  const { visibleSeries } = useChart();
  const interaction = useChartInteraction();
  const inactive = (key: string | undefined) =>
    key !== undefined &&
    ((visibleSeries !== undefined && !visibleSeries.includes(key)) ||
      (interaction.kind === "series" &&
        interaction.selected !== null &&
        interaction.selected !== key));
  const number = (value: string) =>
    valueAnimation === "shuffle" ? <TooltipNumber value={value} /> : value;
  const priceInactive = inactive(context.priceSeries);
  const rows: { label: string; short: string; value: string; series: string | undefined }[] =
    point.gap
      ? []
      : (["open", "high", "low", "close"] as const).flatMap((key) =>
          point[key] === undefined
            ? []
            : [
                {
                  label: key[0]?.toUpperCase() + key.slice(1),
                  short: key[0]?.toUpperCase() ?? key,
                  value: context.formatPrice(point[key], point),
                  series: context.priceSeries,
                },
              ],
        );
  if (point.volume !== undefined)
    rows.push({
      label: "Volume",
      short: "Vol",
      value: context.formatVolume(point.volume, point),
      series: context.volumeSeries,
    });
  if (inline && point.open !== undefined && point.close !== undefined && point.open !== 0) {
    const change = ((point.close - point.open) / point.open) * 100;
    rows.push({
      label: "Change",
      short: "Change",
      value: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
      series: context.priceSeries,
    });
  }
  const direction =
    point.close !== undefined && point.open !== undefined
      ? point.close > point.open
        ? "rising"
        : point.close < point.open
          ? "falling"
          : "unchanged"
      : "unchanged";
  return (
    <>
      <div className={inline ? "mb-1" : "mb-1 font-medium"}>
        {context.formatTime(point.time, point)}
        {point.gap ? " · Gap" : ""}
        {point.state ? ` · ${point.state}` : ""}
      </div>
      <ul className={cn("m-0 p-0 list-none", inline && "flex flex-wrap gap-x-3 gap-y-1")}>
        {rows.map((row) => (
          <TooltipItem
            key={row.label}
            inactive={row.series === context.priceSeries ? priceInactive : inactive(row.series)}
            {...(row.series === undefined ? {} : { "data-series": row.series })}
          >
            <span>
              {inline ? (
                <abbr className="no-underline" title={row.label}>
                  {row.short}
                </abbr>
              ) : (
                row.label
              )}
            </span>
            <span
              data-kind-ui="chart-tooltip-value"
              style={
                inline && row.series === context.priceSeries
                  ? { color: candlestickDirectionColors[direction] }
                  : undefined
              }
            >
              {number(row.value)}
            </span>
          </TooltipItem>
        ))}
      </ul>
    </>
  );
}
export type CandlestickTooltipProps<Row extends object = CandlestickRecord> =
  CandlestickReadoutProps<Row> & { maxWidth?: number };
function CandleTooltipFrame(props: TooltipFrameProps) {
  const context = useCandlestick();
  const pointer = useSyncExternalStore(context.pointer.subscribe, context.pointer.get, () => null);
  const point = useCandlestickInspection() ?? context.selected;
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const x = point ? xScale?.(point.coordinate) : undefined;
  const y = point?.close === undefined ? undefined : yScale?.(point.close);
  // Shared positioning follows the cursor; keyboard inspection anchors beside its candle.
  return (
    <StaticTooltipFrame
      {...props}
      x={
        pointer
          ? props.x
          : Math.max(0, Math.min((typeof x === "number" ? x : props.x) + 12, props.maxX))
      }
      y={
        pointer
          ? props.y
          : Math.max(0, Math.min(typeof y === "number" ? y + 12 : props.y, props.maxY))
      }
    />
  );
}
export function CandlestickTooltip<Row extends object = CandlestickRecord>({
  children,
  className,
  valueAnimation,
  maxWidth = 260,
  ref,
  ...props
}: CandlestickTooltipProps<Row>) {
  const context = useCandlestick();
  const point = useCandlestickInspection() ?? context.selected;
  if (context.loading || !point) return null;
  return (
    <TooltipBase
      active
      defaultIndex={context.rendered.findIndex((row) => row.identity === point.identity)}
      maxWidth={maxWidth}
      Frame={CandleTooltipFrame}
      {...(ref ? { ref } : {})}
      content={() => (
        <div data-kind-ui="candlestick-tooltip" className={cn(tooltipClassName, className)}>
          {children ? (
            children(
              point as unknown as CandlestickPoint<Row>,
              context.selected as unknown as CandlestickPoint<Row> | null,
            )
          ) : (
            <CandleValues point={point} valueAnimation={valueAnimation} />
          )}
        </div>
      )}
      frameProps={{ role: "tooltip", "aria-live": context.contents ? "off" : "polite", ...props }}
    />
  );
}
export type CandlestickTableProps<Row extends object = CandlestickRecord> = Omit<
  ComponentPropsWithRef<"table">,
  "children"
> & {
  caption: string;
  renderMetadata?: (point: CandlestickPoint<Row>) => ReactNode;
  metadataLabel?: string;
};
export function CandlestickTable<Row extends object = CandlestickRecord>({
  caption,
  renderMetadata,
  metadataLabel = "Metadata",
  ...props
}: CandlestickTableProps<Row>) {
  const context = useCandlestick();
  return (
    <OutsidePlot>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard focus enables native scrolling to off-screen table columns. */}
      <section className="overflow-x-auto min-w-0" aria-label={caption} tabIndex={0}>
        <table data-kind-ui="candlestick-table" {...props}>
          <caption>{caption}</caption>
          <thead>
            <tr>
              {[
                "Time",
                "Open",
                "High",
                "Low",
                "Close",
                "Volume",
                "State",
                ...(renderMetadata ? [metadataLabel] : []),
              ].map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {context.points.map((point) => (
              <tr
                key={point.identity}
                data-selected={context.selected?.identity === point.identity || undefined}
              >
                <th scope="row">{context.formatTime(point.time, point)}</th>
                {(["open", "high", "low", "close"] as const).map((key) => (
                  <td key={key}>
                    {point[key] === undefined ? "—" : context.formatPrice(point[key], point)}
                  </td>
                ))}
                <td>
                  {point.volume === undefined ? "—" : context.formatVolume(point.volume, point)}
                </td>
                <td>
                  {point.gap ? `Gap${point.state ? `, ${point.state}` : ""}` : (point.state ?? "—")}
                </td>
                {renderMetadata && (
                  <td>{renderMetadata(point as unknown as CandlestickPoint<Row>)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </OutsidePlot>
  );
}
