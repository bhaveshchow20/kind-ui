"use client";

import type { ReactNode } from "react";
import { InteractionPaint } from "./animation.js";
import { useChartInteraction } from "./chart-interaction.js";
import { useEmphasis } from "./emphasis.js";

/** Node-only focus includes incident links and endpoint nodes; no flow filtering. */
export function SankeyFocusMark({
  nodeKey,
  endpoints,
  adjacent,
  children,
}: {
  nodeKey?: string;
  endpoints?: readonly string[];
  adjacent: ReadonlyMap<string, ReadonlySet<string>>;
  children: ReactNode;
}) {
  const interaction = useChartInteraction();
  const key = nodeKey ?? endpoints?.[0] ?? "";
  const emphasis = useEmphasis({ kind: "series", key, scope: "sankey", seriesKey: key });
  const inspected = emphasis.active?.kind === "series" ? emphasis.active.key : null;
  const focus = inspected ?? interaction.selected;
  const related =
    focus === null ||
    (nodeKey !== undefined
      ? nodeKey === focus || adjacent.get(focus)?.has(nodeKey)
      : endpoints?.includes(focus));
  const interactive =
    nodeKey !== undefined && interaction.markActivation && interaction.eligible.includes(nodeKey);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useAriaPropsSupportedByRole: Role, pressed state and handlers are enabled together for opted-in SVG controls.
    <g
      data-kind-ui="sankey-focus-mark"
      data-node={nodeKey}
      data-source={endpoints?.[0]}
      data-target={endpoints?.[1]}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Highlight ${nodeKey}` : undefined}
      aria-pressed={interactive ? interaction.selected === nodeKey : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") emphasis.enter("pointer");
      }}
      onPointerLeave={() => emphasis.leave("pointer")}
      onPointerCancel={() => emphasis.leave("pointer")}
      onFocus={() => emphasis.enter("keyboard")}
      onBlur={() => emphasis.leave("keyboard")}
      onKeyDown={(event) => {
        if (
          interactive &&
          event.target === event.currentTarget &&
          !event.defaultPrevented &&
          (event.key === "Enter" || event.key === " ")
        ) {
          if (!event.repeat) interaction.activate({ kind: "node", key: nodeKey }, "mark", event);
          event.preventDefault();
        }
      }}
    >
      <InteractionPaint opacity={related ? 1 : 0.28}>{children}</InteractionPaint>
    </g>
  );
}
