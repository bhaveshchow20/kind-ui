"use client";

import { Dot, type DotProps } from "recharts";

export type PointStyle = "default" | "border" | "colored-border";
export type PointMarkerProps = DotProps & { variant?: PointStyle | undefined };

/** Paint only: native coordinates, radius, events and inspection remain owned by Recharts. */
export function markerPaint(variant: PointStyle, color: string | undefined) {
  if (variant === "default") return {};
  const surface = "var(--kind-ui-chart-marker-surface, var(--card, white))";
  return {
    fill: variant === "border" ? color : surface,
    stroke: variant === "border" ? surface : color,
    strokeWidth: 2,
    strokeDasharray: "none",
  };
}

/** Native Dot renderer: variant paint wins engine paint; SVG style remains consumer-owned. */
export function PointMarker({ variant = "default", ...props }: PointMarkerProps) {
  return (
    <Dot
      {...props}
      {...markerPaint(variant, props.stroke ?? props.fill)}
      data-kind-ui="point-marker"
      data-point-style={variant}
    />
  );
}
