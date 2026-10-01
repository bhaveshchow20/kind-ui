"use client";

import {
  type Attributes,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  createContext,
  use,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  LineChart as EngineLineChart,
  type RadarChart as EngineRadarChart,
  getRelativeCoordinate,
  useChartHeight,
  useChartWidth,
} from "recharts";

import { useChart } from "./chart-context.js";

export type LineChartProps = ComponentProps<typeof EngineLineChart>;
type Point = { x: number; y: number } | null;
type Interaction = {
  pointer: Point;
  motionReady: boolean;
  invalidate: () => void;
  seriesKeys: Map<string, string>;
  registerSeries: (id: string, key: string) => () => void;
};
export const LineInteraction = createContext<Interaction | null>(null);
export function useLineInteraction() {
  const value = use(LineInteraction);
  if (!value) throw new Error("LineSeries and Tooltip must be inside LineChart");
  return value;
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
  chartProps: props,
  children = props.children,
}: {
  chartProps: Props;
  engine: ComponentType<Props>;
  children?: Props["children"];
  interrupt?: () => void;
  clip?: string;
  motionEnabled?: boolean;
}) {
  const { onMouseMove, onMouseLeave } = props;
  const [motionReady, setMotionReady] = useState(true);
  const [pointer, setPointer] = useState<Point>(null);
  const [seriesKeys, setSeriesKeys] = useState(() => new Map<string, string>());
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
  const invalidate = useCallback(() => {
    setPointer(null);
    setMotionReady(false);
    interrupt();
  }, [interrupt]);
  return (
    <LineInteraction
      value={{
        pointer,
        motionReady,
        invalidate,
        seriesKeys,
        registerSeries,
      }}
    >
      <div
        data-kind-ui="line-frame"
        data-motion={motionEnabled === undefined ? undefined : motionEnabled ? "on" : "off"}
        style={{ display: "contents" }}
        onFocusCapture={interrupt}
        onPointerDownCapture={interrupt}
        onPointerMoveCapture={interrupt}
        onKeyDownCapture={() => {
          interrupt();
          setMotionReady(true);
          setPointer(null);
        }}
        onBlurCapture={() => setPointer(null)}
      >
        <EngineChart
          {...props}
          className={["kind-ui-line-chart", props.className].filter(Boolean).join(" ")}
          style={{ ...props.style, "--kind-ui-line-clip": clip ?? "none" } as CSSProperties}
          onMouseMove={(state, event) => {
            const { relativeX, relativeY } = getRelativeCoordinate(event);
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
        </EngineChart>
      </div>
    </LineInteraction>
  );
}

/** Recharts owns geometry and keyboard selection; Kind shares pointer/keyboard modality. */
export function LineChart(props: LineChartProps) {
  return <LineChartFrame chartProps={props} engine={EngineLineChart} />;
}
