"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { CandlestickPoint } from "./model.js";
import type { CandlestickViewport, CandlestickViewportReason } from "./viewport.js";

export type NativePoint = CandlestickPoint<object> & { coordinate: number };
/** Inspection changes repaint only the readout/cursor subscribers, not native geometry. */
export function createCandlestickInspectionStore() {
  let current: CandlestickPoint["time"] | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set: (next: CandlestickPoint["time"] | null) => {
      if (next === current) return;
      current = next;
      for (const listener of [...listeners]) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
const noInspection = () => null;
type PointerPosition = Readonly<{ clientX: number; clientY: number }>;
/** Private per-frame cursor updates do not change the React observation context. */
export function createCandlestickPointerStore() {
  let current: PointerPosition | null = null;
  let frame: number | undefined;
  const listeners = new Set<() => void>();
  const cancel = () => {
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
  };
  return {
    get: () => current,
    set: (next: PointerPosition | null) => {
      current = next;
      if (frame !== undefined || listeners.size === 0) return;
      frame = requestAnimationFrame(() => {
        frame = undefined;
        for (const listener of listeners) listener();
      });
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) cancel();
      };
    },
    dispose: () => {
      cancel();
      current = null;
    },
  };
}
/** Price pills reserve only ordinary native tick labels; candle geometry is never measured. */
export function createCandlestickAxisLabels() {
  type Bounds = { left: number; right: number; top: number; bottom: number };
  type Label = { node: SVGElement; bounds: Bounds; visibility: string };
  const axes = new Map<string, Label[]>();
  const pills = new Map<string, Label & { priority: number }>();
  const bounds = (node: SVGElement) => {
    const box = node.getBoundingClientRect();
    const surface = node.ownerSVGElement?.getBoundingClientRect();
    return {
      left: box.left - (surface?.left ?? 0),
      right: box.right - (surface?.left ?? 0),
      top: box.top - (surface?.top ?? 0),
      bottom: box.bottom - (surface?.top ?? 0),
      width: box.width,
      height: box.height,
    };
  };
  const overlaps = (a: Bounds, b: Bounds) =>
    a.left < b.right + 2 && a.right > b.left - 2 && a.top < b.bottom + 2 && a.bottom > b.top - 2;
  const restore = (label: Label) => {
    label.node.style.visibility = label.visibility;
  };
  const refresh = () => {
    const visible = [...pills.values()].filter((pill) => {
      const hidden = [...pills.values()].some(
        (other) => other.priority > pill.priority && overlaps(pill.bounds, other.bounds),
      );
      pill.node.style.visibility = hidden ? "hidden" : pill.visibility;
      return !hidden && pill.visibility !== "hidden";
    });
    for (const labels of axes.values())
      for (const label of labels)
        label.node.style.visibility = visible.some((pill) => overlaps(label.bounds, pill.bounds))
          ? "hidden"
          : label.visibility;
  };
  return {
    register: (id: string, nodes: readonly SVGElement[]) => {
      const labels = nodes.map((node) => ({
        node,
        bounds: bounds(node),
        visibility: node.style.visibility,
      }));
      axes.set(id, labels);
      refresh();
      return () => {
        labels.forEach(restore);
        axes.delete(id);
        refresh();
      };
    },
    set: (id: string, node: SVGElement | null, priority = 0, content: SVGElement | null = node) => {
      const previous = pills.get(id);
      if (previous) restore(previous);
      if (node) {
        const rectangle = bounds(node);
        const visibility = getComputedStyle(content ?? node).visibility;
        if (
          rectangle.width > 0 &&
          rectangle.height > 0 &&
          visibility !== "hidden" &&
          visibility !== "collapse"
        )
          pills.set(id, {
            node,
            bounds: rectangle,
            priority,
            visibility: previous?.node === node ? previous.visibility : node.style.visibility,
          });
        else pills.delete(id);
      } else pills.delete(id);
      refresh();
    },
    dispose: () => {
      for (const labels of axes.values()) labels.forEach(restore);
      for (const pill of pills.values()) restore(pill);
      axes.clear();
      pills.clear();
    },
  };
}
export type Context = {
  points: NativePoint[];
  rendered: NativePoint[];
  viewport: CandlestickViewport;
  targetViewport: CandlestickViewport;
  loading: boolean;
  timeDomain: [number, number];
  priceDomain: [number, number];
  priceScale: "linear" | "log";
  priceBounds?: readonly [number, number];
  autoscale: "visible" | "all";
  spacing: "ordinal" | "elapsed";
  timeMode: "epoch-ms" | "business-date";
  pointer: ReturnType<typeof createCandlestickPointerStore>;
  inspection: ReturnType<typeof createCandlestickInspectionStore>;
  axisLabels: ReturnType<typeof createCandlestickAxisLabels>;
  selected: NativePoint | null;
  inspect: (time: CandlestickPoint["time"] | null) => void;
  select: (time: CandlestickPoint["time"] | null) => void;
  changeViewport: (range: CandlestickViewport, reason: CandlestickViewportReason) => void;
  formatTime: (time: CandlestickPoint["time"], point?: CandlestickPoint<object>) => string;
  formatPrice: (value: number, point?: CandlestickPoint<object>) => string;
  formatVolume: (value: number, point?: CandlestickPoint<object>) => string;
  volumeRatio: number;
  contents: number;
  registerContent: (key: string) => () => void;
  registerVolume: (key: string) => () => void;
  hasPriceAxis: boolean;
  registerPriceAxis: (key: string) => () => void;
  registerOverlay: (key: string, values: readonly number[]) => () => void;
  revealClipId: string;
  priceClipId: string;
  volumeClipId: string;
  interrupt: { current: () => void };
  finishViewport: () => void;
  geometry: {
    current: {
      local: (clientX: number, clientY: number) => Readonly<{ x: number; y: number }> | null;
      contains: (clientX: number, clientY: number) => boolean;
      nearest: (clientX: number, clientY: number) => NativePoint | null;
      coordinate: (clientX: number, clientY: number) => number | null;
      width: number;
    } | null;
  };
};
export const CandleContext = createContext<Context | null>(null);
export function useCandlestick() {
  const value = use(CandleContext);
  if (!value) throw new Error("Candlestick parts require CandlestickChart");
  return value;
}
export function useCandlestickInspection() {
  const context = useCandlestick();
  const time = useSyncExternalStore(
    context.inspection.subscribe,
    context.inspection.get,
    noInspection,
  );
  return context.points.find((point) => point.time === time) ?? null;
}

type SeriesTargets = {
  owners: ReadonlyMap<string, readonly string[]>;
  register: (key: string, id: string) => () => void;
};
const SeriesTargetContext = createContext<SeriesTargets | null>(null);

/** Each Candlestick root exposes one keyboard control per logical series key. */
export function CandlestickSeriesTargets({ children }: { children: ReactNode }) {
  const [owners, setOwners] = useState<ReadonlyMap<string, readonly string[]>>(() => new Map());
  const register = useCallback((key: string, id: string) => {
    setOwners((current) => new Map(current).set(key, [...(current.get(key) ?? []), id]));
    return () =>
      setOwners((current) => {
        const next = new Map(current);
        const remaining = (current.get(key) ?? []).filter((owner) => owner !== id);
        if (remaining.length) next.set(key, remaining);
        else next.delete(key);
        return next;
      });
  }, []);
  const value = useMemo(() => ({ owners, register }), [owners, register]);
  return <SeriesTargetContext value={value}>{children}</SeriesTargetContext>;
}

/** Painting, pointer emphasis and mark activation remain enabled on every part. */
export function useCandlestickSeriesTarget(key: string, hidden: boolean) {
  const targets = use(SeriesTargetContext);
  const id = useId();
  const register = targets?.register;
  useLayoutEffect(() => (hidden ? undefined : register?.(key, id)), [register, key, id, hidden]);
  return targets ? targets.owners.get(key)?.[0] === id : true;
}
