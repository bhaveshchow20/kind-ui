"use client";

import {
  type ComponentProps,
  type ComponentPropsWithRef,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Brush, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { OutsidePlot } from "../family-root.js";
import { cn } from "../utils.js";
import { useCandlestick } from "./context.js";
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
export type CandlestickHistoryNavigatorProps = Omit<
  ComponentPropsWithRef<"fieldset">,
  "children"
> & {
  height?: number;
  brushProps?: Omit<ComponentProps<typeof Brush>, OwnedBrush>;
  overviewProps?: Omit<ComponentProps<typeof Line>, OwnedOverview>;
};

/** Full, evenly spaced observation history; gaps remain missing close values. */
export function CandlestickHistoryNavigator({
  height = 56,
  brushProps = {},
  overviewProps = {},
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
  const { points, changeViewport, formatTime } = context;
  const viewport = context.targetViewport ?? context.viewport;
  const unavailable = disabled || context.loading;
  const history = useMemo(
    () => points.map((point, index) => ({ ...point, logical: index })),
    [points],
  );
  const last = points.length - 1;
  const startIndex = Math.max(0, Math.min(last, Math.ceil(viewport.from)));
  const endIndex = Math.max(startIndex, Math.min(last, Math.floor(viewport.to)));
  const surface = useRef<HTMLDivElement>(null);
  const label = brushProps.ariaLabel ?? "Historical window";
  useLayoutEffect(() => {
    const host = surface.current;
    if (!host) return;
    // Native Brush retains pointer, touch and keyboard behavior. Its labels use logical
    // observation indices, rather than the engine's pixel-valued slider defaults.
    const sync = () =>
      host.querySelectorAll('[role="slider"]').forEach((handle, index) => {
        const value = index === 0 ? startIndex : endIndex;
        const point = points[value];
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
    const observer = new MutationObserver(sync);
    observer.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-valuenow"],
    });
    sync();
    return () => observer.disconnect();
  }, [startIndex, endIndex, points, formatTime, last, label]);
  return (
    <OutsidePlot placement="bottom">
      <fieldset
        aria-label="Historical price navigator"
        {...props}
        className={cn("m-0 mt-3 min-w-0 w-full border-0 p-0 text-current", className)}
        disabled={unavailable}
        inert={unavailable || undefined}
        data-kind-ui="candlestick-history-navigator"
      >
        {points.length < 2 ? (
          <p className="text-xs opacity-60">
            {points.length ? "One observation" : "No history available"}
          </p>
        ) : (
          <div ref={surface} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart
                data={history}
                accessibilityLayer={false}
                role="group"
                aria-label="Historical close overview"
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                <Brush
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
                      const point = points[index];
                      return point ? formatTime(point.time, point) : "";
                    })
                  }
                  onChange={(range) => {
                    if (unavailable) return;
                    brushProps.onChange?.(range);
                    changeViewport(
                      normalizeCandlestickViewport(
                        { from: range.startIndex - 0.5, to: range.endIndex + 0.5 },
                        points.length,
                      ),
                      "pan",
                    );
                  }}
                >
                  <LineChart data={history} accessibilityLayer={false}>
                    <XAxis hide type="number" dataKey="logical" domain={[0, last]} />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Line
                      {...overviewProps}
                      dataKey="close"
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
}
