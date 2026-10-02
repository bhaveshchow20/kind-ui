"use client";

import { animate as animateValue, motion, useMotionValue } from "motion/react";
import {
  type ComponentPropsWithRef,
  type ComponentType,
  type CSSProperties,
  createContext,
  type ReactNode,
  use,
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

export type HeatmapChartProps = ComponentPropsWithRef<"div"> &
  HeatmapModelOptions & {
    scale: HeatmapScale;
    formatValue?: (value: number) => string;
    missingLabel?: string;
    /** Animate frame entrance only; quantitative cell fills remain opaque. */
    animate?: boolean;
  };
type Context = {
  model: HeatmapModel;
  scale: HeatmapScale;
  formatValue: (value: number) => string;
  missingLabel: string;
  active: readonly [string, string] | null;
  setActive: (key: readonly [string, string] | null) => void;
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
  const [active, setActive] = useState<readonly [string, string] | null>(null);
  const tooltipId = useId();
  const [tooltipMounted, setTooltipMounted] = useState(false);
  const reduced = useSyncExternalStore(subscribeReduced, reducedSnapshot, reducedServerSnapshot);
  const y = useMotionValue(0);
  const enabled = animate && !reduced;
  useLayoutEffect(() => {
    if (!enabled) {
      y.set(0);
      return;
    }
    y.set(8);
    const controls = animateValue(y, 0, { duration: 0.35 });
    return () => controls.stop();
  }, [enabled, y]);
  useEffect(() => {
    if (!active || !tooltipMounted) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [active, tooltipMounted]);
  return (
    <HeatmapContext
      value={{
        model,
        scale,
        formatValue,
        missingLabel,
        active,
        setActive,
        tooltipId,
        tooltipMounted,
        setTooltipMounted,
      }}
    >
      <div
        {...props}
        data-kind-ui="heatmap"
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
        <motion.div data-kind-ui="heatmap-entrance" initial={false} style={{ y }}>
          {children}
        </motion.div>
      </div>
    </HeatmapContext>
  );
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
        setActive(null);
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
      element?.focus();
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
        style={{ "--heatmap-columns": model.columns.length, ...style } as CSSProperties}
        onKeyDown={move}
        onBlur={(event) => {
          onBlur?.(event);
          if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
        }}
        onPointerLeave={onPointerLeave}
      >
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Row / column</th>
            {model.columns.map((column) => (
              <th scope="col" key={column}>
                {columnLabel?.(column) ?? column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row, r) => (
            <tr key={row}>
              <th scope="row">
                <span data-kind-ui="heatmap-row-label" title={row}>
                  {rowLabel?.(row) ?? row}
                </span>
              </th>
              {model.cells[r]?.map((cell) => {
                const extra = cellProps?.(cell) ?? {};
                const fill =
                  cell.value === null ? "var(--heatmap-missing, #e5e7eb)" : scale.color(cell.value);
                const formattedValue =
                  cell.value === null ? context.missingLabel : context.formatValue(cell.value);
                return (
                  <td
                    {...extra}
                    key={cell.column}
                    // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: Owned focusable cell in the native-table ARIA grid.
                    role="gridcell"
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
                      setActive([cell.row, cell.column]);
                    }}
                    onPointerEnter={(event) => {
                      extra.onPointerEnter?.(event);
                      setActive([cell.row, cell.column]);
                    }}
                  >
                    <Cell cell={cell} fill={fill} formattedValue={formattedValue} />
                  </td>
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
};
/** In-flow tooltip stays within narrow containers and remains available for hover, focus and touch. */
export function HeatmapTooltip({ Content, ...props }: HeatmapTooltipProps) {
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
