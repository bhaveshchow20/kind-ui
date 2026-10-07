"use client";

import {
  type KeyboardEventHandler,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";
import { useChart } from "./chart-context.js";
import {
  useChartInteraction,
  useInteractionAvailability,
  useInteractionRegistration,
} from "./chart-interaction.js";
import { useEmphasis } from "./emphasis.js";
import { useChartKeyboard, useLineInteraction } from "./line-chart.js";

/** Native handlers retain their original data/index/event tuple and run first. */
export function useSeriesInteraction<Args extends unknown[]>(
  key: string | undefined,
  hidden: boolean,
  nativeHidden = false,
  seriesData: readonly unknown[] | undefined,
  handler: ((...args: Args) => void) | undefined,
) {
  const interaction = useChartInteraction();
  const { data } = useLineInteraction();
  const { visibleSeries } = useChart();
  const rootHidden =
    key !== undefined && visibleSeries !== undefined && !visibleSeries.includes(key);
  // Some consumers mirror Root visibility into native hide. Their hidden IDs stay restorable.
  useInteractionAvailability(
    interaction.kind === "series" ? key : undefined,
    nativeHidden && !rootHidden,
  );
  useInteractionRegistration(
    interaction.kind === "series" && key !== undefined && (seriesData ?? data)?.length ? [key] : [],
  );
  const interactive =
    key !== undefined &&
    !hidden &&
    interaction.kind === "series" &&
    interaction.interactive &&
    interaction.markActivation &&
    interaction.eligible.includes(key);
  const latest = useRef({ handler, interaction, interactive, key });
  useLayoutEffect(() => {
    latest.current = { handler, interaction, interactive, key };
  });
  const onClick = useCallback((...args: Args) => {
    latest.current.handler?.(...args);
    const current = latest.current;
    const event = args[args.length - 1] as SyntheticEvent<Element> & { button?: number };
    if (current.interactive && current.key !== undefined && event?.button === 0)
      current.interaction.activate({ kind: "series", key: current.key }, "mark", event);
  }, []);
  // Native animation IDs include handler identity even when native animation is disabled.
  return { onClick: interactive ? onClick : handler };
}

/** One keyboard target per logical series, within its native ZIndex portal. */
export function SeriesInteractionLayer({
  seriesKey,
  hidden,
  children,
  onKeyDown,
}: {
  seriesKey: string | undefined;
  hidden: boolean;
  onKeyDown?: KeyboardEventHandler<SVGElement> | undefined;
  children: ReactNode;
}) {
  const interaction = useChartInteraction();
  const { config } = useChart();
  const enabled =
    seriesKey !== undefined && !hidden && interaction.kind === "series" && interaction.configured;
  const emphasis = useEmphasis(
    { kind: "series", key: seriesKey ?? "", scope: "series", seriesKey },
    enabled,
  );
  const keyboard = useChartKeyboard();
  const interactive =
    enabled &&
    interaction.interactive &&
    interaction.markActivation &&
    interaction.eligible.includes(seriesKey);
  // Native axis inspection includes all series at this category, so keep their paint readable.
  const nativeInspection =
    keyboard &&
    typeof document !== "undefined" &&
    document.activeElement?.getAttribute("role") === "application";
  const factor = nativeInspection && emphasis.active === null ? 1 : emphasis.factor;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useAriaPropsSupportedByRole: Role, pressed state and handlers are enabled together for opted-in SVG controls.
    <g
      data-kind-ui="series-interaction"
      data-series={seriesKey}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={
        interactive
          ? `${interaction.mode === "focus" ? "Highlight" : "Toggle"} ${config[seriesKey]?.label ?? seriesKey}`
          : undefined
      }
      aria-pressed={
        interactive
          ? interaction.mode === "focus"
            ? interaction.selected === seriesKey
            : (interaction.visible?.includes(seriesKey) ?? true)
          : undefined
      }
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") emphasis.enter("pointer");
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== "touch") emphasis.enter("pointer");
      }}
      onPointerLeave={() => emphasis.leave("pointer")}
      onPointerCancel={() => emphasis.leave("pointer")}
      onFocus={(event) => {
        if ((event.target as Element).matches(":focus-visible")) emphasis.enter("keyboard");
      }}
      onBlur={() => emphasis.leave("keyboard")}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget) onKeyDown?.(event);
        if (
          interactive &&
          event.target === event.currentTarget &&
          !event.defaultPrevented &&
          (event.key === "Enter" || event.key === " ")
        ) {
          if (!event.repeat)
            interaction.activate({ kind: "series", key: seriesKey }, "mark", event);
          event.preventDefault();
        }
      }}
    >
      <g data-kind-ui="series-interaction-paint" style={{ opacity: factor }}>
        {children}
      </g>
    </g>
  );
}
