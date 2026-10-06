"use client";

import {
  type Attributes,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  createContext,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  LineChart as EngineLineChart,
  type RadarChart as EngineRadarChart,
  getRelativeCoordinate,
  useChartHeight,
  useChartWidth,
} from "recharts";
import { useChart } from "./chart-context.js";
import { useEmphasisActions } from "./emphasis.js";
import type { LoadingAnimation } from "./loading-motion.js";
import {
  ChartLoadingSkeleton,
  type LoadingDesign,
  type LoadingFamily,
  useLoadingSeed,
} from "./loading-skeleton.js";

export type LineChartProps = ComponentProps<typeof EngineLineChart> & {
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
};
type Point = { x: number; y: number } | null;
type Interaction = {
  pointer: Point;
  motionReady: boolean;
  keyboard: ReturnType<typeof createKeyboardModality>;
  emphasisScope: string;
  data: LineChartProps["data"];
  categoryEmphasis: boolean;
  registerCategoryEligibility: (id: string, safe: boolean, hidden: boolean) => () => void;
  invalidate: () => void;
  seriesKeys: Map<string, string>;
  registerSeries: (id: string, key: string) => () => void;
  projections: Map<string, (datum: unknown, activeIndex: unknown) => boolean>;
  registerProjection: (
    id: string,
    status: (datum: unknown, activeIndex: unknown) => boolean,
  ) => () => void;
};
export const LineInteraction = createContext<Interaction | null>(null);
export function useLineInteraction() {
  const value = use(LineInteraction);
  if (!value) throw new Error("LineSeries and Tooltip must be inside LineChart");
  return value;
}

// Modality is observed only by decorating marks. Changing it must not rerender
// the native engine and replace a consumer shape during pointer-down/click.
function createKeyboardModality() {
  let current = false;
  const listeners = new Set<() => void>();
  return {
    snapshot: () => current,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set: (next: boolean) => {
      if (current === next) return;
      current = next;
      for (const listener of listeners) listener();
    },
  };
}
export function useChartKeyboard() {
  const { keyboard } = useLineInteraction();
  return useSyncExternalStore(keyboard.subscribe, keyboard.snapshot, () => false);
}

// Geometry and data changes end entrance animation and discard stale pointer pixels.
function Lifecycle({ data, invalidate }: { data: LineChartProps["data"]; invalidate: () => void }) {
  const width = useChartWidth();
  const height = useChartHeight();
  const { visibleSeries } = useChart();
  const previous = useRef({ width, height, data, visibleSeries });
  useLayoutEffect(() => {
    const old = previous.current;
    if (
      (old.width && old.height && (width !== old.width || height !== old.height)) ||
      data !== old.data ||
      visibleSeries !== old.visibleSeries
    )
      invalidate();
    previous.current = { width, height, data, visibleSeries };
  }, [width, height, data, visibleSeries, invalidate]);
  return null;
}

/** Internal boundary shared by the static and optional Motion entry points. */
type NativeChartProps = LineChartProps | ComponentProps<typeof EngineRadarChart>;

export function LineChartFrame<Props extends NativeChartProps & Attributes = LineChartProps>({
  engine: EngineChart,
  interrupt = () => {},
  clip,
  motionEnabled,
  categoryEmphasis = false,
  loading,
  loadingLabel,
  loadingSkeleton,
  loadingAnimation,
  loadingDesign,
  chartProps: props,
  children = props.children,
}: {
  chartProps: Props;
  engine: ComponentType<Props>;
  children?: Props["children"];
  interrupt?: () => void;
  clip?: string;
  motionEnabled?: boolean;
  categoryEmphasis?: boolean;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
  loadingSkeleton?: LoadingFamily;
  loadingAnimation?: LoadingAnimation | undefined;
  loadingDesign?: LoadingDesign | undefined;
}) {
  const loadingSeed = useLoadingSeed(loading);
  const { onMouseMove, onMouseLeave } = props;
  const emphasis = useEmphasisActions();
  const frame = useRef<HTMLDivElement>(null);
  const [keyboard] = useState(createKeyboardModality);
  const setKeyboard = keyboard.set;
  const emphasisScope = useId();
  const clearPlotPointer = emphasis.clearScope;
  useLayoutEffect(() => {
    const node = frame.current;
    if (!node) return;
    const leave = () => clearPlotPointer(emphasisScope);
    node.addEventListener("pointerleave", leave);
    node.addEventListener("mouseleave", leave);
    node.addEventListener("pointercancel", leave);
    return () => {
      node.removeEventListener("pointerleave", leave);
      node.removeEventListener("mouseleave", leave);
      node.removeEventListener("pointercancel", leave);
    };
  }, [clearPlotPointer, emphasisScope]);
  const [motionReady, setMotionReady] = useState(true);
  const [pointer, setPointer] = useState<Point>(null);
  const [categoryPeers, setCategoryPeers] = useState(
    () => new Map<string, { safe: boolean; hidden: boolean }>(),
  );
  const registerCategoryEligibility = useCallback((id: string, safe: boolean, hidden: boolean) => {
    setCategoryPeers((old) =>
      old.get(id)?.safe === safe && old.get(id)?.hidden === hidden
        ? old
        : new Map(old).set(id, { safe, hidden }),
    );
    return () =>
      setCategoryPeers((old) => {
        if (!old.has(id)) return old;
        const next = new Map(old);
        next.delete(id);
        return next;
      });
  }, []);
  const eligibleCategoryPlot =
    categoryEmphasis &&
    emphasis.enabled &&
    categoryPeers.size > 0 &&
    [...categoryPeers.values()].every((peer) => peer.hidden || peer.safe);
  const [seriesKeys, setSeriesKeys] = useState(() => new Map<string, string>());
  const [projections, setProjections] = useState(
    () => new Map<string, (datum: unknown, activeIndex: unknown) => boolean>(),
  );
  const registerProjection = useCallback(
    (id: string, status: (datum: unknown, activeIndex: unknown) => boolean) => {
      setProjections((current) => new Map(current).set(id, status));
      return () =>
        setProjections((current) => {
          const next = new Map(current);
          next.delete(id);
          return next;
        });
    },
    [],
  );
  const registerSeries = useCallback((id: string, key: string) => {
    setSeriesKeys((current) => (current.get(id) === key ? current : new Map(current).set(id, key)));
    return () =>
      setSeriesKeys((current) => {
        if (!current.has(id)) return current;
        const next = new Map(current);
        next.delete(id);
        return next;
      });
  }, []);
  const previousLoading = useRef(loading);
  const completing = previousLoading.current === true && loading !== true;
  useLayoutEffect(() => {
    previousLoading.current = loading;
  });
  const invalidate = useCallback(() => {
    setPointer(null);
    setMotionReady(false);
    if (!completing) interrupt();
  }, [interrupt, completing]);
  const chart = (
    <EngineChart
      {...props}
      className={[
        "kind-ui-line-chart",
        loading !== undefined && "kind-ui-loading-chart",
        loading && "kind-ui-loading-chart-pending",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ ...props.style, "--kind-ui-line-clip": clip ?? "none" } as CSSProperties}
      onMouseMove={(state, event) => {
        const { relativeX, relativeY } = getRelativeCoordinate(event);
        setKeyboard(false);
        setMotionReady(true);
        setPointer({ x: relativeX, y: relativeY });
        interrupt();
        onMouseMove?.(state, event);
      }}
      onMouseLeave={(state, event) => {
        setPointer(null);
        onMouseLeave?.(state, event);
      }}
    >
      <Lifecycle data={props.data} invalidate={invalidate} />
      {children}
      {loading && loadingSkeleton && (
        <ChartLoadingSkeleton
          family={loadingSkeleton}
          seed={loadingSeed}
          animation={loadingAnimation}
          design={loadingDesign}
        />
      )}
    </EngineChart>
  );
  return (
    <LineInteraction
      value={{
        pointer,
        keyboard,
        emphasisScope,
        data: props.data,
        categoryEmphasis: eligibleCategoryPlot,
        registerCategoryEligibility,
        motionReady,
        invalidate,
        seriesKeys,
        registerSeries,
        projections,
        registerProjection,
      }}
    >
      <div
        ref={frame}
        aria-busy={loading}
        aria-hidden={loading || undefined}
        inert={loading || undefined}
        data-kind-ui="line-frame"
        data-motion={motionEnabled === undefined ? undefined : motionEnabled ? "on" : "off"}
        style={{ display: "contents" }}
        onFocusCapture={(event) => {
          interrupt();
          if ((event.target as Element).matches(":focus-visible")) setKeyboard(true);
        }}
        onPointerDownCapture={() => {
          setKeyboard(false);
          interrupt();
        }}
        onPointerLeave={() => emphasis.clearScope(emphasisScope)}
        onPointerCancel={() => emphasis.clearScope(emphasisScope)}
        onPointerOverCapture={() => setKeyboard(false)}
        onPointerMoveCapture={() => {
          setKeyboard(false);
          interrupt();
        }}
        onKeyDownCapture={(event) => {
          setKeyboard(event.key !== "Escape");
          interrupt();
          setMotionReady(true);
          setPointer(null);
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setPointer(null);
            setKeyboard(false);
            emphasis.clear("keyboard");
          }
        }}
      >
        {chart}
      </div>
      {loading !== undefined && (
        <span data-kind-ui="chart-loading-status" role="status" aria-atomic="true">
          {loading ? (loadingLabel ?? "Loading chart") : ""}
        </span>
      )}
    </LineInteraction>
  );
}

/** Recharts owns geometry and keyboard selection; Kind shares pointer/keyboard modality. */
export function LineChart({ loading, loadingLabel, ...props }: LineChartProps) {
  return (
    <LineChartFrame
      chartProps={props}
      engine={EngineLineChart}
      loading={loading}
      loadingLabel={loadingLabel}
      loadingSkeleton="line"
    />
  );
}
