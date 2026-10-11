"use client";

import { type ComponentPropsWithRef, useId, useRef } from "react";
import { InteractionMotionRoot } from "./animation.js";
import type { ChartContextValue } from "./chart-context.js";
import { ChartContext } from "./chart-context.js";
import {
  type ChartInteractionConfig,
  ChartInteractionProvider,
  ChartInteractionStatus,
  type ChartVisibilityProps,
  useChartInteraction,
} from "./chart-interaction.js";
import { EmphasisProvider, useEmphasisActions } from "./emphasis.js";
import {
  type ColorStops,
  colorBaseToken,
  colorResourceId,
  colorStopToken,
  resolveSeriesColor,
} from "./series-color.js";
import { resolveSeriesConfig } from "./series-label.js";
import { SeriesColorDefinitions } from "./series-paint.js";
import type { SeriesConfig } from "./types.js";
import { cn } from "./utils.js";

export type ChartProviderProps = ComponentPropsWithRef<"div"> & {
  config: SeriesConfig;
  emphasis?: "auto" | "none";
  interaction?: ChartInteractionConfig;
} & ChartVisibilityProps;

/** Scopes presentation metadata and CSS colors; the consumer owns chart geometry and state. */
export function ChartProvider({
  config,
  emphasis = "auto",
  interaction,
  defaultVisibleSeries,
  visibleSeries,
  onVisibleSeriesChange,
  style,
  children,
  ...props
}: ChartProviderProps) {
  const controlledVisibility = useRef(visibleSeries !== undefined);
  if (controlledVisibility.current !== (visibleSeries !== undefined))
    throw new Error("Chart cannot switch controlled visibility mode during a mount");
  if (onVisibleSeriesChange && visibleSeries === undefined && defaultVisibleSeries === undefined)
    throw new Error(
      "Chart requires visibleSeries or defaultVisibleSeries when onVisibleSeriesChange is provided",
    );
  if (visibleSeries !== undefined && defaultVisibleSeries !== undefined)
    throw new Error("Chart visibility cannot be both controlled and defaulted");
  const id = useId();
  const colors: Record<string, string> = {};
  const paints: Record<string, string> = {};
  const colorStops: Record<string, ColorStops> = {};
  for (const [key, item] of Object.entries(config)) {
    if (!/^[a-zA-Z][\w-]*$/.test(key) && interaction?.kind !== "node")
      throw new Error(
        `Chart series key "${key}" must start with a letter and contain only letters, numbers, underscores or hyphens`,
      );
    const resolved = resolveSeriesColor(item.color, key);
    colors[colorBaseToken(key)] = resolved.colors[0]!;
    for (const [index, color] of resolved.colors.entries())
      colors[colorStopToken(key, index)] = color;
    colorStops[key] = resolved;
    const gradientId = colorResourceId(id, key);
    const gradient = resolved.colors.length > 1;
    paints[key] = gradient ? `url(#${gradientId})` : `var(${colorBaseToken(key)})`;
    colors[colorStopToken(key, "gradient")] = gradient
      ? `linear-gradient(to right in srgb, ${resolved.offsets.map((offset, index) => `var(${colorStopToken(key, index)}) ${offset * 100}%`).join(", ")})`
      : `var(${colorBaseToken(key)})`;
  }
  const value: ChartContextValue = {
    ...(props.nonce !== undefined ? { nonce: props.nonce } : {}),
    config: resolveSeriesConfig(config),
    paints,
    colorId: id,
    colorStops,
    ...(visibleSeries ? { visibleSeries } : {}),
    ...(onVisibleSeriesChange ? { onVisibleSeriesChange } : {}),
  };
  return (
    <ChartInteractionProvider
      config={value.config}
      {...(interaction ? { interaction } : {})}
      {...(visibleSeries !== undefined
        ? { visibleSeries, ...(onVisibleSeriesChange ? { onVisibleSeriesChange } : {}) }
        : defaultVisibleSeries !== undefined
          ? { defaultVisibleSeries, ...(onVisibleSeriesChange ? { onVisibleSeriesChange } : {}) }
          : {})}
    >
      {(visible, change) => (
        <ChartContext
          value={{
            ...value,
            ...(visible !== undefined ? { visibleSeries: visible } : {}),
            ...(change ? { onVisibleSeriesChange: change } : {}),
          }}
        >
          <InteractionMotionRoot>
            <EmphasisProvider enabled={emphasis === "auto"}>
              <ChartFrame {...props} style={{ ...colors, ...style }}>
                {Object.values(colorStops).some((stops) => stops.colors.length > 1) && (
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    width={0}
                    height={0}
                    className="absolute"
                    data-kind-ui="color-resources"
                  >
                    <SeriesColorDefinitions />
                  </svg>
                )}
                {children}
              </ChartFrame>
            </EmphasisProvider>
          </InteractionMotionRoot>
        </ChartContext>
      )}
    </ChartInteractionProvider>
  );
}

function ChartFrame({ children, ...props }: ComponentPropsWithRef<"div">) {
  const { reset } = useEmphasisActions();
  const interaction = useChartInteraction();
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Delegates Escape from descendants after consumer handlers; this frame is not a control.
    <div
      {...props}
      className={cn("w-full min-w-0 text-[color:var(--foreground,inherit)]", props.className)}
      data-kind-ui="chart"
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.key === "Escape" && interaction.reset(event)) reset();
      }}
    >
      {children}
      <ChartInteractionStatus />
    </div>
  );
}
