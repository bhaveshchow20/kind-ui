"use client";
import { animateMini } from "motion/react";
import {
  type ComponentPropsWithRef,
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
} from "react";
import { MotionContext, RegisterInteractionMotion } from "../animation.js";
import { useChart } from "../chart-context.js";
import {
  type ChartInteractionEvent,
  useChartInteraction,
  useInteractionRegistration,
} from "../chart-interaction.js";
import { useEmphasis } from "../emphasis.js";
import {
  type ChartName,
  type FamilyOptions,
  FamilyRoot,
  familyFrame,
  familyVisibility,
} from "../family-root.js";
import { LoadingSkeletonSurface, LoadingStatus, useLoadingSeed } from "../loading-skeleton.js";
import { defaultHover, useReducedMotion } from "../motion-preference.js";
import { colorStopToken } from "../series-color.js";
import { cn } from "../utils.js";
import { resolveTreemapColors, type TreemapColorEncoding } from "./encoding.js";
import {
  layoutTreemap,
  type TreemapLayoutCache,
  type TreemapLayoutOptions,
  type TreemapRectangle,
  treemapNeighbor,
} from "./layout.js";
import { TreemapLoadingDesign } from "./loading.js";
import {
  normalizeTreemap,
  type TreemapAccessors,
  type TreemapHierarchyNode,
  type TreemapModel,
  type TreemapNode,
} from "./model.js";

export type TreemapItem<T> = TreemapHierarchyNode<T> & {
  rectangle: { x: number; y: number; width: number; height: number } | null;
  viewShare: number | null;
};
// Root arrays can contain only groups; their descendant records still reach every callback.
// Stop at a previously covered record type for consumers with recursive record interfaces.
type TreemapDescendants<T, Seen = T> =
  | T
  | (T extends { readonly children: readonly (infer Child)[] }
      ? [Child] extends [Seen]
        ? never
        : TreemapDescendants<Child, Seen | Child>
      : never);
type TreemapRecords<T> = [T] extends [TreemapNode] ? TreemapDescendants<T> : T;
type TreemapFamilyOptions = FamilyOptions;
type StateOptions<T> = {
  viewId?: string | null;
  defaultViewId?: string | null;
  onViewChange?: (id: string | null, node: TreemapItem<T> | null) => void;
  activeId?: string | null;
  defaultActiveId?: string | null;
  onActiveChange?: (id: string | null, node: TreemapItem<T> | null) => void;
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelectionChange?: (id: string | null, node: TreemapItem<T> | null) => void;
  onActivate?: (node: TreemapItem<T>) => void;
};
export type TreemapChartProps<T = TreemapNode> = Omit<
  ComponentPropsWithRef<"div">,
  "children" | keyof FamilyOptions
> &
  TreemapFamilyOptions &
  ChartName &
  StateOptions<TreemapRecords<T>> &
  Omit<TreemapLayoutOptions, "width" | "height"> & {
    data: readonly T[];
    encoding?: TreemapColorEncoding<TreemapRecords<T>>;
    width?: number | string;
    height?: number | string;
    animate?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    empty?: ReactNode;
    formatValue?: (value: number, node: TreemapHierarchyNode<TreemapRecords<T>>) => string;
    children: Exclude<ReactNode, undefined>;
  } & ([T] extends [TreemapNode]
    ? { accessors?: TreemapAccessors<T> }
    : { accessors: TreemapAccessors<T> });
export type TreemapContextValue<T> = {
  model: TreemapModel<T>;
  pointer: { x: number; y: number } | null;
  size: { width: number; height: number };
  isHidden: (node: TreemapHierarchyNode<T>) => boolean;
  isInactive: (node: TreemapHierarchyNode<T>) => boolean;
  rectangles: readonly TreemapRectangle<T>[];
  viewNodes: readonly TreemapHierarchyNode<T>[];
  items: ReadonlyMap<string, TreemapItem<T>>;
  frontierIds: ReadonlySet<string>;
  navigation: readonly TreemapRectangle<T>[];
  colors: ReturnType<typeof resolveTreemapColors<T>>;
  viewId: string | null;
  activeId: string | null;
  selectedId: string | null;
  setView: (id: string | null) => void;
  setActive: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  activate: (node: TreemapHierarchyNode<T>, event?: ChartInteractionEvent) => void;
  tooltipMounted: boolean;
  setTooltipMounted: (mounted: boolean) => void;
  inspectPointer: (event: React.PointerEvent, id: string) => void;
  moveFocus: (id: string | null, key: string) => void;
  defaultFocusId: string | null;
  focusedId: string | null;
  setFocused: (id: string | null) => void;
  dismiss: () => void;
  tooltipDismissed: boolean;
  tooltipId: string;
  loading: boolean;
  animate: boolean;
  groupHeaderHeight: number;
  formatValue: (value: number, node: TreemapHierarchyNode<T>) => string;
  register: (id: string, node: HTMLButtonElement | null) => void;
  focus: (id: string | null) => void;
};
const Context = createContext<TreemapContextValue<unknown> | null>(null);
/** The type argument describes the caller-owned record; the chart retains that record unchanged. */
export function useTreemap<T = TreemapNode>(): TreemapContextValue<T> {
  const context = use(Context);
  if (!context) throw new Error("Treemap components require TreemapChart");
  return context as unknown as TreemapContextValue<T>;
}
const defaultFormat = (value: number) => String(value);
const isAvailableControl = (element: HTMLElement | null | undefined): element is HTMLElement =>
  !!element &&
  element.isConnected &&
  !element.matches(":disabled") &&
  element.closest("[hidden], [inert]") === null;
export function TreemapChartRoot<const T = TreemapNode>({
  config,
  interaction,
  emphasis,
  nonce,
  frameProps,
  legendPosition,
  visibleSeries,
  defaultVisibleSeries,
  onVisibleSeriesChange,
  ...props
}: TreemapChartProps<T>) {
  if (Object.hasOwn(props, "rootProps")) throw new Error("TreemapChart does not accept rootProps");
  if (props.children === undefined) throw new Error("TreemapChart requires explicit children");
  return (
    <FamilyRoot
      family="TreemapChart"
      config={config}
      {...familyVisibility({ visibleSeries, defaultVisibleSeries, onVisibleSeriesChange })}
      name={props}
      loading={props.loading}
      {...(interaction !== undefined ? { interaction } : {})}
      {...(emphasis !== undefined ? { emphasis } : {})}
      {...(nonce !== undefined ? { nonce } : {})}
      {...(frameProps !== undefined ? { frameProps } : {})}
      {...(legendPosition ? { legendPosition } : {})}
    >
      <TreemapPlot<T> {...props} />
    </FamilyRoot>
  );
}
function TreemapPlot<T>({
  data,
  accessors,
  encoding,
  width,
  height,
  depth,
  padding,
  groupHeaderHeight = 0,
  layout,
  viewId: controlledView,
  defaultViewId = null,
  onViewChange,
  activeId: controlledActive,
  defaultActiveId = null,
  onActiveChange,
  selectedId: controlledSelected,
  defaultSelectedId = null,
  onSelectionChange,
  onActivate,
  animate = false,
  loading = false,
  loadingLabel,
  empty = "No positive values",
  formatValue = defaultFormat,
  children,
  ...props
}: Omit<TreemapChartProps<T>, keyof TreemapFamilyOptions>) {
  const [controlledModes] = useState(() => ({
    viewId: controlledView !== undefined,
    activeId: controlledActive !== undefined,
    selectedId: controlledSelected !== undefined,
  }));
  for (const [name, controlled, initial] of [
    ["viewId", controlledView, defaultViewId],
    ["activeId", controlledActive, defaultActiveId],
    ["selectedId", controlledSelected, defaultSelectedId],
  ] as const) {
    if ((controlled !== undefined) !== controlledModes[name])
      throw new Error(`Treemap ${name} cannot switch controlled mode during a mount`);
    if (controlled !== undefined && initial !== null)
      throw new Error(`Treemap ${name} cannot be both controlled and defaulted`);
  }
  const model = useMemo<TreemapModel<TreemapRecords<T>>>(
    () =>
      accessors
        ? (normalizeTreemap(data, accessors) as TreemapModel<TreemapRecords<T>>)
        : (normalizeTreemap(data as unknown as readonly TreemapNode[]) as unknown as TreemapModel<
            TreemapRecords<T>
          >),
    [data, accessors],
  );
  const previousModel = useRef<TreemapModel<TreemapRecords<T>> | undefined>(undefined);
  const [localView, updateView] = useState(defaultViewId);
  const [localActive, updateActive] = useState(defaultActiveId);
  const [localSelected, updateSelected] = useState(defaultSelectedId);
  const [focusedId, setFocused] = useState<string | null>(null);
  const [tooltipDismissed, setDismissed] = useState(false);
  const rawView = controlledView === undefined ? localView : controlledView;
  const retainedPaths = useRef(new Map<string, { id: string | null; path: readonly string[] }>());
  const resolveId = (slot: string, id: string | null) => {
    if (id === null) return null;
    if (model.byId.has(id)) return id;
    const retained = retainedPaths.current.get(slot);
    const path = retained?.id === id ? retained.path : [];
    for (let index = path.length - 2; index >= 0; index--) {
      const ancestor = path[index];
      if (ancestor !== undefined && model.byId.has(ancestor)) return ancestor;
    }
    return null;
  };
  const inheritedView = resolveId("view", rawView);
  const viewId =
    inheritedView !== null && model.byId.get(inheritedView)?.kind !== "group"
      ? (model.byId.get(inheritedView)?.parentId ?? null)
      : inheritedView;
  const activeId = loading
    ? null
    : resolveId("active", controlledActive === undefined ? localActive : controlledActive);
  const selectedId = resolveId(
    "selected",
    controlledSelected === undefined ? localSelected : controlledSelected,
  );
  const loadingSeed = useLoadingSeed(loading);
  const chart = useChart();
  const interaction = useChartInteraction();
  useInteractionRegistration(
    (interaction.kind === "node" ? model.nodes : model.roots).map((node) => node.id),
  );
  // Read the same transient inspection state as the legend and participating marks.
  // This observer does not register a competing target.
  const inspection = useEmphasis({ kind: "series", key: "", scope: "treemap" }, false, false);
  const inspectedRoot =
    inspection.active?.kind === "series"
      ? (inspection.active.seriesKey ?? inspection.active.key)
      : null;
  const isHidden = (node: TreemapHierarchyNode<TreemapRecords<T>>) =>
    chart.visibleSeries !== undefined && !chart.visibleSeries.includes(node.path[0] ?? node.id);
  const isInactive = (node: TreemapHierarchyNode<TreemapRecords<T>>) =>
    isHidden(node) ||
    (interaction.selected !== null && !node.path.includes(interaction.selected)) ||
    (interaction.selected === null && inspectedRoot !== null && !node.path.includes(inspectedRoot));
  const [tooltipPointer, setTooltipPointer] = useState<{ x: number; y: number } | null>(null);
  const [tooltipMounted, setTooltipMounted] = useState(false);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const root = useRef<HTMLDivElement | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const focusedInside = useRef(false);
  const lastFocusedControl = useRef<{
    path: readonly string[] | null;
    element: HTMLElement;
  } | null>(null);
  const loadingFocus = useRef<typeof lastFocusedControl.current>(null);
  useLayoutEffect(() => {
    const focusin = (event: FocusEvent) => {
      // Inert content can displace focus to the document without another focusin.
      // A real focus destination outside the plot is an explicit new intent.
      if (event.target === document.body || event.target === document.documentElement) return;
      if (!(event.target instanceof Node) || !root.current?.contains(event.target)) {
        lastFocusedControl.current = null;
        loadingFocus.current = null;
      }
    };
    document.addEventListener("focusin", focusin, true);
    return () => document.removeEventListener("focusin", focusin, true);
  }, []);
  const [size, setSize] = useState({
    width: typeof width === "number" ? width : 0,
    height: typeof height === "number" ? height : 280,
  });
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSize((previous) =>
        previous.width === rect.width && previous.height === rect.height
          ? previous
          : { width: rect.width, height: rect.height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const cache = useRef<TreemapLayoutCache | undefined>(undefined);
  const geometry = useMemo(
    () =>
      layoutTreemap(
        model,
        viewId,
        {
          ...size,
          groupHeaderHeight,
          ...(depth !== undefined ? { depth } : {}),
          ...(padding !== undefined ? { padding } : {}),
          ...(layout !== undefined ? { layout } : {}),
        },
        cache.current,
      ),
    [model, viewId, size, depth, padding, groupHeaderHeight, layout],
  );
  useLayoutEffect(() => {
    cache.current = geometry.cache;
  }, [geometry]);
  const viewNodes = useMemo(
    () =>
      viewId === null
        ? model.nodes
        : model.nodes.filter((node) => node.id !== viewId && node.path.includes(viewId)),
    [model, viewId],
  );
  const fallbackEncoding = useMemo<TreemapColorEncoding<TreemapRecords<T>>>(
    () => ({
      type: "categorical",
      value: (_datum, node) => node.path[0] ?? null,
      groupValue: (_datum, node) => node.path[0] ?? null,
      categories: model.roots.map((node, index) => ({
        value: node.id,
        label: node.label,
        color: Object.hasOwn(chart.config, node.id)
          ? `var(${colorStopToken(node.id, "gradient")})`
          : `var(--chart-${(index % 5) + 1}, #6b7280)`,
      })),
    }),
    [model, chart.config],
  );
  const colors = useMemo(
    () => resolveTreemapColors(model.nodes, viewNodes, encoding ?? fallbackEncoding),
    [model, viewNodes, encoding, fallbackEncoding],
  );
  const frontierIds = useMemo(() => {
    const parents = new Set(geometry.rectangles.map((node) => node.parentId));
    return new Set(
      geometry.rectangles
        .filter((node) => node.kind === "leaf" || !parents.has(node.id))
        .map((node) => node.id),
    );
  }, [geometry]);
  const items = useMemo(() => {
    const subtreeIds = new Set(viewNodes.map((node) => node.id));
    if (viewId !== null) subtreeIds.add(viewId);
    const rectangles = new Map(geometry.rectangles.map((node) => [node.id, node]));
    return new Map(
      model.nodes.map((node) => {
        const rectangle = rectangles.get(node.id);
        return [
          node.id,
          {
            ...node,
            rectangle: rectangle
              ? { x: rectangle.x, y: rectangle.y, width: rectangle.width, height: rectangle.height }
              : null,
            viewShare:
              geometry.total > 0 && subtreeIds.has(node.id) ? node.value / geometry.total : null,
          },
        ] as const;
      }),
    );
  }, [model, geometry, viewNodes, viewId]);
  const readItem = useCallback(
    (id: string | null) => (id === null ? null : (items.get(id) ?? null)),
    [items],
  );
  const setView = useCallback(
    (id: string | null) => {
      if (loading) return;
      if (id !== null && model.byId.get(id)?.kind !== "group")
        throw new Error("Treemap viewId must identify a group");
      if (controlledView === undefined) updateView(id);
      setDismissed(false);
      onViewChange?.(id, readItem(id));
    },
    [loading, controlledView, model, onViewChange, readItem],
  );
  const loadingClearRequested = useRef(false);
  const setActive = useCallback(
    (id: string | null) => {
      if (loading) {
        if (id !== null || controlledActive !== undefined || localActive === null) return;
        if (loadingClearRequested.current) return;
        loadingClearRequested.current = true;
      } else {
        setDismissed(false);
        if (id === activeId) return;
      }
      if (controlledActive === undefined) updateActive(id);
      onActiveChange?.(id, readItem(id));
    },
    [loading, controlledActive, localActive, onActiveChange, readItem, activeId],
  );
  const inspectPointer = useCallback(
    (event: React.PointerEvent, id: string) => {
      const stationary =
        pointer.current?.x === event.clientX && pointer.current?.y === event.clientY;
      pointer.current = { x: event.clientX, y: event.clientY };
      const bounds = root.current?.getBoundingClientRect();
      if (bounds)
        setTooltipPointer({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      if (tooltipDismissed && stationary) return;
      setActive(id);
    },
    [tooltipDismissed, setActive],
  );
  const setSelected = useCallback(
    (id: string | null) => {
      if (loading) return;
      if (controlledSelected === undefined) updateSelected(id);
      onSelectionChange?.(id, readItem(id));
    },
    [loading, controlledSelected, onSelectionChange, readItem],
  );
  const activate = useCallback(
    (node: TreemapHierarchyNode<TreemapRecords<T>>, event: ChartInteractionEvent = null) => {
      if (loading || event?.defaultPrevented) return;
      const key = interaction.kind === "node" ? node.id : (node.path[0] ?? node.id);
      if (
        interaction.markActivation &&
        interaction.eligible.includes(key) &&
        !interaction.activate({ kind: interaction.kind, key }, "mark", event)
      )
        return;
      setSelected(node.id);
      const item = readItem(node.id);
      if (item) onActivate?.(item);
      if (node.kind === "group") setView(node.id);
    },
    [loading, setSelected, setView, onActivate, readItem, interaction],
  );
  const reduced = useReducedMotion();
  const tooltipId = useId();
  const [registeredVersion, setRegisteredVersion] = useState(0);
  const pendingRegistry = useRef(false);
  const registrySignature = useRef("");
  const register = useCallback((id: string, node: HTMLButtonElement | null) => {
    if (node) buttons.current.set(id, node);
    else buttons.current.delete(id);
    if (pendingRegistry.current) return;
    pendingRegistry.current = true;
    // Consumer callback refs can detach and reattach during one commit. Compare the
    // settled membership, rather than turning those temporary changes into renders.
    queueMicrotask(() => {
      pendingRegistry.current = false;
      const signature = JSON.stringify(
        [...buttons.current.entries()]
          .map(([id, button]) => [id, isAvailableControl(button)])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
      );
      if (signature === registrySignature.current) return;
      registrySignature.current = signature;
      setRegisteredVersion((version) => version + 1);
    });
  }, []);
  useLayoutEffect(() => {
    const signature = JSON.stringify(
      [...buttons.current.entries()]
        .map(([id, button]) => [id, isAvailableControl(button)])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    );
    if (signature === registrySignature.current) return;
    registrySignature.current = signature;
    setRegisteredVersion((version) => version + 1);
  });
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new MutationObserver(() => {
      const signature = JSON.stringify(
        [...buttons.current.entries()]
          .map(([id, button]) => [id, isAvailableControl(button)])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
      );
      if (signature === registrySignature.current) return;
      registrySignature.current = signature;
      setRegisteredVersion((version) => version + 1);
    });
    const attributeFilter = ["disabled", "hidden", "inert"];
    observer.observe(element, { subtree: true, attributes: true, attributeFilter });
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter });
    }
    return () => observer.disconnect();
  }, []);
  void registeredVersion;
  const navigation = geometry.rectangles.filter((node) => {
    const button = buttons.current.get(node.id);
    return isAvailableControl(button);
  });
  const moveFocus = useCallback(
    (id: string | null, key: string) => {
      const targets = geometry.rectangles.filter((node) => {
        const button = buttons.current.get(node.id);
        return isAvailableControl(button);
      });
      const next = treemapNeighbor(targets, id, key);
      if (next !== null) {
        const button = buttons.current.get(next);
        if (isAvailableControl(button)) button.focus();
      }
    },
    [geometry],
  );
  const focus = useCallback((id: string | null) => {
    const button = id === null ? undefined : buttons.current.get(id);
    if (isAvailableControl(button)) button.focus();
  }, []);
  useLayoutEffect(() => {
    const active = document.activeElement;
    const displaced =
      active === null || active === document.body || active === document.documentElement;
    if (loading) {
      const remembered = lastFocusedControl.current;
      if (remembered && (displaced || active === remembered.element)) {
        loadingFocus.current ??= remembered;
      }
      return;
    }
    const remembered = loadingFocus.current;
    if (!remembered) return;
    loadingFocus.current = null;
    // Completion must not steal focus from an input, breadcrumb, or table control.
    if (!displaced && active !== remembered.element) return;
    if (remembered.path === null) {
      if (isAvailableControl(remembered.element)) remembered.element.focus();
      return;
    }
    const candidates = geometry.rectangles.filter((node) => {
      const button = buttons.current.get(node.id);
      return isAvailableControl(button);
    });
    const survivingId = [...remembered.path]
      .reverse()
      .find((id) => candidates.some((node) => node.id === id));
    const target = survivingId ?? candidates[0]?.id ?? null;
    if (target !== null) focus(target);
  }, [loading, geometry, focus]);
  const corrections = useRef({ view: "", active: "", selected: "" });
  useLayoutEffect(() => {
    const previous = previousModel.current;
    const viewCorrection = JSON.stringify([rawView, viewId]);
    if (rawView !== viewId && corrections.current.view !== viewCorrection) {
      corrections.current.view = viewCorrection;
      if (controlledView === undefined) updateView(viewId);
      onViewChange?.(viewId, readItem(viewId));
    }
    const rawActive = controlledActive === undefined ? localActive : controlledActive;
    const activeCorrection = JSON.stringify([rawActive, activeId]);
    if (!loading && rawActive !== activeId && corrections.current.active !== activeCorrection) {
      corrections.current.active = activeCorrection;
      if (controlledActive === undefined) updateActive(activeId);
      onActiveChange?.(activeId, readItem(activeId));
    }
    const rawSelected = controlledSelected === undefined ? localSelected : controlledSelected;
    const selectedCorrection = JSON.stringify([rawSelected, selectedId]);
    if (rawSelected !== selectedId && corrections.current.selected !== selectedCorrection) {
      corrections.current.selected = selectedCorrection;
      if (controlledSelected === undefined) updateSelected(selectedId);
      onSelectionChange?.(selectedId, readItem(selectedId));
    }
    const focusedPath =
      focusedId === null
        ? []
        : (model.byId.get(focusedId)?.path ?? previous?.byId.get(focusedId)?.path ?? []);
    const next = [...focusedPath].reverse().find((id) => navigation.some((node) => node.id === id));
    if (
      focusedId !== null &&
      navigation.length > 0 &&
      !navigation.some((node) => node.id === focusedId)
    ) {
      const fallback = navigation.find((node) => node.id === next)?.id ?? navigation[0]?.id ?? null;
      setFocused(fallback);
      if (focusedInside.current) focus(fallback);
    }
    if (rawView === viewId) corrections.current.view = "";
    if (rawActive === activeId) corrections.current.active = "";
    if (rawSelected === selectedId) corrections.current.selected = "";
    for (const [slot, id] of [
      ["view", rawView],
      ["active", rawActive],
      ["selected", rawSelected],
    ] as const) {
      const existing = id === null ? undefined : model.byId.get(id);
      const retained = retainedPaths.current.get(slot);
      const path = existing?.path ?? (retained?.id === id ? retained.path : []);
      retainedPaths.current.set(slot, { id, path });
    }
    previousModel.current = model;
  }, [
    model,
    rawView,
    viewId,
    activeId,
    selectedId,
    controlledView,
    controlledActive,
    controlledSelected,
    localActive,
    localSelected,
    loading,
    focusedId,
    focus,
    onViewChange,
    onActiveChange,
    onSelectionChange,
    readItem,
    navigation,
  ]);
  useEffect(() => {
    if (loading) {
      setDismissed(true);
      if (controlledActive === undefined) setActive(null);
    } else {
      loadingClearRequested.current = false;
    }
  }, [loading, controlledActive, setActive]);
  useEffect(() => {
    if (loading || activeId === null || !tooltipMounted || tooltipDismissed) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        setDismissed(true);
      }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [loading, activeId, tooltipMounted, tooltipDismissed]);
  const consumerRef = props.ref;
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof consumerRef === "function") {
        const cleanup = consumerRef(node);
        if (typeof cleanup === "function")
          return () => {
            root.current = null;
            cleanup();
          };
      } else if (consumerRef) consumerRef.current = node;
    },
    [consumerRef],
  );
  const latestOpacity = useRef(props.style?.opacity);
  useLayoutEffect(() => {
    latestOpacity.current = props.style?.opacity;
  }, [props.style?.opacity]);
  useEffect(() => {
    const element = root.current;
    if (!animate || reduced || loading || !element) return;
    const original = element.style.opacity;
    const declared = latestOpacity.current;
    const opacity = Number(getComputedStyle(element).opacity);
    const controls = animateMini(element, { opacity: [0, opacity] }, { duration: 0.25 });
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      controls.stop();
      element.style.opacity = Object.is(latestOpacity.current, declared)
        ? original
        : latestOpacity.current === undefined
          ? ""
          : String(latestOpacity.current);
    };
    // Motion commits its final keyframe inline. Release that temporary style too,
    // so later consumer classes keep controlling opacity after the entrance ends.
    void controls.then(release);
    return release;
  }, [animate, reduced, loading]);
  const context: TreemapContextValue<TreemapRecords<T>> = {
    model,
    pointer: tooltipPointer,
    size,
    isHidden,
    isInactive,
    items,
    frontierIds,
    tooltipMounted,
    setTooltipMounted,
    inspectPointer,
    moveFocus,
    navigation,
    defaultFocusId:
      navigation.find((item) => frontierIds.has(item.id))?.id ?? navigation[0]?.id ?? null,
    rectangles: geometry.rectangles,
    viewNodes,
    colors,
    viewId,
    activeId,
    selectedId,
    setView,
    setActive,
    setSelected,
    activate,
    focusedId,
    setFocused: (id) => {
      setTooltipPointer(null);
      setFocused(id);
    },
    dismiss: () => setDismissed(true),
    tooltipDismissed,
    tooltipId,
    loading,
    animate: animate && !reduced && !loading,
    groupHeaderHeight,
    formatValue,
    register,
    focus,
  };
  return (
    <MotionContext value={{ enabled: context.animate, transition: defaultHover }}>
      <RegisterInteractionMotion enabled={context.animate} />
      <Context value={context as unknown as TreemapContextValue<unknown>}>
        {/* biome-ignore lint/a11y/useSemanticElements: Chart controls are not form fields. */}
        <div
          {...props}
          ref={ref}
          data-kind-ui="treemap"
          role="group"
          {...familyFrame({
            width,
            height,
            style: props.style,
            className: cn("relative text-[color:var(--foreground,inherit)]", props.className),
          })}
          aria-busy={loading || undefined}
          onFocusCapture={(event) => {
            props.onFocusCapture?.(event);
            focusedInside.current = event.currentTarget.contains(event.target);
            if (event.target instanceof HTMLElement) {
              const entry = [...buttons.current].find(
                ([, button]) => button === (event.target as EventTarget),
              );
              const node = entry ? model.byId.get(entry[0]) : undefined;
              // React portal events retain chart ownership even outside the plot DOM.
              lastFocusedControl.current = { element: event.target, path: node?.path ?? null };
              if (!loading) loadingFocus.current = null;
            }
          }}
          onBlurCapture={(event) => {
            props.onBlurCapture?.(event);
            if (
              !(event.relatedTarget instanceof Node) ||
              !event.currentTarget.contains(event.relatedTarget)
            ) {
              focusedInside.current = false;
              const content = event.currentTarget.querySelector('[data-kind-ui="treemap-content"]');
              const inertDisplacement =
                (loading ||
                  content?.hasAttribute("inert") ||
                  (event.target instanceof Element &&
                    event.target.closest("[hidden], [inert]") !== null)) &&
                (event.relatedTarget === null ||
                  event.relatedTarget === document.body ||
                  event.relatedTarget === document.documentElement);
              if (!inertDisplacement) {
                lastFocusedControl.current = null;
                loadingFocus.current = null;
              }
              setActive(null);
            }
          }}
          onKeyDown={(event) => {
            props.onKeyDown?.(event);
            if (
              !event.defaultPrevented &&
              event.key === "Escape" &&
              !loading &&
              activeId !== null &&
              tooltipMounted &&
              !tooltipDismissed
            ) {
              event.preventDefault();
              setDismissed(true);
            }
          }}
        >
          <div
            data-kind-ui="treemap-content"
            aria-hidden={loading || undefined}
            inert={loading || undefined}
            className={cn("absolute inset-0", loading && "invisible")}
          >
            {children}
          </div>
          {loading ? (
            <LoadingSkeletonSurface
              family="treemap"
              seed={loadingSeed}
              width="100%"
              height="100%"
              design={(seed) => <TreemapLoadingDesign seed={seed} />}
            />
          ) : geometry.total <= 0 ? (
            <div role="status" className="absolute inset-0 flex items-center justify-center">
              {empty}
            </div>
          ) : null}
          <LoadingStatus loading={loading} label={loadingLabel} />
        </div>
      </Context>
    </MotionContext>
  );
}
