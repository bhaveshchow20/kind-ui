"use client";

import { type SVGProps, useId } from "react";
import type {
  SankeyLinkProps as NativeLinkProps,
  SankeyNodeProps as NativeNodeProps,
} from "recharts";

import { type SankeyFinish, SankeyFinishFilter } from "./sankey-finish.js";

export type SankeyMaterial = "solid" | "gradient";
export type SankeyLinkProps = Omit<NativeLinkProps, "payload"> & {
  payload: NativeLinkProps["payload"] & {
    id: string;
    source: NativeNodeProps["payload"] & { id: string };
    target: NativeNodeProps["payload"] & { id: string };
  };
  material?: SankeyMaterial;
  finish?: SankeyFinish;
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
  finish = "plain",
  color = "#4f46e5",
  targetColor = "#06b6d4",
  pathProps,
  ...presentation
}: SankeyLinkProps) {
  const id = `sankey-${useId().replace(/:/g, "")}`;
  const finished =
    finish !== "plain" &&
    presentation.filter == null &&
    pathProps?.filter == null &&
    presentation.style?.filter == null &&
    pathProps?.style?.filter == null;
  const pad = linkWidth / 2 + 3;
  const bounds = {
    x: Math.min(sourceX, targetX, sourceControlX, targetControlX) - pad,
    y: Math.min(sourceY, targetY) - pad,
    width:
      Math.max(sourceX, targetX, sourceControlX, targetControlX) -
      Math.min(sourceX, targetX, sourceControlX, targetControlX) +
      pad * 2,
    height: Math.abs(targetY - sourceY) + pad * 2,
  };
  return (
    <g>
      {finished && (
        <defs>
          <SankeyFinishFilter
            id={`${id}-finish`}
            finish={finish}
            thickness={linkWidth}
            bounds={bounds}
          />
        </defs>
      )}
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
        filter={
          pathProps?.filter ?? presentation.filter ?? (finished ? `url(#${id}-finish)` : undefined)
        }
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
  finish?: SankeyFinish;
  /** Consumer controls label contents and placement using native node callbacks. */
};
export function SankeyNode({
  x,
  y,
  width,
  height,
  color = "#4f46e5",
  rectProps,
  finish = "plain",
  index: _index,
  payload: _payload,
  ...presentation
}: SankeyNodeProps) {
  const id = `sankey-node-${useId().replace(/:/g, "")}`;
  const finished =
    finish !== "plain" &&
    presentation.filter == null &&
    rectProps?.filter == null &&
    presentation.style?.filter == null &&
    rectProps?.style?.filter == null;
  const rect = (
    <rect
      {...presentation}
      {...rectProps}
      filter={rectProps?.filter ?? presentation.filter ?? (finished ? `url(#${id})` : undefined)}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      style={{ ...presentation.style, ...rectProps?.style, width, height }}
    />
  );
  if (!finished) return rect;
  return (
    <g>
      <defs>
        <SankeyFinishFilter
          id={id}
          finish={finish}
          thickness={Math.min(width, height)}
          // Viewport-relative bounds preserve inherited/class-based and em/percent strokes.
          // The native SVG viewport still clips output; no DOM measurements or style parsing.
          bounds={{ x: "-100%", y: "-100%", width: "300%", height: "300%" }}
        />
      </defs>
      {rect}
    </g>
  );
}
