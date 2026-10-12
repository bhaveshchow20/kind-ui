"use client";
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
} from "react";
import { OutsidePlot } from "../family-root.js";
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
  const target = context.focusedId ?? context.defaultFocusId;
  const color = context.colors.colors.get(node.id);
  return (
    <button
      {...buttonProps}
      ref={ref}
      type="button"
      data-kind-ui={kind}
      data-node-id={node.id}
      data-selected={context.selectedId === node.id || undefined}
      data-active={context.activeId === node.id || undefined}
      data-unknown={color?.unknown || undefined}
      tabIndex={context.loading ? -1 : target === node.id ? 0 : -1}
      aria-pressed={context.selectedId === node.id}
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
        "absolute m-0 overflow-hidden rounded-[2px] border border-[var(--background,#fff)] p-0 text-left text-[color:var(--foreground,inherit)] outline-offset-[-3px] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[var(--foreground,#172033)] data-selected:ring-2 data-selected:ring-[var(--foreground,#172033)] data-selected:ring-inset",
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
        }
      }}
      onPointerEnter={(event) => {
        buttonProps.onPointerEnter?.(event);
        if (!event.defaultPrevented) context.inspectPointer(event, node.id);
      }}
      onPointerMove={(event) => {
        buttonProps.onPointerMove?.(event);
        if (!event.defaultPrevented) context.inspectPointer(event, node.id);
      }}
      onPointerLeave={(event) => {
        buttonProps.onPointerLeave?.(event);
        if (!event.defaultPrevented && document.activeElement !== event.currentTarget)
          context.setActive(null);
      }}
      onClick={(event) => {
        buttonProps.onClick?.(event);
        if (!event.defaultPrevented) {
          context.setActive(node.id);
          context.activate(node);
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
            {typeof children === "function" ? children(node) : children}
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
              data-kind-ui="treemap-group"
              data-node-id={node.id}
              className={cn(
                "absolute rounded border border-[var(--border,#d1d5db)]",
                attributes?.className,
              )}
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
                  <span className="block truncate px-1 text-xs font-medium bg-[var(--background,#fff)] text-[var(--foreground,#172033)]">
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
  minWidth = 40,
  minHeight = 22,
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
            context.frontierIds.has(node.id) &&
            node.width >= minWidth + padding * 2 &&
            node.height >= minHeight + padding * 2,
        )
        .map((node) => {
          const attributes = labelProps?.(node);
          return (
            <span
              {...attributes}
              key={node.id}
              data-kind-ui="treemap-label"
              data-node-id={node.id}
              className={cn(
                "absolute block truncate rounded bg-[var(--background,#fff)] text-[var(--foreground,#172033)] text-xs leading-tight",
                attributes?.className,
              )}
              style={{
                left: node.x + padding,
                top: node.y + padding,
                width: Math.max(0, node.width - padding * 2),
                maxHeight: Math.max(0, node.height - padding * 2),
                overflow: "hidden",
                ...attributes?.style,
              }}
            >
              {typeof children === "function" ? children(node) : (children ?? node.label)}
            </span>
          );
        })}
    </div>
  );
}
export type TreemapTooltipProps<T = TreemapDatum> = Omit<
  ComponentPropsWithRef<"div">,
  "children"
> & { children?: ReactNode | ((node: TreemapItem<T>) => ReactNode) };
export function TreemapTooltip<T = TreemapDatum>({ children, ...props }: TreemapTooltipProps<T>) {
  const context = useTreemap<T>();
  useEffect(() => {
    context.setTooltipMounted(true);
    return () => context.setTooltipMounted(false);
  }, [context.setTooltipMounted]);
  const node = context.items.get(context.activeId ?? "");
  if (!node || context.loading || context.tooltipDismissed) return null;
  const color = context.colors.colors.get(node.id);
  return (
    <div
      {...props}
      id={context.tooltipId}
      role="tooltip"
      data-kind-ui="treemap-tooltip"
      className={cn(
        "pointer-events-none absolute right-2 bottom-2 z-20 rounded border border-[var(--border,#d1d5db)] bg-[var(--popover,#fff)] p-2 text-xs text-[var(--popover-foreground,#172033)] shadow-md",
        props.className,
      )}
    >
      {typeof children === "function"
        ? children(node)
        : (children ?? (
            <>
              <strong>{node.label}</strong>
              <div>{context.formatValue(node.value, node)}</div>
              {color && <div>{color.formattedValue}</div>}
            </>
          ))}
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
  rowProps?: (node: TreemapNode<T>) => ComponentPropsWithRef<"tr">;
};
export function TreemapDataTable<T = TreemapDatum>({
  caption,
  scope = "view",
  children,
  rowProps,
  ...props
}: TreemapDataTableProps<T>) {
  const context = useTreemap<T>();
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
    const next = nodes.length
      ? table.current?.querySelector<HTMLButtonElement>("tbody button:not(:disabled)")
      : undefined;
    if (next) next.focus();
    else table.current?.focus();
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
              const share = (value: number | null) =>
                value === null ? "—" : `${(value * 100).toFixed(2)}%`;
              return (
                <tr
                  {...attributes}
                  key={node.id}
                  data-node-id={node.id}
                  data-selected={context.selectedId === node.id || undefined}
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
                          aria-pressed={context.selectedId === node.id}
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
                              context.activate(node);
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
