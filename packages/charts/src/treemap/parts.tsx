"use client";
import { motion } from "motion/react";
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnimatedTooltipFrame, useInteractionOpacity } from "../animation.js";
import { useChartInteraction } from "../chart-interaction.js";
import { useEmphasis } from "../emphasis.js";
import { FamilyLegend, OutsidePlot } from "../family-root.js";
import { TooltipItem, tooltipClassName } from "../tooltip-content.js";
import { TooltipNumber } from "../tooltip-number.js";
import { cn } from "../utils.js";
import { type TreemapContextValue, type TreemapItem, useTreemap } from "./chart.js";
import type { TreemapRectangle } from "./layout.js";
import type { TreemapDatum, TreemapNode } from "./model.js";

type ButtonProps = ComponentPropsWithRef<"button">;
const rectangleStyle = <T,>(node: TreemapRectangle<T>): CSSProperties => ({
  left: node.x,
  top: node.y,
  width: node.width,
  height: node.height,
});
export type TreemapTilesProps<T = TreemapDatum> = Omit<ComponentPropsWithRef<"div">, "children"> & {
  tileProps?: (node: TreemapRectangle<T>) => ButtonProps;
  children?: ReactNode | ((node: TreemapRectangle<T>) => ReactNode);
};
function Mark<T>({
  node,
  context,
  buttonProps = {},
  height,
  children,
  kind,
}: {
  node: TreemapRectangle<T>;
  context: TreemapContextValue<T>;
  buttonProps?: ButtonProps;
  height?: number;
  children?: ReactNode;
  kind: "treemap-tile" | "treemap-group-header";
}) {
  const consumerRef = buttonProps.ref;
  const ref = useCallback(
    (element: HTMLButtonElement | null) => {
      context.register(node.id, element);
      if (typeof consumerRef === "function") {
        const cleanup = consumerRef(element);
        if (typeof cleanup === "function")
          return () => {
            context.register(node.id, null);
            cleanup();
          };
      } else if (consumerRef) consumerRef.current = element;
    },
    [context.register, node.id, consumerRef],
  );
  const interaction = useChartInteraction();
  const rootKey = node.path[0] ?? node.id;
  const identityKey = interaction.kind === "node" ? node.id : rootKey;
  const sharedSelection = interaction.eligible.includes(identityKey);
  const selected = sharedSelection
    ? interaction.mode === "focus" && interaction.selected === identityKey
    : context.selectedId === node.id;
  const emphasis = useEmphasis(
    { kind: "series", key: rootKey, scope: "treemap", seriesKey: rootKey },
    !context.loading && !context.isHidden(node),
  );
  const hidden = context.isHidden(node);
  const inactive = context.isInactive(node);
  const opacity = useInteractionOpacity(inactive ? 0.28 : 1, node.id);
  const target = context.focusedId ?? context.defaultFocusId;
  const color = context.colors.colors.get(node.id);
  return (
    <motion.div
      initial={false}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity }}
    >
      <button
        {...buttonProps}
        ref={ref}
        type="button"
        data-kind-ui={kind}
        data-node-id={node.id}
        hidden={hidden || buttonProps.hidden}
        data-inactive={inactive || undefined}
        data-selected={selected || undefined}
        data-active={context.activeId === node.id || undefined}
        data-unknown={color?.unknown || undefined}
        tabIndex={context.loading ? -1 : target === node.id ? 0 : -1}
        aria-pressed={selected}
        aria-label={
          buttonProps["aria-label"] ??
          `${node.label}: ${context.formatValue(node.value, node)}${color ? `, ${color.formattedValue}` : ""}${node.kind === "group" ? ", open group" : ""}`
        }
        aria-describedby={
          context.tooltipMounted && context.activeId === node.id && !context.tooltipDismissed
            ? context.tooltipId
            : undefined
        }
        className={cn(
          "pointer-events-auto absolute m-0 overflow-hidden rounded-[4px] border-0 p-0 text-left text-[color:var(--foreground,inherit)] outline-offset-[-3px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[var(--ring,#4c78c4)]",
          kind === "treemap-group-header" && "text-[#172033]",
          buttonProps.className,
        )}
        style={{
          ...rectangleStyle(node),
          ...(height === undefined ? {} : { height }),
          background: color?.color ?? "var(--chart-1,#6b7280)",
          ...buttonProps.style,
        }}
        onFocus={(event) => {
          buttonProps.onFocus?.(event);
          if (!event.defaultPrevented) {
            context.setFocused(node.id);
            context.setActive(node.id);
            if (event.currentTarget.matches(":focus-visible")) emphasis.enter("keyboard");
          }
        }}
        onBlur={(event) => {
          buttonProps.onBlur?.(event);
          emphasis.leave("keyboard");
        }}
        onPointerEnter={(event) => {
          buttonProps.onPointerEnter?.(event);
          if (!event.defaultPrevented) {
            if (event.pointerType !== "touch") emphasis.enter("pointer");
            context.inspectPointer(event, node.id);
          }
        }}
        onPointerMove={(event) => {
          buttonProps.onPointerMove?.(event);
          if (!event.defaultPrevented) {
            if (event.pointerType !== "touch") emphasis.enter("pointer");
            context.inspectPointer(event, node.id);
          }
        }}
        onPointerLeave={(event) => {
          buttonProps.onPointerLeave?.(event);
          emphasis.leave("pointer");
          if (!event.defaultPrevented && document.activeElement !== event.currentTarget)
            context.setActive(null);
        }}
        onPointerCancel={(event) => {
          buttonProps.onPointerCancel?.(event);
          emphasis.leave("pointer");
        }}
        onClick={(event) => {
          buttonProps.onClick?.(event);
          if (!event.defaultPrevented) {
            context.setActive(node.id);
            context.activate(node, event);
          }
        }}
        onKeyDown={(event) => {
          buttonProps.onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)
          ) {
            event.preventDefault();
            context.moveFocus(node.id, event.key);
          }
        }}
      >
        {children === undefined ? buttonProps.children : children}
      </button>
    </motion.div>
  );
}
export function TreemapTiles<T = TreemapDatum>({
  tileProps,
  children,
  ...props
}: TreemapTilesProps<T>) {
  const context = useTreemap<T>();
  return (
    <div
      {...props}
      data-kind-ui="treemap-tiles"
      className={cn(
        "absolute inset-0 pointer-events-none [&>button]:pointer-events-auto",
        props.className,
      )}
    >
      {context.rectangles
        .filter((node) => context.frontierIds.has(node.id))
        .map((node) => (
          <Mark
            key={node.id}
            node={node}
            context={context}
            kind="treemap-tile"
            {...(tileProps ? { buttonProps: tileProps(node) } : {})}
          >
            {typeof children === "function" ? (children(node) ?? null) : children}
          </Mark>
        ))}
    </div>
  );
}
export type TreemapGroupsProps<T = TreemapDatum> = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  groupProps?: (node: TreemapRectangle<T>) => ComponentPropsWithRef<"div">;
  headerProps?: (node: TreemapRectangle<T>) => ButtonProps;
  children?: ReactNode | ((node: TreemapRectangle<T>) => ReactNode);
};
export function TreemapGroups<T = TreemapDatum>({
  groupProps,
  headerProps,
  children,
  ...props
}: TreemapGroupsProps<T>) {
  const context = useTreemap<T>();
  return (
    <div
      {...props}
      data-kind-ui="treemap-groups"
      className={cn(
        "absolute inset-0 pointer-events-none [&_button]:pointer-events-auto",
        props.className,
      )}
    >
      {context.rectangles
        .filter((node) => node.kind === "group" && !context.frontierIds.has(node.id))
        .map((node) => {
          const attributes = groupProps?.(node);
          const header = context.groupHeaderHeight > 0 ? headerProps?.(node) : undefined;
          return (
            <div
              {...attributes}
              key={node.id}
              hidden={context.isHidden(node) || attributes?.hidden}
              data-kind-ui="treemap-group"
              data-node-id={node.id}
              className={cn("absolute", attributes?.className)}
              style={{ ...rectangleStyle(node), ...attributes?.style }}
            >
              {context.groupHeaderHeight > 0 && (
                <Mark
                  node={{ ...node, x: 0, y: 0 }}
                  context={context}
                  kind="treemap-group-header"
                  height={Math.min(node.height, context.groupHeaderHeight)}
                  {...(header ? { buttonProps: header } : {})}
                >
                  <span className="block truncate px-2 text-[11px] font-medium text-inherit">
                    {typeof children === "function"
                      ? children(node)
                      : children !== undefined
                        ? children
                        : header?.children !== undefined
                          ? header.children
                          : node.label}
                  </span>
                </Mark>
              )}
              {children === undefined ? attributes?.children : null}
            </div>
          );
        })}
    </div>
  );
}
export type TreemapLabelsProps<T = TreemapDatum> = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  minWidth?: number;
  minHeight?: number;
  padding?: number;
  children?: ReactNode | ((node: TreemapRectangle<T>) => ReactNode);
  labelProps?: (node: TreemapRectangle<T>) => ComponentPropsWithRef<"span">;
};
export function TreemapLabels<T = TreemapDatum>({
  minWidth = 18,
  minHeight = 14,
  padding = 4,
  children,
  labelProps,
  ...props
}: TreemapLabelsProps<T>) {
  const context = useTreemap<T>();
  for (const [name, value] of [
    ["minWidth", minWidth],
    ["minHeight", minHeight],
    ["padding", padding],
  ] as const)
    if (!Number.isFinite(value) || value < 0)
      throw new Error(`TreemapLabels ${name} must be finite and nonnegative`);
  return (
    <div
      {...props}
      data-kind-ui="treemap-labels"
      aria-hidden="true"
      className={cn("absolute inset-0 pointer-events-none", props.className)}
    >
      {context.rectangles
        .filter(
          (node) =>
            !context.isHidden(node) &&
            context.frontierIds.has(node.id) &&
            node.width >= minWidth + padding * 2 &&
            node.height >= minHeight + padding * 2,
        )
        .map((node) => {
          const attributes = labelProps?.(node);
          const availableWidth = node.width - padding * 2;
          const availableHeight = node.height - padding * 2;
          const value = context.formatValue(node.value, node);
          const fontSize = availableWidth < 70 ? 10 : 12;
          const showValue =
            availableHeight >= fontSize * 2.6 && availableWidth >= value.length * fontSize * 0.62;
          return (
            <LabelPaint key={node.id} inactive={context.isInactive(node)}>
              <span
                {...attributes}
                key={node.id}
                data-kind-ui="treemap-label"
                data-node-id={node.id}
                data-unknown={context.colors.colors.get(node.id)?.unknown || undefined}
                className={cn(
                  "absolute block truncate text-[#172033] data-[unknown=true]:text-[var(--foreground,#172033)] text-xs font-medium leading-tight",
                  attributes?.className,
                )}
                style={{
                  left: node.x + padding,
                  top: node.y + padding,
                  width: Math.max(0, node.width - padding * 2),
                  maxHeight: Math.max(0, node.height - padding * 2),
                  overflow: "hidden",
                  fontSize,
                  ...attributes?.style,
                }}
              >
                {typeof children === "function" ? (
                  children(node)
                ) : children !== undefined ? (
                  children
                ) : attributes?.children !== undefined ? (
                  attributes.children
                ) : (
                  <>
                    <span className="block truncate" title={node.label}>
                      {node.label}
                    </span>
                    {showValue && (
                      <span className="mt-0.5 block whitespace-nowrap font-normal tabular-nums">
                        {value}
                      </span>
                    )}
                  </>
                )}
              </span>
            </LabelPaint>
          );
        })}
    </div>
  );
}
function LabelPaint({ inactive, children }: { inactive: boolean; children: ReactNode }) {
  const opacity = useInteractionOpacity(inactive ? 0.28 : 1);
  return (
    <motion.div
      initial={false}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity }}
    >
      {children}
    </motion.div>
  );
}
export type TreemapTooltipProps<T = TreemapDatum> = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & {
  children?: ReactNode | ((node: TreemapItem<T>) => ReactNode);
  valueAnimation?: "shuffle";
};
/** The same measured cursor frame and row presentation used by Kind's native charts. */
export function TreemapTooltip<T = TreemapDatum>({
  children,
  valueAnimation,
  ...props
}: TreemapTooltipProps<T>) {
  const context = useTreemap<T>();
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const consumerRef = props.ref;
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      setElement(node);
      if (typeof consumerRef === "function") return consumerRef(node);
      if (consumerRef) consumerRef.current = node;
    },
    [consumerRef],
  );
  useEffect(() => {
    context.setTooltipMounted(true);
    return () => context.setTooltipMounted(false);
  }, [context.setTooltipMounted]);
  useLayoutEffect(() => {
    if (!element) return;
    const measure = () =>
      setSize((previous) => {
        const next = { width: element.offsetWidth, height: element.offsetHeight };
        return previous.width === next.width && previous.height === next.height ? previous : next;
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  const node = context.items.get(context.activeId ?? "");
  if (!node || context.loading || context.tooltipDismissed || context.isHidden(node)) return null;
  const color = context.colors.colors.get(node.id);
  const anchor = context.pointer ?? {
    x: (node.rectangle?.x ?? 0) + (node.rectangle?.width ?? 0) / 2,
    y: (node.rectangle?.y ?? 0) + 20,
  };
  const maxX = Math.max(0, context.size.width - size.width);
  const maxY = Math.max(0, context.size.height - size.height);
  const formatted = context.formatValue(node.value, node);
  const path = node.path.map((id) => context.model.byId.get(id)?.label ?? id);
  const ancestors = path.slice(0, -1);
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <AnimatedTooltipFrame
        motionEnabled={context.animate}
        x={Math.max(0, Math.min(anchor.x + 12, maxX))}
        y={Math.max(0, Math.min(anchor.y + 12, maxY))}
        maxX={maxX}
        maxY={maxY}
        frameProps={undefined}
        style={{
          width: "max-content",
          maxWidth: context.size.width,
          maxHeight: context.size.height,
          overflow: "auto",
        }}
      >
        <div
          {...props}
          ref={ref}
          id={context.tooltipId}
          role="tooltip"
          aria-label={props["aria-label"] ?? path.join(" / ")}
          data-kind-ui="treemap-tooltip"
          className={cn(tooltipClassName, props.className)}
        >
          {typeof children === "function"
            ? children(node)
            : (children ?? (
                <>
                  {ancestors.length > 0 && (
                    <strong className="font-medium">{ancestors.join(" / ")}</strong>
                  )}
                  <ul className="list-none p-0 mx-0 mb-0 mt-[2px]">
                    <TooltipItem
                      inactive={context.isInactive(node)}
                      data-kind-ui="chart-tooltip-item"
                    >
                      <span
                        aria-hidden="true"
                        className="inline-block shrink-0 w-[3px] h-3 rounded-[1px]"
                        style={{ background: color?.color }}
                      />
                      <span>{node.label}</span>
                      <strong data-kind-ui="chart-tooltip-value">
                        {valueAnimation === "shuffle" ? (
                          <TooltipNumber value={formatted} />
                        ) : (
                          formatted
                        )}
                      </strong>
                    </TooltipItem>
                    {color && context.colors.legend.type !== "categorical" && (
                      <TooltipItem inactive={context.isInactive(node)}>
                        <span>{context.colors.legend.label}</span>
                        <strong data-kind-ui="chart-tooltip-value">{color.formattedValue}</strong>
                      </TooltipItem>
                    )}
                    <TooltipItem inactive={context.isInactive(node)}>
                      <span>Share of total</span>
                      <strong data-kind-ui="chart-tooltip-value">
                        {((node.rootShare ?? 0) * 100).toFixed(1)}%
                      </strong>
                    </TooltipItem>
                  </ul>
                </>
              ))}
        </div>
      </AnimatedTooltipFrame>
    </div>
  );
}
export type TreemapBreadcrumbsProps = ComponentPropsWithRef<"nav"> & { rootLabel?: string };
export function TreemapBreadcrumbs({ rootLabel = "All", ...props }: TreemapBreadcrumbsProps) {
  const context = useTreemap();
  const view = context.model.byId.get(context.viewId ?? "");
  return (
    <OutsidePlot>
      <nav
        {...props}
        data-kind-ui="treemap-breadcrumbs"
        aria-label={props["aria-label"] ?? "Treemap navigation"}
        className={cn("flex flex-wrap items-center gap-1 text-xs", props.className)}
      >
        <button
          type="button"
          onClick={() => context.setView(null)}
          aria-current={context.viewId === null ? "location" : undefined}
        >
          {rootLabel}
        </button>
        {view?.path.map((id) => {
          const node = context.model.byId.get(id);
          return node?.kind === "group" ? (
            <span key={id} className="contents">
              <span aria-hidden="true">/</span>
              <button
                type="button"
                aria-current={context.viewId === id ? "location" : undefined}
                onClick={() => context.setView(id)}
              >
                {node.label}
              </button>
            </span>
          ) : null;
        })}
      </nav>
    </OutsidePlot>
  );
}
export type TreemapDataTableProps<T = TreemapDatum> = Omit<
  ComponentPropsWithRef<"table">,
  "children"
> & {
  caption: string;
  scope?: "root" | "view";
  children?: (node: TreemapItem<T>) => ReactNode;
  /** Row attributes and handlers; the table's children renderer owns its cells. */
  rowProps?: (
    node: TreemapNode<T>,
  ) => Omit<ComponentPropsWithRef<"tr">, "children"> & { children?: never };
};
export function TreemapDataTable<T = TreemapDatum>({
  caption,
  scope = "view",
  children,
  rowProps,
  ...props
}: TreemapDataTableProps<T>) {
  const context = useTreemap<T>();
  const interaction = useChartInteraction();
  const nodes = scope === "root" ? context.model.nodes : context.viewNodes;
  const table = useRef<HTMLTableElement | null>(null);
  const pendingFocus = useRef<{ viewId: string; owner: HTMLButtonElement } | null>(null);
  const consumerRef = props.ref;
  const ref = useCallback(
    (element: HTMLTableElement | null) => {
      table.current = element;
      if (typeof consumerRef === "function") {
        const cleanup = consumerRef(element);
        if (typeof cleanup === "function")
          return () => {
            table.current = null;
            cleanup();
          };
      } else if (consumerRef) consumerRef.current = element;
    },
    [consumerRef],
  );
  useLayoutEffect(() => {
    const intent = pendingFocus.current;
    if (!intent) return;
    if (context.viewId !== intent.viewId) {
      if (!intent.owner.isConnected || document.activeElement !== intent.owner)
        pendingFocus.current = null;
      return;
    }
    pendingFocus.current = null;
    if (
      intent.owner.isConnected ||
      (document.activeElement !== document.body && document.activeElement !== intent.owner)
    )
      return;
    const eligible = (element: HTMLElement) => !element.closest("[hidden], [inert]");
    const next = nodes.length
      ? Array.from(
          table.current?.querySelectorAll<HTMLButtonElement>("tbody button:not(:disabled)") ?? [],
        ).find(eligible)
      : undefined;
    if (next) next.focus();
    else if (table.current && eligible(table.current)) table.current.focus();
  }, [context.viewId, nodes]);
  return (
    <OutsidePlot>
      <div className="max-w-full overflow-x-auto">
        <table
          {...props}
          ref={ref}
          tabIndex={props.tabIndex ?? -1}
          data-kind-ui="treemap-data-table"
          className={cn("w-full text-left text-xs [&_td]:p-1 [&_th]:p-1", props.className)}
        >
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Path</th>
              <th scope="col">Value</th>
              <th scope="col">Root share</th>
              <th scope="col">Parent share</th>
              <th scope="col">View share</th>
              <th scope="col">Color metric</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => {
              const attributes = rowProps?.(node);
              const identityKey = interaction.kind === "node" ? node.id : (node.path[0] ?? node.id);
              const selected = interaction.eligible.includes(identityKey)
                ? interaction.mode === "focus" && interaction.selected === identityKey
                : context.selectedId === node.id;
              const share = (value: number | null) =>
                value === null ? "—" : `${(value * 100).toFixed(2)}%`;
              return (
                <tr
                  {...attributes}
                  key={node.id}
                  data-node-id={node.id}
                  data-selected={selected || undefined}
                  data-active={context.activeId === node.id || undefined}
                >
                  {children ? (
                    children(
                      context.items.get(node.id) ?? { ...node, rectangle: null, viewShare: null },
                    )
                  ) : (
                    <>
                      <th scope="row">
                        <button
                          type="button"
                          aria-pressed={selected}
                          onFocus={(event) => {
                            if (!event.defaultPrevented) context.setActive(node.id);
                          }}
                          onBlur={(event) => {
                            if (pendingFocus.current?.owner === event.currentTarget)
                              pendingFocus.current = null;
                          }}
                          onClick={(event) => {
                            if (!event.defaultPrevented) {
                              if (
                                node.kind === "group" &&
                                document.activeElement === event.currentTarget
                              )
                                pendingFocus.current = {
                                  viewId: node.id,
                                  owner: event.currentTarget,
                                };
                              context.activate(node, event);
                            }
                          }}
                        >
                          {node.label}
                        </button>
                      </th>
                      <td>
                        {node.path.map((id) => context.model.byId.get(id)?.label ?? id).join(" / ")}
                      </td>
                      <td>{context.formatValue(node.value, node)}</td>
                      <td>{share(node.rootShare)}</td>
                      <td>{share(node.parentShare)}</td>
                      <td>{share(context.items.get(node.id)?.viewShare ?? null)}</td>
                      <td>{context.colors.colors.get(node.id)?.formattedValue ?? "Unknown"}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </OutsidePlot>
  );
}
export type TreemapColorLegendProps = ComponentPropsWithRef<"div">;
export function TreemapColorLegend(props: TreemapColorLegendProps) {
  const { colors } = useTreemap();
  const { legend } = colors;
  const id = useId();
  return (
    <OutsidePlot>
      <div
        {...props}
        data-kind-ui="treemap-color-legend"
        className={cn("flex flex-wrap items-center gap-2 text-xs", props.className)}
      >
        <span id={id}>{legend.label}</span>
        {legend.type === "sequential" || legend.type === "diverging" ? (
          <fieldset aria-labelledby={id} className="m-0 min-w-40 border-0 p-0">
            <div
              className="h-2 w-full rounded"
              style={{
                background: `linear-gradient(to right, ${legend.stops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ")})`,
              }}
            />
            <div className="relative h-4">
              {legend.ticks.map((tick) => (
                <span
                  key={tick.offset}
                  data-kind-ui="treemap-legend-tick"
                  data-value={tick.value}
                  className="absolute whitespace-nowrap"
                  style={{
                    left: `${tick.offset * 100}%`,
                    transform: `translateX(${tick.offset === 0 ? 0 : tick.offset === 1 ? -100 : -50}%)`,
                  }}
                >
                  {tick.label}
                </span>
              ))}
            </div>
          </fieldset>
        ) : (
          ("items" in legend ? legend.items : []).map((item, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: Stateless legend entries may repeat both label and paint; position makes each presentation entry unique.
              key={`${index}-${item.label}-${item.color}`}
              data-kind-ui="treemap-legend-item"
              className="inline-flex items-center gap-1"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded"
                style={{ background: item.color }}
              />
              {item.label}
            </span>
          ))
        )}
        <span className="inline-flex items-center gap-1">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded"
            style={{ background: legend.unknown.color }}
          />
          {legend.unknown.label}
        </span>
      </div>
    </OutsidePlot>
  );
}
export const TreemapContent = OutsidePlot;

export const TreemapLegend = FamilyLegend;
