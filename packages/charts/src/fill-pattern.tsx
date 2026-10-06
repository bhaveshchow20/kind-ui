"use client";

import { type ComponentPropsWithRef, useId } from "react";

/** Static paint encoding, independent of material and chart geometry. */
export type FillPattern = {
  kind: "hatch" | "stripe" | "duotone" | "dots" | "lines";
  /** Second ink; defaults to CanvasText and follows the host's color scheme. */
  color?: string;
  /** Positive tile size in SVG user units (default 8). */
  size?: number;
  /** Positive stroke/stripe width or dot diameter, <= size (default 1; stripe 2). */
  width?: number;
  /** Rotation in degrees (default 45 for hatch, 0 otherwise). */
  angle?: number;
};

export function patternResourceId(id: string) {
  return `kind-ui-pattern-${Array.from(id, (char) => char.codePointAt(0)?.toString(16)).join("-")}`;
}

export function FillPatternDefinition({
  id,
  pattern,
  baseColor,
}: {
  id: string;
  pattern: FillPattern;
  baseColor: string;
}) {
  const {
    kind,
    size = 8,
    width = kind === "stripe" ? 2 : 1,
    angle = kind === "hatch" ? 45 : 0,
  } = pattern;
  if (
    !["hatch", "stripe", "duotone", "dots", "lines"].includes(kind) ||
    !Number.isFinite(size) ||
    size <= 0 ||
    !Number.isFinite(width) ||
    width <= 0 ||
    width > size ||
    !Number.isFinite(angle)
  )
    throw new Error(
      "FillPattern requires a known kind, positive size/width (width <= size), and finite angle",
    );
  return (
    <pattern
      id={id}
      data-kind-ui="fill-pattern"
      data-pattern={kind}
      width={size}
      height={size}
      patternUnits="userSpaceOnUse"
      patternTransform={`rotate(${angle})`}
    >
      <rect width={size} height={size} fill={baseColor} />
      {kind === "dots" ? (
        <circle cx={size / 2} cy={size / 2} r={width / 2} fill={pattern.color ?? "CanvasText"} />
      ) : kind === "hatch" || kind === "lines" ? (
        <path
          d={`M0 0V${size} M${size} 0V${size}`}
          stroke={pattern.color ?? "CanvasText"}
          strokeWidth={width}
        />
      ) : (
        <rect
          width={kind === "duotone" ? size / 2 : width}
          height={size}
          fill={pattern.color ?? "CanvasText"}
        />
      )}
    </pattern>
  );
}

export type FillPatternSwatchProps = Omit<ComponentPropsWithRef<"svg">, "children" | "color"> & {
  pattern: FillPattern;
  color: string;
};

/** Decorative marker for explicit series/consumer legends; native svg props remain available. */
export function FillPatternSwatch({ pattern, color, ...props }: FillPatternSwatchProps) {
  const id = patternResourceId(useId());
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      {...props}
      data-kind-ui="chart-indicator"
      data-fill-pattern=""
    >
      <defs>
        <FillPatternDefinition id={id} pattern={pattern} baseColor={color} />
      </defs>
      <rect width={16} height={16} fill={`url(#${id})`} />
    </svg>
  );
}
