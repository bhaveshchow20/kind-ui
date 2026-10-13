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
} from "react";
import type { CandlestickPoint } from "./model.js";
import type { CandlestickViewport, CandlestickViewportReason } from "./viewport.js";

export type NativePoint = CandlestickPoint<object> & { coordinate: number };
export type Context = {
  points: NativePoint[];
  rendered: NativePoint[];
  viewport: CandlestickViewport;
  timeDomain: [number, number];
  priceDomain: [number, number];
  priceScale: "linear" | "log";
  priceBounds?: readonly [number, number];
  autoscale: "visible" | "all";
  active: NativePoint | null;
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
  registerOverlay: (key: string, values: readonly number[]) => () => void;
  revealClipId: string;
  priceClipId: string;
  volumeClipId: string;
  interrupt: { current: () => void };
  geometry: {
    current: {
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
