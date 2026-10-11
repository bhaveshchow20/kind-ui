"use client";

import { animateMini, animate as animateValue } from "motion/react";
import {
  type ComponentPropsWithRef,
  type ComponentType,
  type CSSProperties,
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  createHeatmapModel,
  type HeatmapCell,
  type HeatmapModel,
  type HeatmapModelOptions,
  type HeatmapScale,
} from "./heatmap-model.js";
import { LoadingSkeletonSurface, LoadingStatus, useLoadingSeed } from "./loading-skeleton.js";
import { StandaloneLoadingDesign } from "./loading-standalone-designs.js";
import type { TooltipContentProps } from "./tooltip-content.js";
import { TooltipNumber } from "./tooltip-number.js";
import { cn } from "./utils.js";

export type HeatmapChartProps = ComponentPropsWithRef<"div"> &
  HeatmapModelOptions & {
    scale: HeatmapScale;
    formatValue?: (value: number) => string;
    missingLabel?: string;
    /** Diagonal cell entrance; quantitative colors and table geometry are unchanged. */
    animate?: boolean;
    loading?: boolean | undefined;
    loadingLabel?: string | undefined;
  };
type Context = {
  loadingSeed: number;
  loading: boolean | undefined;
  model: HeatmapModel;
  entrance: boolean;
  scale: HeatmapScale;
  formatValue: (value: number) => string;
  missingLabel: string;
  active: readonly [string, string] | null;
  setActive: (key: readonly [string, string] | null) => void;
  dismiss: () => void;
  inspectPointer: (event: React.PointerEvent, key: readonly [string, string]) => void;
  tooltipId: string;
  tooltipMounted: boolean;
  setTooltipMounted: (mounted: boolean) => void;
};
const HeatmapContext = createContext<Context | null>(null);
function useHeatmap() {
  const value = use(HeatmapContext);
  if (!value) throw new Error("Heatmap components require HeatmapChart");
  return value;
}
const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribeReduced(change: () => void) {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const reducedSnapshot = () => window.matchMedia(reducedQuery).matches;
const reducedServerSnapshot = () => true;
const number = (value: number) => String(value);
const keyOf = (cell: HeatmapCell) => JSON.stringify([cell.row, cell.column]);
type PointerPosition = Pick<PointerEvent, "pointerId" | "pointerType" | "clientX" | "clientY">;
const pointerPosition = (event: PointerPosition): PointerPosition => ({
  pointerId: event.pointerId,
  pointerType: event.pointerType,
  clientX: event.clientX,
  clientY: event.clientY,
});
const samePointer = (a: PointerPosition | null, b: PointerPosition) =>
  a !== null &&
  a.pointerId === b.pointerId &&
  a.pointerType === b.pointerType &&
  a.clientX === b.clientX &&
  a.clientY === b.clientY;
const labelOf = (cell: HeatmapCell, context: Context) =>
  `${cell.row}, ${cell.column}: ${cell.value === null ? context.missingLabel : context.formatValue(cell.value)}`;

/** Native table layout owns categorical geometry. No numeric scatter approximation or SVG overlay. */
export function HeatmapChart({
  rows,
  columns,
  data,
  duplicates,
  scale,
  formatValue = number,
  missingLabel = "Missing",
  animate = false,
  loading,
  loadingLabel,
  children,
  onPointerLeave,
  ...props
}: HeatmapChartProps) {
  const loadingSeed = useLoadingSeed(loading);
  const model = useMemo(
    () => createHeatmapModel({ rows, columns, data, ...(duplicates ? { duplicates } : {}) }),
    [rows, columns, data, duplicates],
  );
  const [active, updateActive] = useState<readonly [string, string] | null>(null);
  const pointer = useRef<PointerPosition | null>(null);
  const dismissed = useRef(false);
  const setActive = useCallback(
    (key: readonly [string, string] | null) => {
      if (loading) return;
      if (key) dismissed.current = false;
      updateActive(key);
    },
    [loading],
  );
  const dismiss = useCallback(() => {
    dismissed.current = true;
    updateActive(null);
  }, []);
  const inspectPointer = useCallback(
    (event: React.PointerEvent, key: readonly [string, string]) => {
      const stationary = samePointer(pointer.current, event);
      pointer.current = pointerPosition(event);
      if (dismissed.current && stationary) return;
      setActive(key);
    },
    [setActive],
  );
  const tooltipId = useId();
  const [tooltipMounted, setTooltipMounted] = useState(false);
  const reduced = useSyncExternalStore(subscribeReduced, reducedSnapshot, reducedServerSnapshot);
  const [finished, setFinished] = useState(false);
  const previousLoading = useRef(loading);
  const completing = previousLoading.current === true && loading !== true;
  const interrupt = useCallback(() => {
    if (!loading) setFinished(true);
  }, [loading]);
  const enabled = animate && !reduced && !loading;
  useLayoutEffect(() => {
    if (loading) {
      setFinished(false);
      updateActive(null);
      pointer.current = null;
    }
  }, [loading]);
  const entrance = enabled && !finished;
  const root = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!tooltipMounted) return;
    // Keep the Escape baseline current even before focus/hover activates a cell.
    // Layout/scroll can send boundary events without new pointer input. Only actual
    // movement clears dismissal, including movement outside or within an entered cell.
    const move = (event: PointerEvent) => {
      const stationary = samePointer(pointer.current, event);
      pointer.current = pointerPosition(event);
      if (!dismissed.current || stationary) return;
      dismissed.current = false;
      const target =
        event.target instanceof Element ? event.target.closest("td[data-cell-key]") : null;
      if (!target || !root.current?.contains(target)) return;
      const cell = model.cells
        .flat()
        .find((item) => keyOf(item) === target.getAttribute("data-cell-key"));
      if (cell) setActive([cell.row, cell.column]);
    };
    document.addEventListener("pointermove", move, true);
    return () => document.removeEventListener("pointermove", move, true);
  }, [tooltipMounted, model, setActive]);
  const consumerRef = props.ref;
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof consumerRef === "function") return consumerRef(node);
      if (consumerRef) consumerRef.current = node;
    },
    [consumerRef],
  );
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || !entrance) return;
    const initial = node.getBoundingClientRect();
    const observer = new ResizeObserver(() => {
      const next = node.getBoundingClientRect();
      if (next.width !== initial.width || next.height !== initial.height) interrupt();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [entrance, interrupt]);
  const previous = useRef([model, scale, children]);
  const previousEnabled = useRef(enabled);
  useLayoutEffect(() => {
    const inputs = [model, scale, children];
    if (
      !loading &&
      !completing &&
      (inputs.some((value, index) => value !== previous.current[index]) ||
        (previousEnabled.current && !enabled))
    )
      interrupt();
    previous.current = inputs;
    previousEnabled.current = enabled;
    previousLoading.current = loading;
  });
  useLayoutEffect(() => {
    if (!entrance) return;
    const controls = animateValue(0, 1, { duration: 0.8, onComplete: interrupt });
    return () => controls.stop();
  }, [entrance, interrupt]);
  useEffect(() => {
    if (!active || !tooltipMounted) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) dismiss();
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [active, tooltipMounted, dismiss]);
  return (
    <HeatmapContext
      value={{
        loading,
        loadingSeed,
        model,
        entrance,
        scale,
        formatValue,
        missingLabel,
        active: loading ? null : active,
        setActive,
        dismiss,
        inspectPointer,
        tooltipId,
        tooltipMounted,
        setTooltipMounted,
      }}
    >
      <div
        {...props}
        ref={ref}
        data-kind-ui="heatmap"
        className={cn("text-[color:var(--foreground,inherit)]", props.className)}
        aria-busy={props["aria-busy"]}
        onFocusCapture={(event) => {
          props.onFocusCapture?.(event);
          interrupt();
        }}
        onPointerMoveCapture={(event) => {
          props.onPointerMoveCapture?.(event);
          interrupt();
        }}
        onPointerDownCapture={(event) => {
          props.onPointerDownCapture?.(event);
          interrupt();
        }}
        onKeyDownCapture={(event) => {
          props.onKeyDownCapture?.(event);
          interrupt();
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (!active) return;
          const focused = document.activeElement as HTMLElement | null;
          const cell = event.currentTarget.contains(focused)
            ? model.cells.flat().find((item) => keyOf(item) === focused?.dataset.cellKey)
            : undefined;
          setActive(cell ? [cell.row, cell.column] : null);
        }}
      >
        <div data-kind-ui="heatmap-entrance">{children}</div>
        <LoadingStatus loading={loading} label={loadingLabel} />
      </div>
    </HeatmapContext>
  );
}

// A native cell keeps its styles, ref and handlers. Motion temporarily multiplies its opacity.
function EntranceCell({ diagonal, ...props }: ComponentPropsWithRef<"td"> & { diagonal: number }) {
  const { entrance, model } = useHeatmap();
  const cell = useRef<HTMLTableCellElement | null>(null);
  const consumerRef = props.ref;
  const ref = useCallback(
    (node: HTMLTableCellElement | null) => {
      cell.current = node;
      if (typeof consumerRef === "function") return consumerRef(node);
      if (consumerRef) consumerRef.current = node;
    },
    [consumerRef],
  );
  const latestOpacity = useRef(props.style?.opacity);
  latestOpacity.current = props.style?.opacity;
  useLayoutEffect(() => {
    const node = cell.current;
    if (!node || !entrance) return;
    const original = node.style.opacity;
    const declaredOpacity = props.style?.opacity;
    const opacity = Number(getComputedStyle(node).opacity);
    const delay = (diagonal / Math.max(1, model.rows.length + model.columns.length - 2)) * 0.55;
    const controls = animateMini(
      node,
      { opacity: [0, opacity] },
      { delay, duration: 0.25, ease: "easeOut" },
    );
    return () => {
      controls.stop();
      node.style.opacity = Object.is(latestOpacity.current, declaredOpacity)
        ? original
        : latestOpacity.current === undefined
          ? ""
          : String(latestOpacity.current);
    };
  }, [entrance, diagonal, model, props.style?.opacity]);
  return <td {...props} ref={ref} data-kind-ui="heatmap-cell-entrance" />;
}

export type HeatmapCellContentProps = { cell: HeatmapCell; fill: string; formattedValue: string };
export function HeatmapCellContent({ fill, formattedValue }: HeatmapCellContentProps) {
  const channels = /^#[0-9a-f]{6}$/i.test(fill)
    ? [1, 3, 5].map((i) => {
        const value = Number.parseInt(fill.slice(i, i + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      })
    : [1, 1, 1];
  const luminance =
    (channels[0] ?? 1) * 0.2126 + (channels[1] ?? 1) * 0.7152 + (channels[2] ?? 1) * 0.0722;
  return (
    <span
      style={{
        color: /^#[0-9a-f]{6}$/i.test(fill)
          ? luminance > 0.179
            ? "#000000"
            : "#ffffff"
          : "var(--foreground, #172033)",
      }}
    >
      {formattedValue}
    </span>
  );
}
export type HeatmapMaterial = "plain" | "clay" | "glow";

// Static utilities let consumer Tailwind builds discover the exact perimeter paint.
const materialClasses: Record<HeatmapMaterial, string> = {
  plain: "",
  clay: "bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22top%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.7%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%220%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22bottom%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23172033%22%20stop-opacity%3D%220%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23172033%22%20stop-opacity%3D%22.4%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22left%22%3E%3Cstop%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.5%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%220%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22right%22%3E%3Cstop%20stop-color%3D%22%23172033%22%20stop-opacity%3D%220%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23172033%22%20stop-opacity%3D%22.3%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M0%200H100V8H0Z%22%20fill%3D%22url%28%23top%29%22%2F%3E%3Cpath%20d%3D%22M0%2092H100V100H0Z%22%20fill%3D%22url%28%23bottom%29%22%2F%3E%3Cpath%20d%3D%22M0%208H8V92H0Z%22%20fill%3D%22url%28%23left%29%22%2F%3E%3Cpath%20d%3D%22M92%208H100V92H92Z%22%20fill%3D%22url%28%23right%29%22%2F%3E%3C%2Fsvg%3E')] bg-[length:100%_100%] bg-no-repeat",
  glow: "bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22top%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.95%22%2F%3E%3Cstop%20offset%3D%22.2%22%20stop-color%3D%22%23fff%22%2F%3E%3Cstop%20offset%3D%22.55%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.35%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%220%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22bottom%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20stop-color%3D%22%23fff%22%20stop-opacity%3D%220%22%2F%3E%3Cstop%20offset%3D%22.45%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.35%22%2F%3E%3Cstop%20offset%3D%22.8%22%20stop-color%3D%22%23fff%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.95%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22left%22%3E%3Cstop%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.95%22%2F%3E%3Cstop%20offset%3D%22.2%22%20stop-color%3D%22%23fff%22%2F%3E%3Cstop%20offset%3D%22.55%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.35%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%220%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22right%22%3E%3Cstop%20stop-color%3D%22%23fff%22%20stop-opacity%3D%220%22%2F%3E%3Cstop%20offset%3D%22.45%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.35%22%2F%3E%3Cstop%20offset%3D%22.8%22%20stop-color%3D%22%23fff%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23fff%22%20stop-opacity%3D%22.95%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cpath%20d%3D%22M0%200H100V8H0Z%22%20fill%3D%22url%28%23top%29%22%2F%3E%3Cpath%20d%3D%22M0%2092H100V100H0Z%22%20fill%3D%22url%28%23bottom%29%22%2F%3E%3Cpath%20d%3D%22M0%208H8V92H0Z%22%20fill%3D%22url%28%23left%29%22%2F%3E%3Cpath%20d%3D%22M92%208H100V92H92Z%22%20fill%3D%22url%28%23right%29%22%2F%3E%3C%2Fsvg%3E')] bg-[length:100%_100%] bg-no-repeat",
};
const hiddenLabelClasses = "sr-only";
const headerClasses = "p-[0.4rem] text-center text-[0.75rem] font-medium wrap-anywhere";
const scrollClasses = "max-w-full overflow-x-auto [container-type:inline-size]";

export type HeatmapGridProps = Omit<ComponentPropsWithRef<"table">, "children"> & {
  /** Required accessible name, also rendered as a native caption. */
  caption: string;
  /** Optional fixed square cells, spacing and visual labels; accessible headers remain. */
  layout?: {
    /** Positive CSS length or finite positive pixels. Omit to retain fluid cells. */
    cellSize?: number | string;
    /** Nonnegative CSS length or finite nonnegative pixels. Defaults to 3px. */
    gap?: number | string;
    rowLabels?: "visible" | "hidden";
    columnLabels?: "visible" | "hidden";
  };
  /** Static edge treatment; the central 84% × 84% remains the exact scale color. */
  material?: HeatmapMaterial;
  Cell?: ComponentType<HeatmapCellContentProps>;
  /** Native cell styles, refs and handlers; grid semantics and navigation remain owned by the table. */
  cellProps?: (cell: HeatmapCell) => ComponentPropsWithRef<"td">;
  rowLabel?: (row: string) => ReactNode;
  columnLabel?: (column: string) => ReactNode;
};

export function HeatmapGrid({
  caption,
  material = "plain",
  layout,
  Cell = HeatmapCellContent,
  cellProps,
  rowLabel,
  columnLabel,
  onKeyDown,
  onBlur,
  onPointerLeave,
  style,
  ...props
}: HeatmapGridProps) {
  const context = useHeatmap();
  const headerId = useId();
  for (const [name, value] of [
    ["cellSize", layout?.cellSize],
    ["gap", layout?.gap],
  ] as const) {
    if (
      typeof value === "number" &&
      (!Number.isFinite(value) || (name === "cellSize" ? value <= 0 : value < 0))
    ) {
      throw new Error(
        `HeatmapGrid layout.${name} must be finite and ${name === "cellSize" ? "positive" : "nonnegative"}`,
      );
    }
  }
  const length = (value: number | string | undefined) =>
    typeof value === "number" ? `${value}px` : value;
  const { model, scale, active, setActive, tooltipId } = context;
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const table = useRef<HTMLTableElement | null>(null);
  const focused =
    model.cells.flat().find((cell) => keyOf(cell) === focusedKey) ?? model.cells[0]?.[0];
  const tabKey = focused ? keyOf(focused) : null;
  function move(event: React.KeyboardEvent<HTMLTableElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const target = event.target;
    if (!(target instanceof HTMLTableCellElement) || target.dataset.cellKey === undefined) return;
    const cell = model.cells.flat().find((item) => keyOf(item) === target.dataset.cellKey);
    if (!cell) return;
    let r = cell.rowIndex;
    let c = cell.columnIndex;
    switch (event.key) {
      case "ArrowRight":
        c++;
        break;
      case "ArrowLeft":
        c--;
        break;
      case "ArrowDown":
        r++;
        break;
      case "ArrowUp":
        r--;
        break;
      case "Home":
        c = 0;
        if (event.ctrlKey) r = 0;
        break;
      case "End":
        c = model.columns.length - 1;
        if (event.ctrlKey) r = model.rows.length - 1;
        break;
      case "Escape":
        context.dismiss();
        event.preventDefault();
        return;
      default:
        return;
    }
    event.preventDefault();
    r = Math.max(0, Math.min(r, model.rows.length - 1));
    c = Math.max(0, Math.min(c, model.columns.length - 1));
    const next = model.cells[r]?.[c];
    if (next) {
      const element = Array.from(
        table.current?.querySelectorAll<HTMLTableCellElement>("td[data-cell-key]") ?? [],
      ).find((td) => td.dataset.cellKey === keyOf(next));
      if (element) {
        setActive([next.row, next.column]);
        element.focus();
      }
    }
  }
  return (
    <div
      data-kind-ui="heatmap-scroll"
      data-loading={context.loading || undefined}
      className={cn(
        scrollClasses,
        "[&>[data-kind-ui=chart-loading-skeleton]]:absolute [&>[data-kind-ui=chart-loading-skeleton]]:inset-0",
        context.loading && "relative",
      )}
    >
      <table
        {...props}
        ref={(node) => {
          table.current = node;
          if (typeof props.ref === "function") return props.ref(node);
          if (props.ref) props.ref.current = node;
        }}
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: WAI-ARIA APG data grid uses a native table with roving cell focus.
        role="grid"
        aria-label={caption}
        aria-busy={context.loading}
        aria-hidden={context.loading || undefined}
        inert={context.loading || undefined}
        data-kind-ui="heatmap-grid"
        data-cell-sizing={layout?.cellSize === undefined ? undefined : "fixed"}
        data-row-labels={layout?.rowLabels}
        data-column-labels={layout?.columnLabels}
        className={cn(
          "table-fixed border-separate border-spacing-[var(--heatmap-gap,3px)]",
          layout?.cellSize === undefined
            ? layout?.rowLabels === "hidden"
              ? "w-full min-w-[calc(var(--heatmap-columns)*3.25rem)]"
              : "w-full min-w-[calc(7rem+var(--heatmap-columns)*3.25rem)]"
            : "min-w-0 w-[calc(var(--heatmap-row-width)+var(--heatmap-gap,3px)+var(--heatmap-columns)*(var(--heatmap-cell-size)+var(--heatmap-gap,3px))+var(--heatmap-gap,3px))]",
          layout?.cellSize !== undefined &&
            (layout.rowLabels === "hidden"
              ? "[--heatmap-row-width:0px]"
              : "[--heatmap-row-width:6.8rem]"),
          context.loading && "invisible",
          props.className,
        )}
        style={
          {
            "--heatmap-columns": model.columns.length,
            ...(layout?.cellSize === undefined
              ? {}
              : { "--heatmap-cell-size": length(layout.cellSize) }),
            ...(layout?.gap === undefined ? {} : { "--heatmap-gap": length(layout.gap) }),
            ...style,
          } as CSSProperties
        }
        onKeyDown={move}
        onBlur={(event) => {
          onBlur?.(event);
          if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
        }}
        onPointerLeave={onPointerLeave}
      >
        <caption
          className={cn(
            "max-w-[100cqw] pb-[1rem] text-left font-semibold wrap-anywhere",
            layout?.cellSize === undefined ? "w-[100cqw]" : "w-auto",
          )}
        >
          {caption}
        </caption>
        {layout?.cellSize === undefined ? null : (
          <colgroup>
            <col data-kind-ui="heatmap-row-column" className="w-(--heatmap-row-width)" />
            {model.columns.map((column) => (
              <col key={column} className="w-(--heatmap-cell-size)" />
            ))}
          </colgroup>
        )}
        <thead className={layout?.columnLabels === "hidden" ? hiddenLabelClasses : undefined}>
          <tr>
            <th
              scope="col"
              className={
                layout?.rowLabels === "hidden"
                  ? hiddenLabelClasses
                  : cn(headerClasses, "w-[6rem] text-left")
              }
            >
              Row / column
            </th>
            {model.columns.map((column, c) => (
              <th scope="col" key={column} id={`${headerId}-column-${c}`} className={headerClasses}>
                {columnLabel?.(column) ?? column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row, r) => (
            <tr key={row}>
              <th
                scope="row"
                id={`${headerId}-row-${r}`}
                className={
                  layout?.rowLabels === "hidden"
                    ? hiddenLabelClasses
                    : cn(
                        headerClasses,
                        "w-[6rem] text-left",
                        layout?.cellSize !== undefined && "py-0 leading-(--heatmap-cell-size)",
                      )
                }
              >
                <span
                  data-kind-ui="heatmap-row-label"
                  title={row}
                  className="block max-h-[1.3rem] truncate"
                >
                  {rowLabel?.(row) ?? row}
                </span>
              </th>
              {model.cells[r]?.map((cell, c) => {
                const extra = cellProps?.(cell) ?? {};
                const fill =
                  cell.value === null ? "var(--heatmap-missing, #e5e7eb)" : scale.color(cell.value);
                const formattedValue =
                  cell.value === null ? context.missingLabel : context.formatValue(cell.value);
                return (
                  <EntranceCell
                    diagonal={r + c}
                    {...extra}
                    key={cell.column}
                    role="gridcell"
                    headers={`${headerId}-row-${r} ${headerId}-column-${c}`}
                    data-cell-key={keyOf(cell)}
                    data-missing={cell.value === null ? "true" : "false"}
                    data-material={cell.value === null ? undefined : material}
                    className={cn(
                      "cursor-default truncate rounded-[3px] text-center text-[0.75rem] text-[#111827] tabular-nums focus-visible:outline-[3px] focus-visible:outline-solid focus-visible:outline-[var(--foreground,#172033)] focus-visible:outline-offset-[1px]",
                      layout?.cellSize === undefined
                        ? "h-[2.6rem] p-px"
                        : "box-border h-(--heatmap-cell-size) w-(--heatmap-cell-size) p-0 leading-(--heatmap-cell-size)",
                      cell.value === null
                        ? "bg-[repeating-linear-gradient(135deg,transparent_0_5px,#17203315_5px_6px)]"
                        : materialClasses[material],
                      extra.className,
                    )}
                    tabIndex={keyOf(cell) === tabKey ? 0 : -1}
                    aria-label={labelOf(cell, context)}
                    aria-describedby={
                      context.tooltipMounted &&
                      active?.[0] === cell.row &&
                      active[1] === cell.column
                        ? tooltipId
                        : undefined
                    }
                    style={{ ...extra.style, backgroundColor: fill }}
                    onFocus={(event) => {
                      extra.onFocus?.(event);
                      setFocusedKey(keyOf(cell));
                      setActive([cell.row, cell.column]);
                    }}
                    onPointerDown={(event) => {
                      extra.onPointerDown?.(event);
                      // A press is deliberate even at the dismissed pointer position.
                      setActive([cell.row, cell.column]);
                    }}
                    onPointerEnter={(event) => {
                      extra.onPointerEnter?.(event);
                      context.inspectPointer(event, [cell.row, cell.column]);
                    }}
                  >
                    <Cell cell={cell} fill={fill} formattedValue={formattedValue} />
                  </EntranceCell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {context.loading && (
        <LoadingSkeletonSurface
          family="heatmap"
          design={(seed) => <StandaloneLoadingDesign family="heatmap" seed={seed} />}
          width="100%"
          height="100%"
          seed={context.loadingSeed}
        />
      )}
      {!context.loading && (model.rows.length === 0 || model.columns.length === 0) ? (
        <p data-kind-ui="heatmap-empty">No cells in the selected domains.</p>
      ) : null}
    </div>
  );
}

export type HeatmapTooltipProps = Omit<ComponentPropsWithRef<"div">, "children" | "id"> & {
  Content?: ComponentType<HeatmapCellContentProps>;
  /** Opt in for the built-in value only; Content keeps complete presentation ownership. */
  valueAnimation?: TooltipContentProps["valueAnimation"];
};
/** In-flow tooltip stays within narrow containers and remains available for hover, focus and touch. */
export function HeatmapTooltip({ Content, valueAnimation, ...props }: HeatmapTooltipProps) {
  const context = useHeatmap();
  useEffect(() => {
    context.setTooltipMounted(true);
    return () => context.setTooltipMounted(false);
  }, [context.setTooltipMounted]);
  const cell = context.model.cells
    .flat()
    .find((item) => item.row === context.active?.[0] && item.column === context.active[1]);
  return (
    <div
      {...props}
      id={context.tooltipId}
      role="tooltip"
      data-kind-ui="heatmap-tooltip"
      className={cn(
        "mt-[0.75rem] rounded-[var(--radius,0.5rem)] border border-solid border-[var(--border,#d1d5db)] px-[0.8rem] py-[0.6rem] text-[0.8rem] wrap-anywhere [&[hidden]]:hidden",
        props.className,
      )}
      hidden={!cell}
    >
      {cell ? (
        Content ? (
          <Content
            cell={cell}
            fill={
              cell.value === null
                ? "var(--heatmap-missing, #e5e7eb)"
                : context.scale.color(cell.value)
            }
            formattedValue={
              cell.value === null ? context.missingLabel : context.formatValue(cell.value)
            }
          />
        ) : valueAnimation === "shuffle" && cell.value !== null && Number.isFinite(cell.value) ? (
          <>
            {`${cell.row}, ${cell.column}: `}
            <TooltipNumber value={context.formatValue(cell.value)} />
          </>
        ) : (
          labelOf(cell, context)
        )
      ) : null}
    </div>
  );
}

export type HeatmapLegendProps = Omit<ComponentPropsWithRef<"fieldset">, "children"> & {
  label: string;
};
export function HeatmapLegend({ label, ...props }: HeatmapLegendProps) {
  const { scale, formatValue, missingLabel } = useHeatmap();
  const [min, max] = scale.domain;
  return (
    <fieldset
      {...props}
      data-kind-ui="heatmap-legend"
      className={cn(
        "mx-0 mt-[1rem] w-full min-w-0 max-w-[22rem] border-0 p-0 text-[0.75rem]",
        props.className,
      )}
      aria-label={`${label}: ${formatValue(min)} to ${formatValue(max)}; ${missingLabel}`}
    >
      <legend>{label}</legend>
      <div
        data-kind-ui="heatmap-ramp"
        className="relative mt-[0.5rem] h-[0.65rem] rounded-[3px]"
        aria-hidden="true"
        style={{
          background:
            min === max
              ? scale.color(min)
              : `linear-gradient(to right in srgb, ${scale.colors.join(", ")})`,
        }}
      >
        {min < 0 && max > 0 ? (
          <i
            data-kind-ui="heatmap-zero-marker"
            className="absolute -top-[2px] -bottom-[2px] w-px bg-[var(--foreground,#172033)]"
            style={{ left: `${(-min / (max - min)) * 100}%` }}
          />
        ) : null}
      </div>
      <div data-kind-ui="heatmap-ticks" className="relative mt-[0.3rem] flex justify-between">
        <span className="max-w-[48%] wrap-anywhere">{formatValue(min)}</span>
        <span className="max-w-[48%] wrap-anywhere">{formatValue(max)}</span>
      </div>
      {min < 0 && max > 0 ? (
        <span data-kind-ui="heatmap-zero-label" className="mt-[0.25rem] block wrap-anywhere">
          Zero marker: {formatValue(0)}
        </span>
      ) : null}
      <span
        data-kind-ui="heatmap-missing-key"
        className="mt-[0.5rem] inline-flex items-center gap-[0.4rem]"
      >
        <i
          aria-hidden="true"
          className="h-[0.85rem] w-[0.85rem] rounded-[2px] bg-(--heatmap-missing,#e5e7eb) bg-[repeating-linear-gradient(135deg,transparent_0_5px,#17203315_5px_6px)]"
        />
        {missingLabel}
      </span>
    </fieldset>
  );
}

export type HeatmapDataTableProps = Omit<ComponentPropsWithRef<"table">, "children"> & {
  caption: string;
};
/** Independent static native table; the host decides whether it is visible or in a details disclosure. */
export function HeatmapDataTable({ caption, ...props }: HeatmapDataTableProps) {
  const context = useHeatmap();
  const { model, formatValue, missingLabel } = context;
  return (
    <div data-kind-ui="heatmap-scroll" className={scrollClasses}>
      <table
        {...props}
        data-kind-ui="heatmap-data-table"
        className={cn(
          "w-full border-collapse text-[0.8rem] [&_th]:border [&_th]:border-solid [&_th]:border-[var(--border,#d1d5db)] [&_th]:p-[0.5rem] [&_th]:text-left [&_td]:border [&_td]:border-solid [&_td]:border-[var(--border,#d1d5db)] [&_td]:p-[0.5rem] [&_td]:text-left",
          props.className,
        )}
      >
        <caption className="py-[0.75rem] text-left">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Row / column</th>
            {model.columns.map((column) => (
              <th scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row, r) => (
            <tr key={row}>
              <th scope="row">{row}</th>
              {model.cells[r]?.map((cell) => (
                <td key={cell.column}>
                  {cell.value === null ? missingLabel : formatValue(cell.value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
