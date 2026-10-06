"use client";

import { Curve, type LineDrawShapeProps } from "recharts";
import { type LineMaterial, MaterialCurve } from "./line-material.js";
import { getProjectedStart } from "./line-projection.js";

/** Paint partitions of one native series; the engine still owns points, dots and identity. */
export function ProjectedCurve({
  projectedRows,
  projectedDasharray,
  material,
  filterId,
  materialWidth,
  animationElapsedTime: _time,
  isAnimating: _active,
  isEntrance: _entrance,
  visibleLength: _length,
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
  const points = props.points ?? [];
  const start = getProjectedStart(points, (point) =>
    projectedRows.has("payload" in point ? point.payload : undefined),
  );
  const render = (part: typeof points, projected: boolean, ref: typeof props.pathRef) => {
    const paint = {
      ...props,
      points: part,
      pathRef: ref,
      ...(projected ? { strokeDasharray: projectedDasharray } : {}),
    };
    return material === "plain" ? (
      <Curve {...paint} />
    ) : (
      <MaterialCurve
        {...paint}
        material={material}
        filterId={`${filterId}-${projected ? "projected" : "historical"}`}
        materialWidth={materialWidth}
      />
    );
  };
  if (start === points.length) return <g clipPath={clipPath}>{render(points, false, props.pathRef)}</g>;
  let anchor = start - 1;
  if (props.connectNulls) {
    while (anchor >= 0) {
      const point = points[anchor];
      if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) break;
      anchor--;
    }
  }
  return (
    <g data-kind-ui="projected-line" clipPath={clipPath}>
      {start > 0 && <g data-projected="false">{render(points.slice(0, start), false, props.pathRef)}</g>}
      <g data-projected="true">
        {render(points.slice(Math.max(0, anchor)), true, start > 0 ? undefined : props.pathRef)}
      </g>
    </g>
  );
}
