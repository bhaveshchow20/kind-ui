"use client";

import {
  type ComponentProps,
  type ComponentPropsWithRef,
  memo,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Area, Brush, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { OutsidePlot } from "../family-root.js";
import { cn } from "../utils.js";
import { type Context, useCandlestick } from "./context.js";
import { normalizeCandlestickViewport } from "./viewport.js";

type OwnedBrush =
  | "data"
  | "dataKey"
  | "startIndex"
  | "endIndex"
  | "children"
  | "x"
  | "y"
  | "width"
  | "height";
type OwnedOverview = "data" | "dataKey" | "xAxisId" | "yAxisId" | "isAnimationActive";
type HistoryTime = { identity: string; time: number | string; logical: number };
export type CandlestickHistoryNavigatorProps = Omit<
  ComponentPropsWithRef<"fieldset">,
  "children"
> & {
  height?: number;
  brushProps?: Omit<ComponentProps<typeof Brush>, OwnedBrush>;
  overviewProps?: Omit<ComponentProps<typeof Line>, OwnedOverview>;
};
const emptyBrushProps: NonNullable<CandlestickHistoryNavigatorProps["brushProps"]> = {};
const emptyOverviewProps: NonNullable<CandlestickHistoryNavigatorProps["overviewProps"]> = {};
type NavigatorViewProps = CandlestickHistoryNavigatorProps &
  Pick<Context, "points" | "changeViewport" | "formatTime" | "loading"> & {
    from: number;
    to: number;
  };

function HistoryTraveller({
  x,
  y,
  width,
  height,
  stroke,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  stroke?: string | undefined;
}) {
  const gripHeight = Math.min(30, height - 8);
  const center = x + width / 2;
  const top = y + (height - gripHeight) / 2;
  return (
    <g>
      <rect x={x - 4} y={y} width={width + 8} height={height} fill="transparent" />
      <rect
        x={x}
        y={top}
        width={width}
        height={gripHeight}
        rx={width / 2}
        fill="var(--background,Canvas)"
        stroke={stroke}
      />
      {[-4, 0, 4].map((offset) => (
        <circle
          key={offset}
          cx={center}
          cy={y + height / 2 + offset}
          r={1}
          fill="var(--muted-foreground,#64748b)"
        />
      ))}
    </g>
  );
}

function HistoryRangeTags({
  start,
  end,
  from,
  to,
  last,
  travellerWidth,
}: {
  start: string;
  end: string;
  from: number;
  to: number;
  last: number;
  travellerWidth: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const startTag = useRef<HTMLSpanElement>(null);
  const endTag = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const frame = host.current;
    const first = startTag.current;
    const second = endTag.current;
    if (!frame || !first || !second) return;
    const position = () => {
      const width = frame.clientWidth;
      const a = first.getBoundingClientRect().width;
      const b = second.getBoundingClientRect().width;
      const gap = 6;
      const anchor = (index: number) =>
        (index / last) * (width - travellerWidth) + travellerWidth / 2;
      const clamp = (value: number, maximum: number) => Math.max(0, Math.min(maximum, value));
      let left = clamp(anchor(from) - a / 2, width - a);
      let right = clamp(anchor(to) - b / 2, width - b);
      // Keep tags near their handles; spread them as a pair when the selected window is narrow.
      if (left + a + gap > right) {
        left = clamp((anchor(from) + anchor(to) - a - b - gap) / 2, width - a - b - gap);
        right = left + a + gap;
      }
      first.style.transform = `translateX(${left}px)`;
      second.style.transform = `translateX(${right}px)`;
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(frame);
    observer.observe(first);
    observer.observe(second);
    return () => observer.disconnect();
  }, [from, to, last, travellerWidth]);
  const tagClass =
    "absolute left-0 top-1 max-w-[calc((100%_-_6px)/2)] truncate rounded-md border border-[var(--border,#e2e8f0)] bg-[var(--background,Canvas)] px-2 py-0.5 text-[11px] font-medium leading-4 text-[var(--foreground,CanvasText)] tabular-nums shadow-sm";
  return (
    <div
      ref={host}
      aria-hidden="true"
      data-kind-ui="candlestick-history-tags"
      className="pointer-events-none relative h-7 w-full opacity-0 transition-opacity group-has-[.recharts-brush-texts]/kind-history:opacity-100 motion-reduce:transition-none"
    >
      <span ref={startTag} className={tagClass} title={start}>
        {start}
      </span>
      <span ref={endTag} className={tagClass} title={end}>
        {end}
      </span>
    </div>
  );
}

/** Full, evenly spaced observation history; gaps remain missing close values. */
export function CandlestickHistoryNavigator({
  height = 56,
  brushProps = emptyBrushProps,
  overviewProps = emptyOverviewProps,
  className,
  disabled,
  ...props
}: CandlestickHistoryNavigatorProps) {
  if (!Number.isFinite(height) || height < 32)
    throw new Error("Candlestick HistoryNavigator height must be finite and at least 32");
  for (const key of [
    "data",
    "dataKey",
    "startIndex",
    "endIndex",
    "children",
    "x",
    "y",
    "width",
    "height",
  ] as const) {
    if (Object.hasOwn(brushProps, key))
      throw new Error(`Candlestick HistoryNavigator owns brushProps.${key}; omit this prop`);
  }
  for (const key of ["data", "dataKey", "xAxisId", "yAxisId", "isAnimationActive"] as const) {
    if (Object.hasOwn(overviewProps, key))
      throw new Error(`Candlestick HistoryNavigator owns overviewProps.${key}; omit this prop`);
  }
  const context = useCandlestick();
  const viewport = context.targetViewport ?? context.viewport;
  return (
    <HistoryNavigatorView
      {...props}
      height={height}
      brushProps={brushProps}
      overviewProps={overviewProps}
      className={className}
      disabled={disabled}
      points={context.points}
      from={viewport.from}
      to={viewport.to}
      loading={context.loading}
      changeViewport={context.changeViewport}
      formatTime={context.formatTime}
    />
  );
}

// Inspection and intermediate price-window frames do not change the desired
// historical window. Keep the native history chart outside those render updates.
const HistoryNavigatorView = memo(function HistoryNavigatorView({
  height = 56,
  brushProps = emptyBrushProps,
  overviewProps = emptyOverviewProps,
  className,
  disabled,
  points,
  from,
  to,
  loading,
  changeViewport,
  formatTime,
  ...props
}: NavigatorViewProps) {
  const overviewId = `candlestick-history-${useId().replace(/:/g, "")}`;
  const unavailable = disabled || loading;
  const signature = useMemo(() => JSON.stringify(points.map((point) => point.identity)), [points]);
  const geometry = useRef<{ signature: string; data: HistoryTime[] } | null>(null);
  if (geometry.current === null || geometry.current.signature !== signature) {
    geometry.current = {
      signature,
      data: points.map((point, logical) => ({
        identity: point.identity,
        time: point.time,
        logical,
      })),
    };
  }
  const gesture = useRef<HistoryTime[] | null>(null);
  const [heldHistory, setHeldHistory] = useState<HistoryTime[] | null>(null);
  const history = heldHistory ?? geometry.current.data;
  const currentByIdentity = useMemo(
    () => new Map(points.map((point, index) => [point.identity, { point, index }])),
    [points],
  );
  const historyByIdentity = useMemo(
    () => new Map(history.map((point, index) => [point.identity, index])),
    [history],
  );
  const readClose = useCallback(
    (time: HistoryTime) => currentByIdentity.get(time.identity)?.point.close,
    [currentByIdentity],
  );
  const surface = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<{ index: number; node: Element } | null>(null);
  const [historyRevision, setHistoryRevision] = useState(0);
  const refreshFrame = useRef<number | null>(null);
  const pendingRefresh = useRef(false);
  const cancelledRevision = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (cancelledRevision.current !== historyRevision) cancelledRevision.current = null;
  }, [historyRevision]);
  const refreshNow = useCallback(() => {
    const handles = Array.from(surface.current?.querySelectorAll('[role="slider"]') ?? []);
    const active = document.activeElement;
    const focused = active ? handles.indexOf(active) : -1;
    restoreFocus.current = focused < 0 || !active ? null : { index: focused, node: active };
    setHistoryRevision((revision) => revision + 1);
  }, []);
  const scheduleRefresh = useCallback(() => {
    if (refreshFrame.current !== null) cancelAnimationFrame(refreshFrame.current);
    refreshFrame.current = requestAnimationFrame(() => {
      refreshFrame.current = null;
      if (gesture.current !== null) {
        pendingRefresh.current = true;
        return;
      }
      pendingRefresh.current = false;
      refreshNow();
    });
  }, [refreshNow]);
  useLayoutEffect(() => {
    if (history.length < 2) return;
    // Native Brush rebuilds its scale before restored controlled indices arrive
    // after a data update. Recreate only that part once reconciliation has settled.
    scheduleRefresh();
    return () => {
      if (refreshFrame.current !== null) cancelAnimationFrame(refreshFrame.current);
      refreshFrame.current = null;
    };
  }, [history, scheduleRefresh]);
  const beginGesture = (target: EventTarget | null) => {
    if (
      unavailable ||
      !(target instanceof Element) ||
      !target.closest(".recharts-brush-slide, .recharts-brush-traveller")
    )
      return;
    // Both the native data reference and its indices must remain stable while
    // Brush owns a drag. New observations are reconciled when that drag ends.
    gesture.current = history;
    setHeldHistory(history);
  };
  const finishGesture = useCallback(() => {
    const previous = gesture.current;
    gesture.current = null;
    setHeldHistory(null);
    if (pendingRefresh.current || (previous !== null && previous !== geometry.current?.data))
      scheduleRefresh();
  }, [scheduleRefresh]);
  useLayoutEffect(() => {
    const accepted = gesture.current;
    if (accepted === null) return;
    if (
      unavailable ||
      points.length < 2 ||
      accepted.some((point) => !currentByIdentity.has(point.identity))
    ) {
      // Empty/loading can remove Brush before its native drag-end callback.
      // Removed observations also invalidate the accepted timeline. Cancel its
      // moving state, then let the next available history reconcile normally.
      finishGesture();
      scheduleRefresh();
    }
  }, [unavailable, points.length, currentByIdentity, finishGesture, scheduleRefresh]);
  const last = history.length - 1;
  const currentLast = points.length - 1;
  const currentStart = Math.max(0, Math.min(currentLast, Math.ceil(from)));
  const currentEnd = Math.max(currentStart, Math.min(currentLast, Math.floor(to)));
  const startIndex = Math.max(
    0,
    Math.min(last, historyByIdentity.get(points[currentStart]?.identity ?? "") ?? currentStart),
  );
  const endIndex = Math.max(
    startIndex,
    Math.min(last, historyByIdentity.get(points[currentEnd]?.identity ?? "") ?? currentEnd),
  );
  const label = brushProps.ariaLabel ?? "Historical window";
  const travellerWidth = brushProps.travellerWidth ?? 12;
  const overviewStroke =
    overviewProps.style?.stroke ?? overviewProps.stroke ?? "var(--muted-foreground,#64748b)";
  const formatLabel = (index: number) => {
    const entry = history[index];
    const point = currentByIdentity.get(entry?.identity ?? "")?.point;
    return String(
      brushProps.tickFormatter && entry
        ? brushProps.tickFormatter(entry.time, index)
        : point
          ? formatTime(point.time, point)
          : "",
    );
  };
  useLayoutEffect(() => {
    const host = surface.current;
    if (!host) return;
    // Native Brush retains pointer, touch and keyboard behavior. Its labels use logical
    // observation indices, rather than the engine's pixel-valued slider defaults.
    const sync = () => {
      const handles = host.querySelectorAll('[role="slider"]');
      handles.forEach((handle, index) => {
        const value = index === 0 ? startIndex : endIndex;
        const point = currentByIdentity.get(history[value]?.identity ?? "")?.point;
        for (const [key, text] of Object.entries({
          "aria-label": `${label} ${index === 0 ? "start" : "end"}`,
          "aria-valuemin": "0",
          "aria-valuemax": String(last),
          "aria-valuenow": String(value),
          "aria-valuetext": point ? formatTime(point.time, point) : "No history",
        })) {
          if (handle.getAttribute(key) !== text) handle.setAttribute(key, text);
        }
      });
      if (restoreFocus.current !== null && handles.length === 2) {
        const handle = handles[restoreFocus.current.index];
        if (handle === restoreFocus.current.node) return;
        if (document.activeElement === document.body && handle instanceof SVGElement)
          handle.focus({ preventScroll: true });
        restoreFocus.current = null;
      }
    };
    const observer = new MutationObserver(sync);
    observer.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-valuenow"],
    });
    sync();
    return () => observer.disconnect();
  }, [startIndex, endIndex, history, currentByIdentity, formatTime, last, label]);
  return (
    <OutsidePlot placement="bottom">
      <fieldset
        aria-label="Historical price navigator"
        {...props}
        className={cn(
          "group/kind-history m-0 mt-3 min-w-0 w-full border-0 p-0 text-current",
          className,
        )}
        disabled={unavailable}
        inert={unavailable || undefined}
        data-kind-ui="candlestick-history-navigator"
        onTouchCancelCapture={(event) => {
          // Mark cancellation before consumer capture can stop propagation.
          // Queue the native reset without detaching callback targets during
          // dispatch; stale native changes are ignored until that reset commits.
          cancelledRevision.current = historyRevision;
          finishGesture();
          if (refreshFrame.current !== null) cancelAnimationFrame(refreshFrame.current);
          refreshFrame.current = null;
          pendingRefresh.current = false;
          refreshNow();
          props.onTouchCancelCapture?.(event);
        }}
      >
        {points.length < 2 ? (
          <p className="text-xs opacity-60">
            {points.length ? "One observation" : "No history available"}
          </p>
        ) : (
          <>
            <div
              ref={surface}
              className="relative touch-pan-y overflow-hidden rounded-xl border border-[var(--border,#e2e8f0)]"
              style={{ height }}
              onMouseDownCapture={(event) => {
                if (event.button === 0) beginGesture(event.target);
              }}
              onTouchStartCapture={(event) => beginGesture(event.target)}
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart
                  data={history}
                  accessibilityLayer={false}
                  role="group"
                  aria-label="Historical close overview"
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <Brush
                    key={historyRevision}
                    {...brushProps}
                    x={0}
                    y={0}
                    height={height}
                    dataKey="time"
                    startIndex={startIndex}
                    endIndex={endIndex}
                    ariaLabel={label}
                    travellerWidth={travellerWidth}
                    traveller={brushProps.traveller ?? HistoryTraveller}
                    fill={brushProps.fill ?? "var(--background,Canvas)"}
                    stroke={brushProps.stroke ?? "var(--border,#e2e8f0)"}
                    // Native text still owns hover/focus visibility; formatted tags render below the plot.
                    tickFormatter={() => ""}
                    onChange={(range) => {
                      if (unavailable || cancelledRevision.current !== null) return;
                      brushProps.onChange?.(range);
                      const from = currentByIdentity.get(
                        history[range.startIndex]?.identity ?? "",
                      )?.index;
                      const to = currentByIdentity.get(
                        history[range.endIndex]?.identity ?? "",
                      )?.index;
                      if (from === undefined || to === undefined) return;
                      changeViewport(
                        normalizeCandlestickViewport(
                          { from: from - 0.5, to: to + 0.5 },
                          points.length,
                        ),
                        "pan",
                      );
                    }}
                    onDragEnd={(range) => {
                      try {
                        brushProps.onDragEnd?.(range);
                      } finally {
                        finishGesture();
                      }
                    }}
                  >
                    <ComposedChart data={history} accessibilityLayer={false}>
                      <XAxis hide type="number" dataKey="logical" domain={[0, last]} />
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <defs>
                        <linearGradient id={overviewId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={overviewStroke} stopOpacity={0.24} />
                          <stop offset="100%" stopColor={overviewStroke} stopOpacity={0.025} />
                        </linearGradient>
                      </defs>
                      <Area
                        dataKey={readClose}
                        type={overviewProps.type ?? "monotone"}
                        fill={overviewProps.fill ?? `url(#${overviewId})`}
                        stroke="none"
                        fillOpacity={1}
                        opacity={overviewProps.opacity}
                        style={{ ...overviewProps.style, pointerEvents: "none" }}
                        legendType="none"
                        tooltipType="none"
                        {...(overviewProps.hide !== undefined ? { hide: overviewProps.hide } : {})}
                        connectNulls={false}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        {...overviewProps}
                        dataKey={readClose}
                        stroke={overviewStroke}
                        strokeWidth={overviewProps.strokeWidth ?? 1.5}
                        type={overviewProps.type ?? "monotone"}
                        dot={overviewProps.dot ?? false}
                        activeDot={false}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </Brush>
                </ComposedChart>
              </ResponsiveContainer>
              <div
                aria-hidden="true"
                data-kind-ui="candlestick-history-outside-start"
                className="pointer-events-none absolute inset-y-0 left-0 bg-[color-mix(in_srgb,var(--muted,#e2e8f0)_45%,transparent)] [backdrop-filter:blur(1.5px)]"
                style={{ width: `calc((100% - ${travellerWidth}px) * ${startIndex / last})` }}
              />
              <div
                aria-hidden="true"
                data-kind-ui="candlestick-history-outside-end"
                className="pointer-events-none absolute inset-y-0 right-0 bg-[color-mix(in_srgb,var(--muted,#e2e8f0)_45%,transparent)] [backdrop-filter:blur(1.5px)]"
                style={{ width: `calc((100% - ${travellerWidth}px) * ${1 - endIndex / last})` }}
              />
            </div>
            <HistoryRangeTags
              start={formatLabel(startIndex)}
              end={formatLabel(endIndex)}
              from={startIndex}
              to={endIndex}
              last={last}
              travellerWidth={travellerWidth}
            />
          </>
        )}
      </fieldset>
    </OutsidePlot>
  );
});
