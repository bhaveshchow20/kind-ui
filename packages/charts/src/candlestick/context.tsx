"use client";

import { createContext, use } from "react";
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
