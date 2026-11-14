"use client";

import type { SVGProps } from "react";
import { Curve, LineDrawShape, type LineDrawShapeProps } from "recharts";
import { type LineMaterial, MaterialCurve } from "./line-material.js";

type Point = { x: number | null; y: number | null; payload?: unknown };

function splitInteractionProps<Props extends object>(props: Props) {
  const paint = { ...props } as Record<string, unknown>;
  const interaction: Record<string, unknown> = {};
  for (const key of Object.keys(paint)) {
    if (
      key === "role" ||
      key === "tabIndex" ||
      key === "focusable" ||
      key.startsWith("aria-") ||
      /^on[A-Z]/.test(key)
    ) {
      interaction[key] = paint[key];
      delete paint[key];
    }
  }
  return {
    interaction: interaction as SVGProps<SVGGElement>,
    paint: paint as Props,
  };
}

function getProjectionClip(
  points: readonly Point[],
  start: number,
  type: unknown,
  layout: unknown,
  connectNulls: boolean | undefined,
) {
  if (start <= 0 || start >= points.length) return null;
  if (layout !== undefined && layout !== "horizontal" && layout !== "vertical") {
    throw new Error("Projected LineSeries requires a horizontal or vertical Cartesian layout");
  }
  const axis = layout === "vertical" ? "y" : "x";
  const aligned = axis === "x" ? ["monotoneX", "bumpX"] : ["monotoneY", "bumpY"];
  const supported = [
    "linear",
    "monotone",
    "bump",
    "step",
    "stepBefore",
    "stepAfter",
    "basis",
    "basisOpen",
    "natural",
    ...aligned,
  ];
  if (typeof type === "string" && !supported.includes(type)) {
    throw new Error(
      "Projected LineSeries requires an open curve aligned with its category axis; use a custom shape for other interpolation modes",
    );
  }
  const coordinates = points
    .map((point) => point[axis])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const first = coordinates[0];
  const last = coordinates.at(-1);
  if (first === undefined || last === undefined || first === last) {
    throw new Error("Projected LineSeries requires distinct monotonic category coordinates");
  }
  const direction = last > first ? 1 : -1;
  if (
    coordinates.some(
      (value, index) => index > 0 && direction * (value - (coordinates[index - 1] as number)) <= 0,
    )
  ) {
    throw new Error(
      "Projected LineSeries requires distinct monotonic category coordinates; reordered numeric coordinates need a custom shape",
    );
  }
  let anchor = start - 1;
  if (connectNulls) {
    while (anchor >= 0) {
      const point = points[anchor];
      if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) break;
      anchor--;
    }
  }
  const boundary = points[anchor]?.[axis] ?? points[start]?.[axis];
  if (typeof boundary !== "number" || !Number.isFinite(boundary)) {
    throw new Error(
      "Projected LineSeries requires a finite category coordinate at the projection boundary",
    );
  }
  return { axis, boundary, direction };
}

/** Two paints of the complete native path; no point partition or spline recomputation. */
export function ProjectedCurve({
  projectedStart,
  projectedRows,
  projectedDasharray,
  material,
  filterId,
  materialWidth,
  clipPath,
  ...props
}: Omit<LineDrawShapeProps, "pathRef"> & {
  pathRef?: LineDrawShapeProps["pathRef"];
  projectedStart: number;
  projectedRows: ReadonlySet<unknown>;
  projectedDasharray: string | number;
  material: LineMaterial;
  filterId: string;
  materialWidth: number | string;
}) {
  const points = props.points ?? [];
  const projectionPoints = points as readonly Point[];
  let renderedProjectedStart = points.length;
  while (
    renderedProjectedStart > 0 &&
    projectedRows.has(projectionPoints[renderedProjectedStart - 1]?.payload)
  )
    renderedProjectedStart--;
  if (renderedProjectedStart === points.length)
    renderedProjectedStart = Math.min(projectedStart, points.length);
  const hasProjectedValue = points
    .slice(renderedProjectedStart)
    .some((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const hasHistoricalValue = points
    .slice(0, renderedProjectedStart)
    .some((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const mixed = hasProjectedValue && hasHistoricalValue;
  const render = (projected: boolean, base = props) => {
    const paint = {
      ...base,
      ...(mixed && projected && base.id ? { id: `${base.id}-projected` } : {}),
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
  const seam = getProjectionClip(
    projectionPoints,
    renderedProjectedStart,
    props.type,
    props.layout,
    props.connectNulls,
  );
  if (!seam) return <g clipPath={clipPath}>{render(false)}</g>;
  const extent =
    points.reduce(
      (largest, point) =>
        Math.max(
          largest,
          Number.isFinite(point.x) ? Math.abs(point.x as number) : 0,
          Number.isFinite(point.y) ? Math.abs(point.y as number) : 0,
        ),
      1,
    ) *
      1024 +
    1024;
  const low =
    seam.axis === "x"
      ? { x: -extent, y: -extent, width: seam.boundary + extent, height: extent * 2 }
      : { x: -extent, y: -extent, width: extent * 2, height: seam.boundary + extent };
  const high =
    seam.axis === "x"
      ? { x: seam.boundary, y: -extent, width: extent - seam.boundary, height: extent * 2 }
      : { x: -extent, y: seam.boundary, width: extent * 2, height: extent - seam.boundary };
  const historical = seam.direction === 1 ? low : high;
  const projected = seam.direction === 1 ? high : low;
  const { transform, style, ...untransformed } = props;
  const { transform: cssTransform, transformOrigin, transformBox, ...paintStyle } = style ?? {};
  const { interaction, paint } = splitInteractionProps({
    ...untransformed,
    ...(Object.keys(paintStyle).length > 0 ? { style: paintStyle } : {}),
  });
  const wrapperStyle =
    cssTransform === undefined && transformOrigin === undefined && transformBox === undefined
      ? undefined
      : { transform: cssTransform, transformOrigin, transformBox };
  return (
    <g
      {...interaction}
      data-kind-ui="projected-line"
      clipPath={clipPath}
      transform={transform}
      style={wrapperStyle}
    >
      <defs>
        <clipPath id={`${filterId}-historical-clip`} clipPathUnits="userSpaceOnUse">
          <rect {...historical} />
        </clipPath>
        <clipPath id={`${filterId}-projected-clip`} clipPathUnits="userSpaceOnUse">
          <rect {...projected} />
        </clipPath>
      </defs>
      <g data-projected="false" clipPath={`url(#${filterId}-historical-clip)`}>
        {render(false, paint)}
      </g>
      <g data-projected="true" clipPath={`url(#${filterId}-projected-clip)`}>
        {render(true, paint)}
      </g>
    </g>
  );
}
