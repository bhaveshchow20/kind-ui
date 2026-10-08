"use client";

import type { ReactNode } from "react";
import { InteractionPaint } from "./animation.js";
import { useChartInteraction } from "./chart-interaction.js";
import { useEmphasis } from "./emphasis.js";

/** Native secondary portals need their own paint fade and immediate interaction suppression. */
export function SeriesEscapePaint({
  seriesKey,
  hidden,
  children,
}: {
  seriesKey: string | undefined;
  hidden: boolean;
  children: ReactNode;
}) {
  const interaction = useChartInteraction();
  const emphasis = useEmphasis(
    { kind: "series", key: seriesKey ?? "", scope: "series", seriesKey },
    seriesKey !== undefined &&
      !hidden &&
      interaction.kind === "series" &&
      interaction.configured &&
      interaction.eligible.includes(seriesKey),
  );
  return (
    <g
      data-kind-ui="series-escape"
      data-series={seriesKey}
      pointerEvents={hidden ? "none" : undefined}
      aria-hidden={hidden || undefined}
    >
      <InteractionPaint opacity={hidden ? 0 : emphasis.factor}>{children}</InteractionPaint>
    </g>
  );
}
