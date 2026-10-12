"use client";

import {
  type ComponentProps,
  type ComponentPropsWithRef,
  type ReactNode,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  CartesianGrid,
  DefaultZIndexes,
  Line,
  ReferenceLine,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
  XAxis,
  YAxis,
  ZIndexLayer,
} from "recharts";
import { useChart } from "../chart-context.js";
import { OutsidePlot } from "../family-root.js";
import { StaticTooltipFrame, TooltipBase, type TooltipFrameProps } from "../tooltip.js";
import { tooltipClassName } from "../tooltip-content.js";
import { cn } from "../utils.js";
import { type NativePoint, useCandlestick } from "./context.js";
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
  return (
    <XAxis
      {...props}
      dataKey="coordinate"
      type="number"
      domain={context.timeDomain}
      scale="linear"
      allowDataOverflow
      ticks={props.ticks ?? observationTicks}
      tickFormatter={
        props.tickFormatter ??
        ((value) => {
          const point = pointsByCoordinate.get(Number(value));
          return point ? context.formatTime(point.time, point) : String(value);
        })
      }
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
  return (
    <YAxis
      {...props}
      domain={context.priceDomain}
      scale={context.priceScale}
      allowDataOverflow
      padding={{ bottom: (area?.height ?? 0) * context.volumeRatio }}
      tickFormatter={props.tickFormatter ?? ((value) => context.formatPrice(Number(value)))}
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
  const context = useCandlestick();
  const { visibleSeries, paints } = useChart();
  const id = useId();
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
      <g clipPath={`url(#${context.priceClipId})`}>
        <Line
          {...props}
          zIndex={0}
          hide={props.hide || (visibleSeries !== undefined && !visibleSeries.includes(seriesKey))}
          dataKey={read}
          stroke={props.stroke ?? paints[seriesKey] ?? "currentColor"}
          isAnimationActive={false}
          dot={props.dot ?? false}
        />
      </g>
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
export function CandlestickCrosshair(props: ComponentPropsWithRef<"g">) {
  const context = useCandlestick();
  const x = useXAxisScale();
  const y = useYAxisScale();
  const area = usePlotArea();
  const id = useId();
  if (!context.active || !x || !y || !area) return null;
  const px = x(context.active.coordinate);
  const py = context.active.close === undefined ? undefined : y(context.active.close);
  if (typeof px !== "number") return null;
  return (
    <g
      data-kind-ui="candlestick-crosshair"
      stroke="currentColor"
      strokeDasharray="3 3"
      pointerEvents="none"
      {...props}
    >
      <defs>
        <clipPath id={id}>
          <rect x={area.x} y={area.y} width={area.width} height={area.height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <line x1={px} x2={px} y1={area.y} y2={area.y + area.height} />
        {typeof py === "number" &&
          py >= area.y &&
          py <= area.y + area.height * (1 - context.volumeRatio) && (
            <line x1={area.x} x2={area.x + area.width} y1={py} y2={py} />
          )}
      </g>
    </g>
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
  const point = context.active ?? context.selected;
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
  const point = context.active ?? context.selected;
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
  const point = context.active ?? context.selected;
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
