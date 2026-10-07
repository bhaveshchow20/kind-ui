"use client";

import { type ReactNode, useId } from "react";
import { DefaultZIndexes, usePlotArea, ZIndexLayer } from "recharts";

export type ChartBackgroundPatternRenderProps = {
  size: number;
  color: string;
  /** Scope any custom SVG resources with this prefix; never use global IDs. */
  idPrefix: string;
};
export type ChartBackgroundPatternDefinition = Readonly<{
  render: (props: ChartBackgroundPatternRenderProps) => ReactNode;
}>;

/** Register a reusable, consumer-owned definition without mutating global state. */
export function defineChartBackgroundPattern(
  render: ChartBackgroundPatternDefinition["render"],
): ChartBackgroundPatternDefinition {
  if (typeof render !== "function")
    throw new Error("defineChartBackgroundPattern requires a render function");
  return Object.freeze({ render });
}

export type ChartBackgroundPatternProps = {
  pattern: "pinpoints" | "crossings" | "waves" | ChartBackgroundPatternDefinition;
  /** CSS paint, including variables/system colors. Defaults to the chart grid token. */
  color?: string;
  /** Opacity in [0, 1], default 0.15. */
  opacity?: number;
  /** Positive tile size in SVG user units, default 16; does not stretch on resize. */
  size?: number;
};

/** Decorative plot chrome, independent of series paint and interactions. */
export function ChartBackgroundPattern({
  pattern,
  color = "var(--kind-ui-chart-grid, CanvasText)",
  opacity = 0.15,
  size = 16,
}: ChartBackgroundPatternProps) {
  const area = usePlotArea();
  const identity = useId();
  const encodedId = Array.from(identity, (char) => char.codePointAt(0)?.toString(16)).join("-");
  const id = `kind-ui-background-${encodedId}`;
  if (
    !Number.isFinite(size) ||
    size <= 0 ||
    !Number.isFinite(opacity) ||
    opacity < 0 ||
    opacity > 1
  )
    throw new Error("ChartBackgroundPattern requires positive finite size and opacity in [0, 1]");
  if (
    typeof pattern === "string"
      ? !["pinpoints", "crossings", "waves"].includes(pattern)
      : !pattern || typeof pattern.render !== "function"
  )
    throw new Error("ChartBackgroundPattern requires a preset or a custom definition");
  if (!area || area.width <= 0 || area.height <= 0) return null;
  const tile =
    typeof pattern !== "string" ? (
      pattern.render({ size, color, idPrefix: `${id}-custom` })
    ) : pattern === "pinpoints" ? (
      <circle cx={size / 2} cy={size / 2} r={size / 16} fill={color} />
    ) : pattern === "crossings" ? (
      <path
        d={`M${size / 2} ${size / 4}v${size / 2} M${size / 4} ${size / 2}h${size / 2}`}
        stroke={color}
        fill="none"
      />
    ) : (
      <path
        d={`M0 ${size / 2}Q${size / 4} 0 ${size / 2} ${size / 2}T${size} ${size / 2}`}
        stroke={color}
        fill="none"
      />
    );
  return (
    <ZIndexLayer zIndex={DefaultZIndexes.grid - 1}>
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: SVG decoration is explicitly nonfocusable and ignores pointer events. */}
      <g
        data-kind-ui="chart-background-pattern"
        aria-hidden="true"
        focusable="false"
        pointerEvents="none"
        clipPath={`url(#${id}-clip)`}
        opacity={opacity}
      >
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x={area.x} y={area.y} width={area.width} height={area.height} />
          </clipPath>
          <pattern
            id={id}
            x={area.x}
            y={area.y}
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
          >
            {tile}
          </pattern>
        </defs>
        <rect x={area.x} y={area.y} width={area.width} height={area.height} fill={`url(#${id})`} />
      </g>
    </ZIndexLayer>
  );
}
