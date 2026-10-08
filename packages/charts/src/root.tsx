"use client";

import { type ComponentPropsWithRef, useId } from "react";
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
  colorResourceId,
  colorStopToken,
  resolveSeriesColor,
} from "./series-color.js";
import { resolveSeriesConfig } from "./series-label.js";
import { SeriesColorDefinitions } from "./series-paint.js";
import { StylesheetWarning } from "./stylesheet-warning.js";
import type { SeriesConfig } from "./types.js";

export type RootProps = ComponentPropsWithRef<"div"> & {
  config: SeriesConfig;
  emphasis?: "auto" | "none";
  interaction?: ChartInteractionConfig;
} & ChartVisibilityProps;

/** Scopes presentation metadata and CSS colors; the consumer owns chart geometry and state. */
export function Root({
  config,
  emphasis = "auto",
  interaction,
  defaultVisibleSeries,
  visibleSeries,
  onVisibleSeriesChange,
  style,
  children,
  ...props
}: RootProps) {
  if (onVisibleSeriesChange && visibleSeries === undefined && defaultVisibleSeries === undefined)
    throw new Error(
      "Root requires visibleSeries or defaultVisibleSeries when onVisibleSeriesChange is provided",
    );
  if (visibleSeries !== undefined && defaultVisibleSeries !== undefined)
    throw new Error("Root visibility cannot be both controlled and defaulted");
  const id = useId();
  const colors: Record<string, string> = {};
  const paints: Record<string, string> = {};
  const colorStops: Record<string, ColorStops> = {};
  for (const [key, item] of Object.entries(config)) {
    if (!/^[a-zA-Z][\w-]*$/.test(key))
      throw new Error(
        `Chart series key "${key}" must start with a letter and contain only letters, numbers, underscores or hyphens`,
      );
    const resolved = resolveSeriesColor(item.color, key);
    colors[`--color-${key}`] = resolved.colors[0]!;
    for (const [index, color] of resolved.colors.entries())
      colors[colorStopToken(key, index)] = color;
    colorStops[key] = resolved;
    const gradientId = colorResourceId(id, key);
    const gradient = resolved.colors.length > 1;
    paints[key] = gradient ? `url(#${gradientId})` : `var(--color-${key})`;
    colors[colorStopToken(key, "gradient")] = gradient
      ? `linear-gradient(to right in srgb, ${resolved.offsets.map((offset, index) => `var(${colorStopToken(key, index)}) ${offset * 100}%`).join(", ")})`
      : `var(--color-${key})`;
  }
  const value: ChartContextValue = {
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
              <RootFrame {...props} style={{ ...colors, ...style }}>
                {process.env.NODE_ENV === "development" && <StylesheetWarning />}
                {Object.values(colorStops).some((stops) => stops.colors.length > 1) && (
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    width={0}
                    height={0}
                    style={{ position: "absolute" }}
                    data-kind-ui="color-resources"
                  >
                    <SeriesColorDefinitions />
                  </svg>
                )}
                {children}
              </RootFrame>
            </EmphasisProvider>
          </InteractionMotionRoot>
        </ChartContext>
      )}
    </ChartInteractionProvider>
  );
}

function RootFrame({ children, ...props }: ComponentPropsWithRef<"div">) {
  const { reset } = useEmphasisActions();
  const interaction = useChartInteraction();
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Delegates Escape from descendants after consumer handlers; this frame is not a control.
    <div
      {...props}
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
