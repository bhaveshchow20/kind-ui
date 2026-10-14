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
} from "react";
import {
  CartesianGrid,
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
  XAxis,
  YAxis,
  ZIndexLayer,
} from "recharts";
import { useChart } from "../chart-context.js";
import { OutsidePlot } from "../family-root.js";
import { useLineInteraction } from "../line-chart.js";
import { SeriesInteractionLayer, useSeriesInteraction } from "../series-interaction.js";
import { StaticTooltipFrame, TooltipBase, type TooltipFrameProps } from "../tooltip.js";
import { tooltipClassName } from "../tooltip-content.js";
import { cn } from "../utils.js";
import {
  type NativePoint,
  useCandlestick,
  useCandlestickInspection,
  useCandlestickSeriesTarget,
} from "./context.js";
import { CandlestickSeriesPaint } from "./marks.js";
import type { CandlestickDatum, CandlestickPoint } from "./model.js";
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
    <XAxis
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
    <YAxis
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
export const CandlestickGrid = CartesianGrid;
export type CandlestickOverlayProps<Row extends object = CandlestickDatum> = Omit<
  ComponentProps<typeof Line>,
  "dataKey" | "data" | "isAnimationActive" | "xAxisId" | "yAxisId"
> & {
  seriesKey: string;
  dataKey: (keyof Row & string) | ((row: Row) => number | null | undefined);
  includeInDomain?: boolean;
};
export function CandlestickOverlay<Row extends object = CandlestickDatum>({
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
export type CandlestickContentProps<Row extends object = CandlestickDatum> = {
  children?: (
    point: CandlestickPoint<Row> | null,
    selection: CandlestickPoint<Row> | null,
  ) => ReactNode;
  className?: string;
  frameProps?: ComponentPropsWithRef<"div">;
};
export function CandlestickContent<Row extends object = CandlestickDatum>({
  children,
  className,
  frameProps,
}: CandlestickContentProps<Row>) {
  const context = useCandlestick();
  const id = useId();
  useLayoutEffect(() => context.registerContent(id), [context.registerContent, id]);
  const point = useCandlestickInspection() ?? context.selected;
  return (
    <OutsidePlot>
      <div
        role="status"
        aria-live="polite"
        {...frameProps}
        className={className ?? frameProps?.className}
        data-kind-ui="candlestick-content"
      >
        {children ? (
          children(
            point as unknown as CandlestickPoint<Row> | null,
            context.selected as CandlestickPoint<Row> | null,
          )
        ) : point ? (
          <>
            {context.formatTime(point.time, point)}
            {point.gap
              ? ` — gap${point.state ? `, ${point.state}` : ""}`
              : ` — Open ${context.formatPrice(point.open ?? 0, point)}, high ${context.formatPrice(point.high ?? 0, point)}, low ${context.formatPrice(point.low ?? 0, point)}, close ${context.formatPrice(point.close ?? 0, point)}${point.volume === undefined ? "" : `, volume ${context.formatVolume(point.volume, point)}`}${point.state ? `, ${point.state}` : ""}`}
          </>
        ) : null}
      </div>
    </OutsidePlot>
  );
}
export type CandlestickTooltipProps<Row extends object = CandlestickDatum> =
  CandlestickContentProps<Row> & { maxWidth?: number };
function CandleTooltipFrame(props: TooltipFrameProps) {
  const context = useCandlestick();
  const point = useCandlestickInspection() ?? context.selected;
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const x = point ? xScale?.(point.coordinate) : undefined;
  const y = point?.close === undefined ? undefined : yScale?.(point.close);
  return (
    <StaticTooltipFrame
      {...props}
      x={Math.max(0, Math.min((typeof x === "number" ? x : props.x) + 12, props.maxX))}
      y={Math.max(0, Math.min(typeof y === "number" ? y + 12 : props.y, props.maxY))}
    />
  );
}
export function CandlestickTooltip<Row extends object = CandlestickDatum>({
  children,
  className,
  frameProps,
  maxWidth = 260,
}: CandlestickTooltipProps<Row>) {
  const context = useCandlestick();
  const point = useCandlestickInspection() ?? context.selected;
  if (!point) return null;
  const { ref, ...attributes } = frameProps ?? {};
  const content = (
    <div data-kind-ui="candlestick-content" className={cn(tooltipClassName, className)}>
      {children ? (
        children(
          point as unknown as CandlestickPoint<Row>,
          context.selected as CandlestickPoint<Row> | null,
        )
      ) : (
        <>
          <div>{context.formatTime(point.time, point)}</div>
          {point.gap ? (
            <div>Gap{point.state ? `, ${point.state}` : ""}</div>
          ) : (
            <dl>
              {(["open", "high", "low", "close"] as const).map((key) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt>
                    {key[0]?.toUpperCase()}
                    {key.slice(1)}
                  </dt>
                  <dd>{context.formatPrice(point[key] ?? 0, point)}</dd>
                </div>
              ))}
              {point.volume !== undefined && (
                <div className="flex justify-between gap-3">
                  <dt>Volume</dt>
                  <dd>{context.formatVolume(point.volume, point)}</dd>
                </div>
              )}
              {point.state && <div>{point.state}</div>}
            </dl>
          )}
        </>
      )}
    </div>
  );
  return (
    <TooltipBase
      active
      defaultIndex={context.rendered.findIndex((row) => row.identity === point.identity)}
      maxWidth={maxWidth}
      Frame={CandleTooltipFrame}
      content={() => content}
      {...(ref ? { ref } : {})}
      frameProps={{
        role: "tooltip",
        "aria-live": context.contents ? "off" : "polite",
        ...attributes,
      }}
    />
  );
}
export type CandlestickDataTableProps<Row extends object = CandlestickDatum> = Omit<
  ComponentPropsWithRef<"table">,
  "children"
> & {
  caption: string;
  renderMetadata?: (point: CandlestickPoint<Row>) => ReactNode;
  metadataLabel?: string;
};
export function CandlestickDataTable<Row extends object = CandlestickDatum>({
  caption,
  renderMetadata,
  metadataLabel = "Metadata",
  ...props
}: CandlestickDataTableProps<Row>) {
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
