"use client";

import type { ComponentPropsWithRef } from "react";
import { OutsidePlot } from "../family-root.js";
import { cn } from "../utils.js";
import { useCandlestick } from "./context.js";
import { fitCandlestickViewport, zoomCandlestickViewport } from "./viewport.js";

type ButtonProps = ComponentPropsWithRef<"button">;
export type CandlestickControlsProps = ComponentPropsWithRef<"fieldset"> & {
  zoomFactor?: number;
  disabled?: boolean;
  zoomInProps?: ButtonProps;
  zoomOutProps?: ButtonProps;
  resetProps?: ButtonProps;
};
const buttonClass =
  "inline-flex h-7 min-w-7 items-center justify-center rounded border border-current/20 px-2 text-xs font-medium hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

/** Explicit buttons propose the same controlled logical windows as plot gestures. */
export function CandlestickControls({
  zoomFactor = 1.5,
  disabled = false,
  zoomInProps = {},
  zoomOutProps = {},
  resetProps = {},
  className,
  children,
  ...props
}: CandlestickControlsProps) {
  if (!Number.isFinite(zoomFactor) || zoomFactor <= 1)
    throw new Error("Candlestick Controls zoomFactor must be finite and greater than 1");
  const context = useCandlestick();
  const { points, changeViewport } = context;
  const viewport = context.targetViewport ?? context.viewport;
  const unavailable = disabled || context.loading || points.length === 0;
  const span = viewport.to - viewport.from;
  const zoom = (factor: number) =>
    changeViewport(
      zoomCandlestickViewport(viewport, factor, (viewport.from + viewport.to) / 2, points.length),
      "zoom",
    );
  return (
    <OutsidePlot placement="bottom">
      <fieldset
        aria-label="Chart zoom controls"
        {...props}
        disabled={unavailable}
        className={cn("m-0 min-w-0 border-0 p-0 flex flex-wrap items-center gap-1", className)}
        data-kind-ui="candlestick-controls"
      >
        <button
          type="button"
          aria-label="Zoom in"
          {...zoomInProps}
          className={cn(buttonClass, zoomInProps.className)}
          disabled={unavailable || span <= 1 || zoomInProps.disabled}
          onClick={(event) => {
            zoomInProps.onClick?.(event);
            if (!event.defaultPrevented) zoom(zoomFactor);
          }}
        >
          {zoomInProps.children ?? "+"}
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          {...zoomOutProps}
          className={cn(buttonClass, zoomOutProps.className)}
          disabled={unavailable || span >= points.length || zoomOutProps.disabled}
          onClick={(event) => {
            zoomOutProps.onClick?.(event);
            if (!event.defaultPrevented) zoom(1 / zoomFactor);
          }}
        >
          {zoomOutProps.children ?? "−"}
        </button>
        <button
          type="button"
          aria-label="Reset view"
          {...resetProps}
          className={cn(buttonClass, resetProps.className)}
          disabled={unavailable || resetProps.disabled}
          onClick={(event) => {
            resetProps.onClick?.(event);
            if (!event.defaultPrevented)
              changeViewport(fitCandlestickViewport(points.length), "reset");
          }}
        >
          {resetProps.children ?? "Reset"}
        </button>
        {children}
      </fieldset>
    </OutsidePlot>
  );
}
