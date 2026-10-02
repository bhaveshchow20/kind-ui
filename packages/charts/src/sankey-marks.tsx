"use client";

import { type SVGProps, useId } from "react";
import type {
  SankeyLinkProps as NativeLinkProps,
  SankeyNodeProps as NativeNodeProps,
} from "recharts";

export type SankeyMaterial = "solid" | "gradient";
export type SankeyLinkProps = Omit<NativeLinkProps, "payload"> & {
  payload: NativeLinkProps["payload"] & {
    id: string;
    source: NativeNodeProps["payload"] & { id: string };
    target: NativeNodeProps["payload"] & { id: string };
  };
  material?: SankeyMaterial;
  color?: string | undefined;
  targetColor?: string | undefined;
  /** Presentation and handlers; computed path and flow width always win. */
  pathProps?: SVGProps<SVGPathElement>;
};
export function SankeyLink({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceControlX,
  targetControlX,
  linkWidth,
  sourceRelativeY: _sourceRelativeY,
  targetRelativeY: _targetRelativeY,
  index: _index,
  payload: _payload,
  material = "solid",
  color = "#4f46e5",
  targetColor = "#06b6d4",
  pathProps,
  ...presentation
}: SankeyLinkProps) {
  const id = `sankey-${useId().replace(/:/g, "")}`;
  return (
    <g>
      {material === "gradient" && (
        <defs>
          <linearGradient
            id={id}
            gradientUnits="userSpaceOnUse"
            x1={sourceX}
            y1={sourceY}
            x2={targetX}
            y2={targetY}
          >
            <stop stopColor={color} />
            <stop offset="1" stopColor={targetColor} />
          </linearGradient>
        </defs>
      )}
      <path
        {...presentation}
        {...pathProps}
        d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={material === "gradient" ? `url(#${id})` : color}
        strokeWidth={linkWidth}
        style={{ ...presentation.style, ...pathProps?.style, strokeWidth: linkWidth }}
      />
    </g>
  );
}
export type SankeyNodeProps = Omit<NativeNodeProps, "payload"> & {
  payload: NativeNodeProps["payload"] & { id: string };
  color?: string | undefined;
  rectProps?: SVGProps<SVGRectElement>;
  /** Consumer controls label contents and placement using native node callbacks. */
};
export function SankeyNode({
  x,
  y,
  width,
  height,
  color = "#4f46e5",
  rectProps,
  index: _index,
  payload: _payload,
  ...presentation
}: SankeyNodeProps) {
  return (
    <rect
      {...presentation}
      {...rectProps}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      style={{ ...presentation.style, ...rectProps?.style, width, height }}
    />
  );
}
