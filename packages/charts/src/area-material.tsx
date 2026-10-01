"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AreaRevealShape, type AreaRevealShapeProps } from "recharts";
import type { LineMaterial } from "./line-material.js";
import { SurfaceMaterialFilter } from "./surface-material.js";

/** The same finish vocabulary as lines, applied to the complete native area. */
export type AreaMaterial = LineMaterial;

export function MaterialArea({
  material,
  filterId,
  ...props
}: AreaRevealShapeProps & {
  material: Exclude<AreaMaterial, "plain">;
  filterId: string;
}) {
  const nativeShape = useRef<SVGGElement>(null);
  const [envelope, setEnvelope] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>();
  // A native/custom curve interpolation can overshoot its data points. Measure the
  // unchanged SVG geometry before paint rather than reimplementing Recharts paths.
  useLayoutEffect(() => {
    const box = nativeShape.current?.getBBox();
    if (!box || ![box.x, box.y, box.width, box.height].every(Number.isFinite)) return;
    setEnvelope((previous) =>
      previous &&
      previous.x === box.x &&
      previous.y === box.y &&
      previous.width === box.width &&
      previous.height === box.height
        ? previous
        : { x: box.x, y: box.y, width: box.width, height: box.height },
    );
  });
  // Include the engine's baseline: stacks, ranges and vertical areas do not share a flat Y.
  const points = [
    ...(props.points ?? []),
    ...(Array.isArray(props.baseLine) ? props.baseLine : []),
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  if (!Number.isFinite(minX)) return <AreaRevealShape {...props} />;
  if (typeof props.baseLine === "number" && Number.isFinite(props.baseLine)) {
    if (props.layout === "vertical") {
      minX = Math.min(minX, props.baseLine);
      maxX = Math.max(maxX, props.baseLine);
    } else {
      minY = Math.min(minY, props.baseLine);
      maxY = Math.max(maxY, props.baseLine);
    }
  }
  if (envelope) {
    minX = Math.min(minX, envelope.x);
    minY = Math.min(minY, envelope.y);
    maxX = Math.max(maxX, envelope.x + envelope.width);
    maxY = Math.max(maxY, envelope.y + envelope.height);
  }
  const width = Number(props.strokeWidth ?? 1);
  const pad = (Number.isFinite(width) ? Math.abs(width) : 12) / 2 + 8;
  return (
    <g data-kind-ui="area-material" data-material={material}>
      <defs pointerEvents="none">
        <SurfaceMaterialFilter
          material={material}
          id={filterId}
          family="area"
          bounds={{
            x: minX - pad,
            y: minY - pad,
            width: maxX - minX + 2 * pad,
            height: maxY - minY + 2 * pad,
          }}
        />
      </defs>
      <g ref={nativeShape} filter={`url(#${filterId})`}>
        <AreaRevealShape {...props} />
      </g>
    </g>
  );
}
