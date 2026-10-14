"use client";

import {
  type ComponentProps,
  type ComponentPropsWithRef,
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Brush, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
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
        className={cn("m-0 mt-3 min-w-0 w-full border-0 p-0 text-current", className)}
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
          <div
            ref={surface}
            className="touch-pan-y"
            style={{ height }}
            onMouseDownCapture={(event) => {
              if (event.button === 0) beginGesture(event.target);
            }}
            onTouchStartCapture={(event) => beginGesture(event.target)}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart
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
                  travellerWidth={brushProps.travellerWidth ?? 8}
                  fill={brushProps.fill ?? "var(--background,Canvas)"}
                  stroke={brushProps.stroke ?? "currentColor"}
                  tickFormatter={
                    brushProps.tickFormatter ??
                    ((_, index) => {
                      const point = currentByIdentity.get(history[index]?.identity ?? "")?.point;
                      return point ? formatTime(point.time, point) : "";
                    })
                  }
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
                  <LineChart data={history} accessibilityLayer={false}>
                    <XAxis hide type="number" dataKey="logical" domain={[0, last]} />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Line
                      {...overviewProps}
                      dataKey={readClose}
                      stroke={overviewProps.stroke ?? "currentColor"}
                      strokeWidth={overviewProps.strokeWidth ?? 1}
                      dot={overviewProps.dot ?? false}
                      activeDot={false}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </Brush>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </fieldset>
    </OutsidePlot>
  );
});
