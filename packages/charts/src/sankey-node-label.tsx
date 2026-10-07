"use client";

import { type ComponentPropsWithRef, useId } from "react";
import { prepareSankeyData, type SankeyFlowData } from "./sankey-data.js";
import type { SankeyNodeProps } from "./sankey-marks.js";

export type SankeyNodeLabelProps = Omit<ComponentPropsWithRef<"text">, "position"> & {
  /** Geometry from the native node callback; identity comes from payload.id, never index. */
  node: Pick<SankeyNodeProps, "x" | "y" | "width" | "height" | "payload">;
  data: SankeyFlowData;
  position?: "inside" | "outside";
  /** Outside defaults to left for sinks and right otherwise. Reserve chart margins for text. */
  side?: "left" | "right";
  showValues?: boolean;
  valueFormatter?: (value: number) => string;
  offset?: number;
};

/** Explicit sibling of SankeyNode; preserves native renderer and consumer text ownership. */
export function SankeyNodeLabel({
  node,
  data,
  position = "outside",
  side,
  showValues = false,
  valueFormatter = String,
  offset = 8,
  children,
  ...textProps
}: SankeyNodeLabelProps) {
  const clipId = `sankey-label-${useId().replace(/:/g, "")}`;
  const validated = prepareSankeyData(data);
  const index = validated.nodes.findIndex((item) => item.id === node.payload.id);
  const item = validated.nodes[index];
  if (!item) throw new Error(`SankeyNodeLabel requires node id "${node.payload.id}" in data`);
  if (
    ![node.x, node.y, node.width, node.height, offset].every(Number.isFinite) ||
    node.width < 0 ||
    node.height < 0 ||
    offset < 0
  )
    throw new Error("SankeyNodeLabel requires finite geometry and nonnegative dimensions/offset");
  const incoming = validated.links.reduce(
    (sum, link) => sum + (link.target === index ? link.value : 0),
    0,
  );
  const outgoing = validated.links.reduce(
    (sum, link) => sum + (link.source === index ? link.value : 0),
    0,
  );
  const value = Math.max(incoming, outgoing);
  const label = showValues ? `${item.name}: ${valueFormatter(value)}` : item.name;
  const left =
    (side ?? (validated.links.some((link) => link.source === index) ? "right" : "left")) === "left";
  const inside = position === "inside";
  return (
    <g data-kind-ui="sankey-node-label" data-node-id={item.id}>
      <title>{label}</title>
      {inside && (
        <defs>
          <clipPath id={clipId}>
            <rect x={node.x} y={node.y} width={node.width} height={node.height} />
          </clipPath>
        </defs>
      )}
      <g clipPath={inside ? `url(#${clipId})` : undefined}>
        <text
          x={
            inside ? node.x + node.width / 2 : left ? node.x - offset : node.x + node.width + offset
          }
          y={node.y + node.height / 2}
          textAnchor={inside ? "middle" : left ? "end" : "start"}
          dominantBaseline="middle"
          pointerEvents="none"
          fontSize={12}
          {...textProps}
        >
          {children === undefined ? label : children}
        </text>
      </g>
    </g>
  );
}
