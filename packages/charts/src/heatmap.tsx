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
import type { TooltipContentProps } from "./tooltip-content.js";
import { TooltipNumber } from "./tooltip-number.js";

export type HeatmapChartProps = ComponentPropsWithRef<"div"> &
  HeatmapModelOptions & {
    scale: HeatmapScale;
    formatValue?: (value: number) => string;
    missingLabel?: string;
    /** Diagonal cell entrance; quantitative colors and table geometry are unchanged. */
    animate?: boolean;
  };
type Context = {
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
  children,
  onPointerLeave,
  ...props
}: HeatmapChartProps) {
  const model = useMemo(
    () => createHeatmapModel({ rows, columns, data, ...(duplicates ? { duplicates } : {}) }),
    [rows, columns, data, duplicates],
  );
  const [active, updateActive] = useState<readonly [string, string] | null>(null);
  const pointer = useRef<PointerPosition | null>(null);
  const dismissed = useRef(false);
  const setActive = useCallback((key: readonly [string, string] | null) => {
    if (key) dismissed.current = false;
    updateActive(key);
  }, []);
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
  const interrupt = useCallback(() => setFinished(true), []);
  const enabled = animate && !reduced;
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
      inputs.some((value, index) => value !== previous.current[index]) ||
      (previousEnabled.current && !enabled)
    )
      interrupt();
    previous.current = inputs;
    previousEnabled.current = enabled;
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
        model,
        entrance,
        scale,
        formatValue,
        missingLabel,
        active,
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
          : "var(--heatmap-missing-foreground, #172033)",
      }}
    >
      {formattedValue}
    </span>
  );
}
export type HeatmapMaterial = "plain" | "paper" | "clay" | "glow";

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
    <div data-kind-ui="heatmap-scroll">
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
        data-kind-ui="heatmap-grid"
        data-cell-sizing={layout?.cellSize === undefined ? undefined : "fixed"}
        data-row-labels={layout?.rowLabels}
        data-column-labels={layout?.columnLabels}
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
        <caption>{caption}</caption>
        {layout?.cellSize === undefined ? null : (
          <colgroup>
            <col data-kind-ui="heatmap-row-column" />
            {model.columns.map((column) => (
              <col key={column} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr>
            <th scope="col">Row / column</th>
            {model.columns.map((column, c) => (
              <th scope="col" key={column} id={`${headerId}-column-${c}`}>
                {columnLabel?.(column) ?? column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row, r) => (
            <tr key={row}>
              <th scope="row" id={`${headerId}-row-${r}`}>
                <span data-kind-ui="heatmap-row-label" title={row}>
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
      {model.rows.length === 0 || model.columns.length === 0 ? (
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
      aria-label={`${label}: ${formatValue(min)} to ${formatValue(max)}; ${missingLabel}`}
    >
      <legend>{label}</legend>
      <div
        data-kind-ui="heatmap-ramp"
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
            style={{ left: `${(-min / (max - min)) * 100}%` }}
          />
        ) : null}
      </div>
      <div data-kind-ui="heatmap-ticks">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
      {min < 0 && max > 0 ? (
        <span data-kind-ui="heatmap-zero-label">Zero marker: {formatValue(0)}</span>
      ) : null}
      <span data-kind-ui="heatmap-missing-key">
        <i aria-hidden="true" />
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
    <div data-kind-ui="heatmap-scroll">
      <table {...props} data-kind-ui="heatmap-data-table">
        <caption>{caption}</caption>
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
