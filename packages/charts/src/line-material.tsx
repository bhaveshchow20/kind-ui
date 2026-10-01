"use client";

import { Curve, type LineDrawShapeProps } from "recharts";

export type LineMaterial = "plain" | "paper" | "clay" | "glow";

/** Uses engine points only for filter bounds; Curve retains the original geometry and pathRef. */
export function MaterialCurve({
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
  material: Exclude<LineMaterial, "plain">;
  filterId: string;
  materialWidth: number | string;
}) {
  const points =
    props.points?.filter(
      (p): p is typeof p & { x: number; y: number } => Number.isFinite(p.x) && Number.isFinite(p.y),
    ) ?? [];
  if (!points.length) return <Curve {...props} strokeWidth={materialWidth} clipPath={clipPath} />;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  const width = Number(materialWidth);
  const pad = (Number.isFinite(width) ? width : 12) / 2 + 6;
  const x = minX - pad;
  const y = minY - pad;
  return (
    <g data-kind-ui="line-material" data-material={material} clipPath={clipPath}>
      <defs pointerEvents="none">
        <filter
          id={filterId}
          filterUnits="userSpaceOnUse"
          x={x}
          y={y}
          width={maxX - x + pad}
          height={maxY - y + pad}
          colorInterpolationFilters="sRGB"
        >
          {material === "paper" ? (
            <>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.7 0.25"
                numOctaves={1}
                seed={7}
                result="fiber"
              />
              <feFlood
                floodColor="var(--kind-ui-line-paper-fiber, #fff)"
                floodOpacity="var(--kind-ui-line-paper-grain, 0.38)"
              />
              <feComposite in2="fiber" operator="in" result="texture" />
              <feComposite in="texture" in2="SourceAlpha" operator="in" result="grain" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="grain" />
              </feMerge>
            </>
          ) : material === "glow" ? (
            <>
              <feGaussianBlur in="SourceGraphic" stdDeviation={2} result="halo" />
              <feComponentTransfer in="halo" result="softHalo">
                <feFuncA type="linear" slope="var(--kind-ui-line-glow-opacity, 0.35)" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="softHalo" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </>
          ) : (
            <>
              <feGaussianBlur in="SourceAlpha" stdDeviation={0.8} result="rounded" />
              <feSpecularLighting
                in="rounded"
                surfaceScale={1.5}
                specularConstant={0.4}
                specularExponent={8}
                lightingColor="var(--kind-ui-line-clay-light, #fff)"
                result="light"
              >
                <feDistantLight azimuth={225} elevation={45} />
              </feSpecularLighting>
              <feComposite in="light" in2="SourceAlpha" operator="in" result="bevel" />
              <feOffset in="SourceAlpha" dx={-0.6} dy={-1} result="offset" />
              <feComposite in="SourceAlpha" in2="offset" operator="out" result="edge" />
              <feFlood floodColor="var(--kind-ui-line-clay-shade, #17212b)" floodOpacity={0.16} />
              <feComposite in2="edge" operator="in" result="shade" />
              <feMerge result="body">
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="shade" />
              </feMerge>
              <feComposite
                in="body"
                in2="bevel"
                operator="arithmetic"
                k2={1}
                k3={0.7}
                result="lit"
              />
              <feOffset in="rounded" dx={0} dy={1.5} result="dropped" />
              <feFlood floodColor="var(--kind-ui-line-clay-shade, #17212b)" floodOpacity={0.16} />
              <feComposite in2="dropped" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="lit" />
              </feMerge>
            </>
          )}
        </filter>
      </defs>
      <Curve {...props} strokeWidth={materialWidth} filter={`url(#${filterId})`} />
    </g>
  );
}
