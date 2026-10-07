"use client";

import { type ComponentPropsWithRef, useId } from "react";
import type { SankeyNodeConfig } from "./sankey-colors.js";
import { prepareSankeyData, type SankeyFlowData } from "./sankey-data.js";
import type { SankeyNodeProps } from "./sankey-marks.js";

export type SankeyNodeLabelProps = Omit<ComponentPropsWithRef<"text">, "position"> & {
  /** Geometry from the native node callback; identity comes from payload.id, never index. */
  node: Pick<SankeyNodeProps, "x" | "y" | "width" | "height" | "payload">;
  data: SankeyFlowData;
  /** Explicit metadata; icons are looked up by payload.id. Labels still use data names. */
  nodeConfig?: SankeyNodeConfig;
  /** Square SVG viewport size and gap in chart units; inside icons share the node clip. */
  iconSize?: number;
  iconGap?: number;
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
  nodeConfig,
  iconSize = 16,
  iconGap = 4,
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
    ![node.x, node.y, node.width, node.height, offset, iconSize, iconGap].every(Number.isFinite) ||
    node.width < 0 ||
    node.height < 0 ||
    offset < 0 ||
    iconSize < 0 ||
    iconGap < 0
  )
    throw new Error(
      "SankeyNodeLabel requires finite geometry and nonnegative dimensions/offset/icon size/gap",
    );
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
  const icon =
    nodeConfig && Object.hasOwn(nodeConfig, item.id) ? nodeConfig[item.id]?.icon : undefined;
  const hasIcon = icon !== undefined && icon !== null && typeof icon !== "boolean" && iconSize > 0;
  const iconSpace = hasIcon ? iconSize + iconGap : 0;
  const edge = left ? node.x - offset : node.x + node.width + offset;
  // Inside uses a centered icon above centered text; outside puts the icon nearest the node.
  const iconX = inside ? node.x + (node.width - iconSize) / 2 : left ? edge - iconSize : edge;
  const centerY = node.y + node.height / 2;
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
        {hasIcon && (
          <svg
            data-kind-ui="sankey-node-icon"
            x={iconX}
            y={inside ? centerY - iconSize - iconGap / 2 : centerY - iconSize / 2}
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            pointerEvents="none"
            overflow="hidden"
          >
            {icon}
          </svg>
        )}
        <text
          x={inside ? node.x + node.width / 2 : left ? edge - iconSpace : edge + iconSpace}
          y={inside && hasIcon ? centerY + iconGap / 2 + 6 : centerY}
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
