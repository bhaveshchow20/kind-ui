"use client";

import {
  type ComponentProps,
  cloneElement,
  createContext,
  isValidElement,
  type SVGProps,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Dot, type DotItemDotProps, type Radar } from "recharts";
import { useChart } from "./chart-context.js";
import { useChartInteraction } from "./chart-interaction.js";
import { useLineInteraction } from "./line-chart.js";

export type RadarSelectionProps = {
  /** Opt in to persistent series selection. Native spoke inspection remains independent. */
  selection?: "none" | "series" | undefined;
} & (
  | {
      selectedSeries?: undefined;
      onSelectedSeriesChange?: ((next: string | null) => void) | undefined;
    }
  | {
      selectedSeries: string | null;
      onSelectedSeriesChange: (next: string | null) => void;
    }
);
type Selection = {
  enabled: boolean;
  selected: string | null;
  register: (owner: string, key: string, visible: boolean) => () => void;
  toggle: (key: string) => void;
};
const Context = createContext<Selection | null>(null);
const Mode = createContext(false);

/** Persistent selection is local to one RadarChart and never changes Root visibility. */
export function RadarSelectionProvider({
  selection = "none",
  selectedSeries,
  onSelectedSeriesChange,
  children,
}: {
  selection: RadarSelectionProps["selection"];
  selectedSeries?: string | null | undefined;
  onSelectedSeriesChange?: ((next: string | null) => void) | undefined;
  children: React.ReactNode;
}) {
  if (selectedSeries !== undefined && onSelectedSeriesChange === undefined)
    throw new Error("RadarChart requires onSelectedSeriesChange for controlled selectedSeries");
  const interaction = useChartInteraction();
  if (
    interaction.mode === "focus" &&
    (selection !== "none" || selectedSeries !== undefined || onSelectedSeriesChange !== undefined)
  )
    throw new Error(
      "RadarChart selection controls conflict with Root focus; choose one selection owner",
    );
  const enabled = selection === "series";
  const [internal, setInternal] = useState<string | null>(null);
  const [series, setSeries] = useState(() => new Map<string, { key: string; visible: boolean }>());
  const register = useCallback((owner: string, key: string, visible: boolean) => {
    setSeries((old) => {
      if (old.get(owner)?.key === key && old.get(owner)?.visible === visible) return old;
      return new Map(old).set(owner, { key, visible });
    });
    return () =>
      setSeries((old) => {
        if (!old.has(owner)) return old;
        const next = new Map(old);
        next.delete(owner);
        return next;
      });
  }, []);
  const requested = selectedSeries === undefined ? internal : selectedSeries;
  const visible =
    requested !== null &&
    [...series.values()].some((item) => item.key === requested && item.visible);
  const selected = enabled && visible ? requested : null;
  // No synthetic consumer callbacks: only user selection/reset requests emit changes.
  // A controlled value remains consumer-owned; hidden values simply have no visible paint.
  useEffect(() => {
    if (selectedSeries === undefined && internal !== null && (!enabled || !visible))
      setInternal(null);
  }, [selectedSeries, internal, enabled, visible]);
  const change = useCallback(
    (next: string | null) => {
      if (selectedSeries === undefined) setInternal(next);
      onSelectedSeriesChange?.(next);
    },
    [selectedSeries, onSelectedSeriesChange],
  );
  const toggle = useCallback(
    (key: string) => {
      if (enabled) change(selected === key ? null : key);
    },
    [enabled, selected, change],
  );
  const value = useMemo(
    () => ({ enabled, selected, register, toggle }),
    [enabled, selected, register, toggle],
  );
  return (
    <Mode value={enabled}>
      <Context value={value}>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Delegates Escape from descendant controls; the wrapper is not focusable. */}
        <div
          style={{ display: "contents" }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !event.defaultPrevented && enabled && requested !== null)
              queueMicrotask(() => {
                if (!event.defaultPrevented) change(null);
              });
          }}
        >
          {children}
        </div>
      </Context>
    </Mode>
  );
}

/** An extra paint/control layer preserves native shape, data, refs and event handlers. */
export function RadarSelectionLayer({
  seriesKey,
  hidden,
  children,
}: {
  seriesKey: string | undefined;
  hidden: boolean;
  children: React.ReactNode;
}) {
  const selection = use(Context);
  const { config } = useChart();
  const { data } = useLineInteraction();
  const owner = useId();
  const enabled = Boolean(selection?.enabled);
  const present = !hidden && Boolean(data?.length);
  useLayoutEffect(() => {
    if (!enabled || seriesKey === undefined) return;
    return selection?.register(owner, seriesKey, present);
  }, [enabled, selection?.register, owner, seriesKey, present]);
  if (enabled && seriesKey === undefined)
    throw new Error("RadarSeries requires seriesKey for selection with a non-string dataKey");
  const interactive = enabled && present && seriesKey !== undefined;
  const selected = interactive && selection?.selected === seriesKey;
  const dimmed = interactive && selection?.selected != null && !selected;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useAriaPropsSupportedByRole: The role, pressed state and handlers are enabled together only for opted-in SVG controls.
    <g
      data-kind-ui={interactive ? "radar-selection" : undefined}
      data-series={interactive ? seriesKey : undefined}
      data-selection={
        interactive ? (selected ? "selected" : dimmed ? "dimmed" : "baseline") : undefined
      }
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Highlight ${config[seriesKey]?.label ?? seriesKey}` : undefined}
      aria-pressed={interactive ? selected : undefined}
      onClick={(event) => {
        // React portal events bubble through this component even when their paint is elsewhere.
        // Annotations, native active-dot overlays and consumer portals retain their own interaction.
        if (
          interactive &&
          !event.defaultPrevented &&
          event.button === 0 &&
          event.currentTarget.contains(event.target as Node)
        )
          selection?.toggle(seriesKey);
      }}
      onKeyDown={(event) => {
        if (
          interactive &&
          event.target === event.currentTarget &&
          !event.defaultPrevented &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          if (!event.repeat) selection?.toggle(seriesKey);
        }
      }}
    >
      <g data-kind-ui="radar-selection-paint" style={{ opacity: dimmed ? 0.28 : 1 }}>
        {children}
      </g>
    </g>
  );
}

type RadarDot = ComponentProps<typeof Radar>["dot"];

/** Recharts clones this public dot element with its original computed dot props. */
export function useRadarSelectionDot(dot: RadarDot, seriesKey: string | undefined): RadarDot {
  const enabled = use(Mode);
  return useMemo(() => {
    if (!enabled) return dot;
    const props = isValidElement<SVGProps<SVGElement>>(dot)
      ? dot.props
      : typeof dot === "object"
        ? dot
        : {};
    return <RadarSelectionDot {...props} option={dot} seriesKey={seriesKey} />;
  }, [enabled, dot, seriesKey]);
}

function RadarSelectionDot({
  option,
  seriesKey,
  ...props
}: {
  option: RadarDot;
  seriesKey: string | undefined;
  [key: string]: unknown;
}) {
  const selection = use(Context);
  // Native Radar draws a fallback dot for a one-point series even when dot is false.
  if (!option && (!Array.isArray(props.points) || props.points.length !== 1)) return null;
  const dimmed =
    selection?.enabled && selection.selected !== null && selection.selected !== seriesKey;
  let paint: React.ReactNode;
  if (isValidElement(option)) paint = cloneElement(option, props);
  // The engine injects the complete public DotItemDotProps when cloning the adapter above.
  else if (typeof option === "function") paint = option(props as DotItemDotProps);
  else
    paint = (
      <Dot
        {...props}
        className={[
          "recharts-radar-dot",
          typeof option === "object" ? option?.className : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    );
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Pointer target for the corresponding keyboard-operable series control, not an additional tab stop.
    <g
      data-kind-ui="radar-selection-dot"
      style={{ opacity: dimmed ? 0.28 : 1 }}
      onClick={(event) => {
        if (
          !event.defaultPrevented &&
          event.button === 0 &&
          seriesKey !== undefined &&
          event.currentTarget.contains(event.target as Node)
        )
          selection?.toggle(seriesKey);
      }}
    >
      {paint}
    </g>
  );
}
