"use client";

import {
  type ComponentPropsWithRef,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BarChart as EngineBarChart, usePlotArea, useXAxisScale } from "recharts";
import type { BarChartProps } from "../bar-chart.js";
import {
  type ChartName,
  type FamilyOptions,
  FamilyRoot,
  familyFrame,
  familyVisibility,
  OutsidePlot,
} from "../family-root.js";
import { LineChartFrame } from "../line-chart.js";
import { useReducedMotion } from "../motion-preference.js";
import {
  type CandlestickAccessors,
  type CandlestickDatum,
  type CandlestickPoint,
  type CandlestickTimeMode,
  normalizeCandlestickData,
} from "./model.js";
import { CandlestickLoading, CandlestickReveal } from "./motion.js";
import {
  getCandlestickLogicalCoordinate,
  getCandlestickPriceDomain,
  getCandlestickTimeCoordinate,
  getCandlestickTimeDomain,
} from "./scales.js";
import {
  type CandlestickViewport,
  type CandlestickViewportReason,
  fitCandlestickViewport,
  getCandlestickVisiblePoints,
  normalizeCandlestickViewport,
  panCandlestickViewport,
  reconcileCandlestickViewport,
  zoomCandlestickViewport,
} from "./viewport.js";

export type CandlestickViewportChange = {
  reason: CandlestickViewportReason;
  first: CandlestickPoint["time"] | null;
  last: CandlestickPoint["time"] | null;
};
export type CandlestickChartProps<Row extends object = CandlestickDatum> = FamilyOptions &
  ChartName &
  Omit<
    BarChartProps,
    | keyof FamilyOptions
    | "data"
    | "children"
    | "loading"
    | "loadingLabel"
    | "animate"
    | "width"
    | "height"
    | "style"
    | "className"
    | "responsive"
    | "accessibilityLayer"
    | "layout"
    | "stackOffset"
    | "reverseStackOrder"
  > & {
    data: readonly Row[];
    timeMode: CandlestickTimeMode;
    accessors?: CandlestickAccessors<Row>;
    spacing?: "ordinal" | "elapsed";
    viewport?: CandlestickViewport;
    defaultViewport?: CandlestickViewport;
    onViewportChange?: (range: CandlestickViewport, details: CandlestickViewportChange) => void;
    followLatest?: boolean;
    overscan?: number;
    selection?: CandlestickPoint["time"] | null;
    defaultSelection?: CandlestickPoint["time"] | null;
    onSelectionChange?: (point: CandlestickPoint<Row> | null) => void;
    onInspect?: (point: CandlestickPoint<Row> | null) => void;
    priceScale?: "linear" | "log";
    autoscale?: "visible" | "all";
    priceDomain?: readonly [number, number];
    priceBounds?: readonly [number, number];
    pricePadding?: number;
    /** Fraction of plot height reserved by an explicitly composed Volume part. */
    volumeRatio?: number;
    formatTime?: (time: CandlestickPoint["time"], point?: CandlestickPoint<Row>) => string;
    formatPrice?: (value: number, point?: CandlestickPoint<Row>) => string;
    formatVolume?: (value: number, point?: CandlestickPoint<Row>) => string;
    width?: number | string;
    height?: number | string;
    style?: ComponentPropsWithRef<"div">["style"];
    className?: string;
    animate?: BarChartProps["animate"];
    loading?: boolean;
    loadingLabel?: string;
    empty?: ReactNode;
    children: ReactNode;
  };

import { CandleContext, type Context, type NativePoint, useCandlestick } from "./context.js";
import { CandlestickMark, CandlestickSeries, CandlestickVolume } from "./marks.js";
import {
  CandlestickContent,
  CandlestickCrosshair,
  CandlestickDataTable,
  CandlestickGrid,
  CandlestickOverlay,
  CandlestickReferenceLine,
  CandlestickTooltip,
  CandlestickXAxis,
  CandlestickYAxis,
} from "./parts.js";

export type {
  CandlestickMarkProps,
  CandlestickSeriesProps,
  CandlestickVolumeProps,
} from "./marks.js";
export { CandlestickMark, CandlestickSeries, CandlestickVolume } from "./marks.js";
export type {
  CandlestickContentProps,
  CandlestickDataTableProps,
  CandlestickOverlayProps,
  CandlestickReferenceLineProps,
  CandlestickTooltipProps,
  CandlestickXAxisProps,
  CandlestickYAxisProps,
} from "./parts.js";
export {
  CandlestickContent,
  CandlestickCrosshair,
  CandlestickDataTable,
  CandlestickGrid,
  CandlestickOverlay,
  CandlestickReferenceLine,
  CandlestickTooltip,
  CandlestickXAxis,
  CandlestickYAxis,
} from "./parts.js";

function CandlestickFamily<Row extends object>(props: CandlestickChartProps<Row>) {
  const {
    data,
    timeMode,
    accessors,
    spacing = "ordinal",
    viewport,
    defaultViewport,
    followLatest = false,
    overscan = 1,
    selection,
    defaultSelection = null,
    onSelectionChange,
    onInspect,
    onViewportChange,
    priceScale = "linear",
    autoscale = "visible",
    priceDomain,
    priceBounds,
    pricePadding,
    volumeRatio = 0.22,
    formatTime,
    formatPrice,
    formatVolume,
    children,
    loading,
    loadingLabel,
    animate,
    empty = "No candle observations",
    width,
    height,
    className,
    style,
    config,
    frameProps,
    legendPosition,
    interaction,
    emphasis,
    nonce,
    visibleSeries,
    defaultVisibleSeries,
    onVisibleSeriesChange,
    ...nativeProps
  } = props;
  if (children === undefined) throw new Error("CandlestickChart requires explicit children");
  if (viewport !== undefined && defaultViewport !== undefined)
    throw new Error("Candlestick viewport cannot be controlled and defaulted");
  if (selection !== undefined && props.defaultSelection !== undefined)
    throw new Error("Candlestick selection cannot be controlled and defaulted");
  if (!Number.isFinite(volumeRatio) || volumeRatio <= 0 || volumeRatio >= 0.5)
    throw new Error("Candlestick volumeRatio must be greater than zero and less than 0.5");
  const modes = useRef({ viewport: viewport !== undefined, selection: selection !== undefined });
  if (
    modes.current.viewport !== (viewport !== undefined) ||
    modes.current.selection !== (selection !== undefined)
  )
    throw new Error("Candlestick cannot switch controlled state during a mount");
  const normalized = useMemo(
    () =>
      normalizeCandlestickData(data, {
        timeMode,
        ...(accessors !== undefined ? { accessors } : {}),
        priceScale,
        ...(priceBounds !== undefined ? { priceBounds } : {}),
      }),
    [data, timeMode, accessors, priceScale, priceBounds],
  );
  const points = useMemo(
    () =>
      normalized.map((point, index) => ({
        ...point,
        coordinate: getCandlestickTimeCoordinate(point, index, spacing),
      })),
    [normalized, spacing],
  );
  const [localRange, setLocalRange] = useState(() =>
    normalizeCandlestickViewport(
      defaultViewport ?? fitCandlestickViewport(points.length),
      points.length,
    ),
  );
  const pendingWheel = useRef<WheelEvent | null>(null);
  useEffect(() => {
    const cancelWheel = (event: WheelEvent) => {
      if (pendingWheel.current === event) {
        pendingWheel.current = null;
        if (event.cancelable) event.preventDefault();
      }
    };
    document.addEventListener("wheel", cancelWheel, { passive: false });
    return () => {
      document.removeEventListener("wheel", cancelWheel);
      pendingWheel.current = null;
    };
  }, []);
  const previous = useRef(points);
  const previousControlledRange = useRef(viewport);
  const controlledRangeChanged =
    viewport !== undefined &&
    previousControlledRange.current !== undefined &&
    (viewport.from !== previousControlledRange.current.from ||
      viewport.to !== previousControlledRange.current.to);
  const reconciled =
    viewport && (controlledRangeChanged || previous.current.length === 0)
      ? normalizeCandlestickViewport(viewport, points.length)
      : reconcileCandlestickViewport(previous.current, points, viewport ?? localRange, {
          followLatest,
        });
  const rangeFrom = viewport?.from ?? reconciled.from;
  const rangeTo = viewport?.to ?? reconciled.to;
  const range = useMemo(
    () => normalizeCandlestickViewport({ from: rangeFrom, to: rangeTo }, points.length),
    [rangeFrom, rangeTo, points.length],
  );
  const [activeTime, setActiveTime] = useState<CandlestickPoint["time"] | null>(null);
  const [localSelection, setSelection] = useState(defaultSelection);
  const selectedTime = selection === undefined ? localSelection : selection;
  const selected = points.find((point) => point.time === selectedTime) ?? null;
  const active = points.find((point) => point.time === activeTime) ?? null;
  const [volumes, setVolumes] = useState<Set<string>>(() => new Set());
  const [contents, setContents] = useState<Set<string>>(() => new Set());
  const registerContent = useCallback((key: string) => {
    setContents((old) => new Set(old).add(key));
    return () =>
      setContents((old) => {
        const next = new Set(old);
        next.delete(key);
        return next;
      });
  }, []);
  useLayoutEffect(() => {
    previousControlledRange.current = viewport;
  }, [viewport]);
  const [overlays, setOverlays] = useState<Map<string, readonly number[]>>(() => new Map());
  const registerVolume = useCallback((key: string) => {
    setVolumes((old) => new Set(old).add(key));
    return () =>
      setVolumes((old) => {
        const next = new Set(old);
        next.delete(key);
        return next;
      });
  }, []);
  const registerOverlay = useCallback((key: string, values: readonly number[]) => {
    setOverlays((old) => new Map(old).set(key, values));
    return () =>
      setOverlays((old) => {
        const next = new Map(old);
        next.delete(key);
        return next;
      });
  }, []);
  const geometry = useRef<Context["geometry"]["current"]>(null);
  const revealClipId = `candlestick-reveal-${useId().replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const interrupt = useRef(() => {});
  const changeViewport = useCallback(
    (next: CandlestickViewport, reason: CandlestickViewportReason) => {
      const actual = normalizeCandlestickViewport(next, points.length);
      if (viewport === undefined) setLocalRange(actual);
      const visible = getCandlestickVisiblePoints(points, actual);
      onViewportChange?.(actual, {
        reason,
        first: visible.at(0)?.time ?? null,
        last: visible.at(-1)?.time ?? null,
      });
    },
    [points, viewport, onViewportChange],
  );
  useLayoutEffect(() => {
    if (previous.current !== points) {
      if (viewport === undefined) setLocalRange(reconciled);
      const oldRange = viewport ?? localRange;
      if (reconciled.from !== oldRange.from || reconciled.to !== oldRange.to)
        changeViewport(reconciled, "data");
      previous.current = points;
    }
  }, [points, viewport, localRange, changeViewport, reconciled]);
  const inspect = (time: CandlestickPoint["time"] | null) => {
    if (time === activeTime) return;
    setActiveTime(time);
    onInspect?.(
      (points.find((point) => point.time === time) ?? null) as CandlestickPoint<Row> | null,
    );
  };
  const select = (time: CandlestickPoint["time"] | null) => {
    if (selection === undefined) setSelection(time);
    onSelectionChange?.(
      (points.find((point) => point.time === time) ?? null) as CandlestickPoint<Row> | null,
    );
  };
  const removedSelection = useRef<CandlestickPoint["time"] | null>(null);
  useLayoutEffect(() => {
    if (activeTime !== null && !points.some((point) => point.time === activeTime)) {
      setActiveTime(null);
      onInspect?.(null);
    }
    if (
      selectedTime !== null &&
      !points.some((point) => point.time === selectedTime) &&
      removedSelection.current !== selectedTime
    ) {
      removedSelection.current = selectedTime;
      if (selection === undefined) setSelection(null);
      onSelectionChange?.(null);
    } else if (selectedTime === null || points.some((point) => point.time === selectedTime))
      removedSelection.current = null;
  }, [points, activeTime, selectedTime, selection, onInspect, onSelectionChange]);
  const rendered = useMemo(
    () => getCandlestickVisiblePoints(points, range, overscan),
    [points, range, overscan],
  );
  const domain = useMemo(
    () =>
      getCandlestickPriceDomain(points, {
        viewport: range,
        autoscale,
        scale: priceScale,
        ...(priceDomain !== undefined ? { domain: priceDomain } : {}),
        ...(priceBounds !== undefined ? { bounds: priceBounds } : {}),
        ...(pricePadding !== undefined ? { padding: pricePadding } : {}),
        overlayValues: [...overlays.values()].flat(),
      }),
    [points, range, autoscale, priceScale, priceDomain, priceBounds, pricePadding, overlays],
  );
  const timeDomain = useMemo(
    () => getCandlestickTimeDomain(points, range, spacing),
    [points, range, spacing],
  );
  const timeFormatter = useCallback(
    (time: CandlestickPoint["time"], point?: CandlestickPoint<object>) =>
      formatTime?.(time, point as unknown as CandlestickPoint<Row>) ?? String(time),
    [formatTime],
  );
  const priceFormatter = useCallback(
    (value: number, point?: CandlestickPoint<object>) =>
      formatPrice?.(value, point as unknown as CandlestickPoint<Row>) ?? String(value),
    [formatPrice],
  );
  const volumeFormatter = useCallback(
    (value: number, point?: CandlestickPoint<object>) =>
      formatVolume?.(value, point as unknown as CandlestickPoint<Row>) ?? String(value),
    [formatVolume],
  );
  const context: Context = {
    points,
    rendered,
    viewport: range,
    timeDomain,
    priceDomain: domain,
    priceScale,
    ...(priceBounds !== undefined ? { priceBounds } : {}),
    autoscale,
    active,
    selected,
    inspect,
    select,
    changeViewport,
    formatTime: timeFormatter,
    formatPrice: priceFormatter,
    formatVolume: volumeFormatter,
    volumeRatio: volumes.size ? volumeRatio : 0,
    contents: contents.size,
    registerContent,
    registerVolume,
    registerOverlay,
    geometry,
    revealClipId,
    priceClipId: `${revealClipId}-price`,
    volumeClipId: `${revealClipId}-volume`,
    interrupt,
  };
  const instructions = useId();
  const reduced = useReducedMotion();
  const panPixels = (initial: CandlestickViewport, pixels: number) => {
    const domain = getCandlestickTimeDomain(points, initial, spacing);
    const delta = (pixels / (geometry.current?.width ?? 1)) * (domain[1] - domain[0]);
    return normalizeCandlestickViewport(
      {
        from: getCandlestickLogicalCoordinate(points, domain[0] + delta, spacing),
        to: getCandlestickLogicalCoordinate(points, domain[1] + delta, spacing),
      },
      points.length,
    );
  };
  const acceptedTap = useRef<{ time: CandlestickPoint["time"] | null } | null>(null);
  useEffect(
    () => () => {
      acceptedTap.current = null;
    },
    [],
  );
  const drag = useRef<{
    pointerId: number;
    x: number;
    range: CandlestickViewport;
    moved: boolean;
  } | null>(null);
  return (
    <CandleContext value={context}>
      <FamilyRoot
        family="CandlestickChart"
        config={config}
        name={props}
        {...(loading !== undefined ? { loading } : {})}
        instructions={{
          id: instructions,
          text: "Arrow keys inspect candles. Home and End inspect first and last. Enter selects. Escape clears inspection and selection. Shift with arrows pans. Plus and minus zoom; 0 fits all. Drag to pan; scroll to zoom.",
        }}
        {...(legendPosition ? { legendPosition } : {})}
        {...(interaction ? { interaction } : {})}
        {...(emphasis ? { emphasis } : {})}
        {...(nonce ? { nonce } : {})}
        {...familyVisibility({ visibleSeries, defaultVisibleSeries, onVisibleSeriesChange })}
        frameProps={{
          ...frameProps,
          tabIndex: frameProps?.tabIndex ?? 0,
          role: frameProps?.role ?? "group",
          "aria-label": props["aria-label"],
          "aria-labelledby": props["aria-labelledby"],
          "aria-describedby": [frameProps?.["aria-describedby"], instructions]
            .filter(Boolean)
            .join(" "),
          onKeyDown: (event) => {
            frameProps?.onKeyDown?.(event);
            if (event.defaultPrevented || event.target !== event.currentTarget || loading) return;
            const candles = points.filter((point) => !point.gap);
            const index = candles.findIndex((point) => point.time === activeTime);
            const directional = active
              ? event.key === "ArrowLeft"
                ? [...candles].reverse().find((point) => point.timeValue < active.timeValue)
                : candles.find((point) => point.timeValue > active.timeValue)
              : candles[0];
            if (event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight"))
              changeViewport(
                panCandlestickViewport(
                  range,
                  (event.key === "ArrowLeft" ? -1 : 1) * Math.max(1, (range.to - range.from) / 10),
                  points.length,
                ),
                "pan",
              );
            else if (
              event.key === "ArrowLeft" ||
              event.key === "ArrowRight" ||
              event.key === "Home" ||
              event.key === "End"
            ) {
              const next =
                event.key === "Home"
                  ? candles.at(0)
                  : event.key === "End"
                    ? candles.at(-1)
                    : (directional ?? candles[index]);
              if (next) {
                inspect(next.time);
                const logical = points.indexOf(next);
                if (logical < range.from || logical > range.to)
                  changeViewport(
                    panCandlestickViewport(
                      range,
                      logical < range.from ? logical - range.from : logical - range.to,
                      points.length,
                    ),
                    "keyboard",
                  );
              }
            } else if (event.key === "Enter" || event.key === " ") select(active?.time ?? null);
            else if (event.key === "Escape") {
              inspect(null);
              select(null);
            } else if (event.key === "+" || event.key === "=" || event.key === "-")
              changeViewport(
                zoomCandlestickViewport(
                  range,
                  event.key === "-" ? 0.8 : 1.25,
                  (range.from + range.to) / 2,
                  points.length,
                ),
                "zoom",
              );
            else if (event.key === "0")
              changeViewport(fitCandlestickViewport(points.length), "reset");
            else return;
            event.preventDefault();
          },
          onPointerDown: (event) => {
            frameProps?.onPointerDown?.(event);
            if (
              event.defaultPrevented ||
              !event.isPrimary ||
              (event.pointerType !== "touch" && event.button !== 0) ||
              drag.current !== null ||
              !event.target ||
              !(event.target instanceof Element) ||
              !event.target.closest("svg.recharts-surface")
            )
              return;
            event.currentTarget.focus({ preventScroll: true });
            acceptedTap.current = null;
            drag.current = { pointerId: event.pointerId, x: event.clientX, range, moved: false };
            inspect(geometry.current?.nearest(event.clientX)?.time ?? null);
          },
          onPointerMove: (event) => {
            frameProps?.onPointerMove?.(event);
            if (event.defaultPrevented) return;
            const current = drag.current;
            if (!event.isPrimary || (current && current.pointerId !== event.pointerId)) return;
            if (current && geometry.current) {
              if (!current.moved && Math.abs(current.x - event.clientX) > 4) {
                current.moved = true;
                acceptedTap.current = null;
                event.currentTarget.setPointerCapture(event.pointerId);
              }
              if (current.moved)
                changeViewport(panPixels(current.range, current.x - event.clientX), "pan");
            }
            if (event.target instanceof Element && event.target.closest("svg.recharts-surface"))
              inspect(geometry.current?.nearest(event.clientX)?.time ?? null);
          },
          onPointerUp: (event) => {
            frameProps?.onPointerUp?.(event);
            if (drag.current?.pointerId !== event.pointerId) return;
            acceptedTap.current =
              !event.defaultPrevented && !drag.current.moved
                ? { time: geometry.current?.nearest(event.clientX)?.time ?? null }
                : null;
            drag.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          },
          onClick: (event) => {
            frameProps?.onClick?.(event);
            const tap = acceptedTap.current;
            acceptedTap.current = null;
            if (
              tap &&
              !event.defaultPrevented &&
              event.button === 0 &&
              event.target instanceof Element &&
              event.target.closest("svg.recharts-surface")
            )
              select(tap.time);
          },
          onPointerCancel: (event) => {
            frameProps?.onPointerCancel?.(event);
            if (drag.current?.pointerId !== event.pointerId) return;
            acceptedTap.current = null;
            drag.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
            if (!event.defaultPrevented) inspect(null);
          },
          onPointerLeave: (event) => {
            frameProps?.onPointerLeave?.(event);
            if (drag.current) acceptedTap.current = null;
            if (!event.defaultPrevented) {
              if (drag.current && !drag.current.moved) drag.current = null;
              if (!drag.current) inspect(null);
            }
          },
          onWheel: (event) => {
            frameProps?.onWheel?.(event);
            if (
              event.defaultPrevented ||
              document.activeElement !== event.currentTarget ||
              !(event.target instanceof Element) ||
              !event.target.closest("svg.recharts-surface")
            )
              return;
            pendingWheel.current = event.nativeEvent;
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
              changeViewport(panPixels(range, event.deltaX), "pan");
              return;
            }
            const domain = getCandlestickTimeDomain(points, range, spacing);
            const anchor =
              geometry.current?.coordinate(event.clientX) ?? (domain[0] + domain[1]) / 2;
            const factor = event.deltaY > 0 ? 0.9 : 1.1;
            const proposed = {
              from: getCandlestickLogicalCoordinate(
                points,
                anchor + (domain[0] - anchor) / factor,
                spacing,
              ),
              to: getCandlestickLogicalCoordinate(
                points,
                anchor + (domain[1] - anchor) / factor,
                spacing,
              ),
            };
            changeViewport(
              proposed.to - proposed.from < 1
                ? zoomCandlestickViewport(
                    range,
                    factor,
                    getCandlestickLogicalCoordinate(points, anchor, spacing),
                    points.length,
                  )
                : normalizeCandlestickViewport(proposed, points.length),
              "zoom",
            );
          },
        }}
      >
        <div className="relative">
          <LineChartFrame
            engine={EngineBarChart}
            motionEnabled={animate !== undefined && animate !== false && !reduced}
            loading={loading}
            loadingLabel={loadingLabel}
            interrupt={() => interrupt.current()}
            chartProps={{
              ...nativeProps,
              data: rendered,
              responsive: true,
              accessibilityLayer: false,
              ...familyFrame({
                ...(width !== undefined ? { width } : {}),
                ...(height !== undefined ? { height } : {}),
                ...(className ? { className } : {}),
                style: { touchAction: "pan-y", ...style },
              }),

              children: (
                <>
                  <Geometry />
                  <CandlestickReveal animate={animate} loading={loading} />
                  {children}
                </>
              ),
            }}
          />
          {loading && <CandlestickLoading />}
        </div>
        {!loading && points.length === 0 && (
          <OutsidePlot>
            <div data-kind-ui="candlestick-empty">{empty}</div>
          </OutsidePlot>
        )}
      </FamilyRoot>
    </CandleContext>
  );
}
function Geometry() {
  const context = useCandlestick();
  const scale = useXAxisScale();
  const area = usePlotArea();
  const ref = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    const svg = ref.current?.ownerSVGElement;
    if (!scale || !area || !svg) return;
    context.geometry.current = {
      width: area.width,
      coordinate: (clientX) => {
        const bounds = svg.getBoundingClientRect();
        const x =
          ((clientX - bounds.left) * (svg.viewBox.baseVal.width || bounds.width)) / bounds.width;
        return (
          context.timeDomain[0] +
          Math.max(0, Math.min(1, (x - area.x) / area.width)) *
            (context.timeDomain[1] - context.timeDomain[0])
        );
      },
      nearest: (clientX) => {
        const bounds = svg.getBoundingClientRect();
        const x =
          ((clientX - bounds.left) * (svg.viewBox.baseVal.width || bounds.width)) / bounds.width;
        if (x < area.x || x > area.x + area.width) return null;
        return getCandlestickVisiblePoints(
          context.points,
          context.viewport,
        ).reduce<NativePoint | null>((closest, point) => {
          const px = scale(point.coordinate);
          const old = closest ? scale(closest.coordinate) : undefined;
          return typeof px === "number" &&
            (!closest || typeof old !== "number" || Math.abs(px - x) < Math.abs(old - x))
            ? point
            : closest;
        }, null);
      },
    };
    return () => {
      context.geometry.current = null;
    };
  }, [context.geometry, context.points, context.viewport, context.timeDomain, scale, area]);
  return <g ref={ref} data-kind-ui="candlestick-geometry" />;
}

export const CandlestickChart = /* @__PURE__ */ Object.assign(CandlestickFamily, {
  Series: CandlestickSeries,
  Mark: CandlestickMark,
  XAxis: CandlestickXAxis,
  YAxis: CandlestickYAxis,
  Grid: CandlestickGrid,
  Volume: CandlestickVolume,
  Overlay: CandlestickOverlay,
  ReferenceLine: CandlestickReferenceLine,
  Crosshair: CandlestickCrosshair,
  Tooltip: CandlestickTooltip,
  Content: CandlestickContent,
  DataTable: CandlestickDataTable,
});
