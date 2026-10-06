"use client";

import { useLayoutEffect, useRef } from "react";
import { Curve, LineDrawShape, type LineDrawShapeProps } from "recharts";
import { type LineMaterial, MaterialCurve } from "./line-material.js";
import { getProjectedStart } from "./line-projection.js";
import { getProjectionBounds, getProjectionClip } from "./projected-clip.js";

/** Two paints of the complete native path; no point partition or spline recomputation. */
export function ProjectedCurve({
  projectedRows,
  projectedDasharray,
  material,
  filterId,
  materialWidth,
  clipPath,
  ...props
}: Omit<LineDrawShapeProps, "pathRef"> & {
  pathRef?: LineDrawShapeProps["pathRef"];
  projectedRows: ReadonlySet<unknown>;
  projectedDasharray: string | number;
  material: LineMaterial;
  filterId: string;
  materialWidth: number | string;
}) {
  const paintRef = useRef<SVGGElement>(null);
  const points = props.points ?? [];
  const start = getProjectedStart(points, (point) =>
    projectedRows.has("payload" in point ? point.payload : undefined),
  );
  const hasProjectedValue = points
    .slice(start)
    .some((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const hasHistoricalValue = points
    .slice(0, start)
    .some((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const mixed = hasProjectedValue && hasHistoricalValue;
  const bounds = mixed
    ? getProjectionBounds(
        points,
        props.style?.strokeWidth ?? (material === "plain" ? props.strokeWidth : materialWidth),
        props.style?.strokeMiterlimit ?? props.strokeMiterlimit,
        materialWidth,
        material !== "plain",
      )
    : null;
  useLayoutEffect(() => {
    if (!bounds || !paintRef.current) return;
    for (const path of Array.from(paintRef.current.querySelectorAll("path.recharts-line-curve"))) {
      const style = getComputedStyle(path);
      const actualPadding =
        Number.parseFloat(style.strokeWidth) * Math.max(2, Number(style.strokeMiterlimit));
      if (!Number.isFinite(actualPadding) || actualPadding > bounds.strokePadding + 0.01) {
        throw new Error(
          "Projected LineSeries CSS stroke exceeds its declared numeric paint bounds; declare stroke metrics or use a custom shape",
        );
      }
      const filterUrl = /^url\((?:"([^"]+)"|'([^']+)'|([^)'"]+))\)$/.exec(style.filter);
      const url = filterUrl?.[1] ?? filterUrl?.[2] ?? filterUrl?.[3];
      const ownFilter =
        material !== "plain" &&
        url !== undefined &&
        ["historical", "projected"].some((part) => url.endsWith(`#${filterId}-${part}`));
      if (
        (style.filter && style.filter !== "none" && !ownFilter) ||
        (style.vectorEffect && style.vectorEffect !== "none") ||
        (style.transform && style.transform !== "none")
      ) {
        throw new Error(
          "Projected LineSeries requires a custom shape for external filters, transforms or non-scaling strokes",
        );
      }
    }
  });
  const render = (projected: boolean) => {
    const paint = {
      ...props,
      ...(projected ? { strokeDasharray: projectedDasharray } : {}),
    };
    if (material !== "plain") {
      return (
        <MaterialCurve
          {...paint}
          material={material}
          filterId={`${filterId}-${projected ? "projected" : "historical"}`}
          materialWidth={materialWidth}
        />
      );
    }
    if (props.pathRef) return <LineDrawShape {...paint} pathRef={props.pathRef} />;
    const {
      animationElapsedTime: _time,
      isAnimating: _active,
      isEntrance: _entrance,
      visibleLength: _length,
      ...native
    } = paint;
    return <Curve {...native} />;
  };
  if (!hasProjectedValue) return <g clipPath={clipPath}>{render(false)}</g>;
  if (!hasHistoricalValue)
    return (
      <g clipPath={clipPath} data-kind-ui="projected-line" data-projected="true">
        {render(true)}
      </g>
    );
  const seam = getProjectionClip(points, start, props.type, props.layout, props.connectNulls);
  if (!seam) return <g clipPath={clipPath}>{render(false)}</g>;
  if (!bounds) return null;
  if (
    (props.filter && props.filter !== "none") ||
    (props.style?.filter && props.style.filter !== "none") ||
    (props.transform && props.transform !== "none") ||
    (props.style?.transform && props.style.transform !== "none") ||
    (props.vectorEffect && props.vectorEffect !== "none") ||
    (props.style?.vectorEffect && props.style.vectorEffect !== "none")
  ) {
    throw new Error(
      "Projected LineSeries requires a custom shape for external filters, transforms or non-scaling strokes",
    );
  }
  const minX = Math.min(bounds.minX, seam.axis === "x" ? seam.boundary : bounds.minX);
  const minY = Math.min(bounds.minY, seam.axis === "y" ? seam.boundary : bounds.minY);
  const maxX = Math.max(bounds.maxX, seam.axis === "x" ? seam.boundary : bounds.maxX);
  const maxY = Math.max(bounds.maxY, seam.axis === "y" ? seam.boundary : bounds.maxY);
  const low =
    seam.axis === "x"
      ? { x: minX, y: minY, width: seam.boundary - minX, height: maxY - minY }
      : { x: minX, y: minY, width: maxX - minX, height: seam.boundary - minY };
  const high =
    seam.axis === "x"
      ? { x: seam.boundary, y: minY, width: maxX - seam.boundary, height: maxY - minY }
      : { x: minX, y: seam.boundary, width: maxX - minX, height: maxY - seam.boundary };
  const historical = seam.direction === 1 ? low : high;
  const projected = seam.direction === 1 ? high : low;
  return (
    <g ref={paintRef} data-kind-ui="projected-line" clipPath={clipPath}>
      <defs>
        <clipPath id={`${filterId}-historical-clip`} clipPathUnits="userSpaceOnUse">
          <rect {...historical} />
        </clipPath>
        <clipPath id={`${filterId}-projected-clip`} clipPathUnits="userSpaceOnUse">
          <rect {...projected} />
        </clipPath>
      </defs>
      <g data-projected="false" clipPath={`url(#${filterId}-historical-clip)`}>
        {render(false)}
      </g>
      <g data-projected="true" clipPath={`url(#${filterId}-projected-clip)`}>
        {render(true)}
      </g>
    </g>
  );
}
