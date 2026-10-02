"use client";

import { type ComponentProps, useId } from "react";
import { Symbols } from "recharts";
import type { LineMaterial } from "./line-material.js";

export type ScatterMaterial = LineMaterial;

/** Finish only a native symbol. Quantitative path, paint alpha and point props survive. */
export function ScatterMaterialSymbol({
  material,
  ...props
}: ComponentProps<typeof Symbols> & { material: Exclude<ScatterMaterial, "plain"> }) {
  const generatedId = useId();
  const id = `kind-ui-scatter-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  // Do not compete with per-Cell paint pipelines or unresolved native geometry.
  if (
    props.filter !== undefined ||
    props.style?.filter !== undefined ||
    props.cx == null ||
    props.cy == null ||
    !Number.isFinite(props.size) ||
    (props.size ?? 0) <= 0
  )
    return <Symbols {...props} />;
  // No minimum pixel radius: effects shrink with small marks rather than enlarging them.
  const span = props.sizeType === "diameter" ? (props.size ?? 64) : Math.sqrt(props.size ?? 64);
  const rim = Math.min(0.9, span * 0.055);
  const relief = Math.min(3, span * 0.17);
  const soft = Math.min(2, span * 0.1);
  const halo = Math.min(1.8, span * 0.065);
  const stroke = Number(props.style?.strokeWidth ?? props.strokeWidth ?? 0);
  const extent = span * 3 + (Number.isFinite(stroke) ? Math.abs(stroke) : 0);
  return (
    <>
      <defs data-kind-ui="scatter-material" data-material={material} pointerEvents="none">
        {material === "glow" && (
          <>
            <clipPath id={`${id}-geometry`} clipPathUnits="userSpaceOnUse">
              {/* Native Symbols supplies the exact geometry, independently of transparent paint. */}
              <Symbols
                cx={props.cx}
                cy={props.cy}
                size={props.size ?? 64}
                {...(props.type !== undefined ? { type: props.type } : {})}
                {...(props.sizeType !== undefined ? { sizeType: props.sizeType } : {})}
                fill="#000"
                stroke="#000"
                strokeWidth={props.strokeWidth ?? 0}
              />
            </clipPath>
            <mask
              id={`${id}-outside`}
              maskUnits="userSpaceOnUse"
              x={(props.cx ?? 0) - extent}
              y={(props.cy ?? 0) - extent}
              width={extent * 2}
              height={extent * 2}
            >
              <rect
                x={(props.cx ?? 0) - extent}
                y={(props.cy ?? 0) - extent}
                width={extent * 2}
                height={extent * 2}
                fill="#fff"
              />
              <rect
                x={(props.cx ?? 0) - extent}
                y={(props.cy ?? 0) - extent}
                width={extent * 2}
                height={extent * 2}
                fill="#000"
                clipPath={`url(#${id}-geometry)`}
              />
            </mask>
            <filter
              id={`${id}-halo`}
              x={-1}
              y={-1}
              width={3}
              height={3}
              filterUnits="objectBoundingBox"
              primitiveUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feComponentTransfer in="SourceAlpha" result="painted">
                <feFuncA type="linear" slope={100000} />
              </feComponentTransfer>
              <feGaussianBlur in="SourceGraphic" stdDeviation={halo} result="halo" />
              <feFlood floodOpacity="var(--kind-ui-scatter-glow-opacity, 0.65)" result="strength" />
              <feComposite in="halo" in2="strength" operator="in" result="softHalo" />
              <feComposite in="softHalo" in2="painted" operator="out" />
            </filter>
          </>
        )}
        <filter
          id={id}
          x={-1}
          y={-1}
          width={3}
          height={3}
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feComponentTransfer in="SourceAlpha" result="footprint">
            <feFuncA type="linear" slope={100000} />
          </feComponentTransfer>
          {material === "paper" ? (
            <>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65 0.3"
                numOctaves={1}
                seed={7}
                result="fiber"
              />
              <feFlood
                floodColor="var(--kind-ui-scatter-paper-fiber, #fff)"
                floodOpacity="var(--kind-ui-scatter-paper-grain, 0.13)"
              />
              <feComposite in2="fiber" operator="in" result="texture" />
              <feComposite in="texture" in2="SourceGraphic" operator="atop" result="paper" />
              <feMorphology in="footprint" operator="erode" radius={rim} result="inside" />
              <feComposite in="footprint" in2="inside" operator="out" result="edge" />
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.13 0.22"
                numOctaves={1}
                seed={11}
                result="pencil"
              />
              <feColorMatrix in="pencil" type="luminanceToAlpha" result="pencilMask" />
              <feComponentTransfer in="pencilMask" result="sketch">
                <feFuncA type="linear" slope={2} intercept={-0.2} />
              </feComponentTransfer>
              <feComposite in="edge" in2="sketch" operator="in" result="sketchEdge" />
              <feColorMatrix
                in="SourceGraphic"
                type="matrix"
                values="0.25 0 0 0 0 0 0.25 0 0 0 0 0 0.25 0 0 0 0 0 1 0"
                result="ink"
              />
              <feComposite in="ink" in2="sketchEdge" operator="in" result="contour" />
              <feComposite in="contour" in2="paper" operator="atop" />
            </>
          ) : material === "clay" ? (
            <>
              <feOffset in="footprint" dx={relief} dy={relief} result="lower" />
              <feComposite in="footprint" in2="lower" operator="out" result="top" />
              <feGaussianBlur in="top" stdDeviation={soft} result="softTop" />
              <feFlood floodColor="var(--kind-ui-scatter-clay-light, #fff)" floodOpacity={0.62} />
              <feComposite in2="softTop" operator="in" result="light" />
              <feOffset in="footprint" dx={-relief} dy={-relief} result="upper" />
              <feComposite in="footprint" in2="upper" operator="out" result="bottom" />
              <feGaussianBlur in="bottom" stdDeviation={soft} result="softBottom" />
              <feFlood
                floodColor="var(--kind-ui-scatter-clay-shade, #17212b)"
                floodOpacity={0.38}
              />
              <feComposite in2="softBottom" operator="in" result="shade" />
              <feComposite in="shade" in2="SourceGraphic" operator="atop" result="shaded" />
              <feComposite in="light" in2="shaded" operator="atop" result="body" />
              <feTurbulence
                type="fractalNoise"
                baseFrequency={0.7}
                numOctaves={1}
                seed={17}
                result="grain"
              />
              <feFlood floodColor="#fff" floodOpacity={0.035} />
              <feComposite in2="grain" operator="in" result="texture" />
              <feComposite in="texture" in2="body" operator="atop" />
            </>
          ) : (
            <>
              <feMorphology in="footprint" operator="erode" radius={rim} result="inside" />
              <feComposite in="footprint" in2="inside" operator="out" result="edge" />
              <feFlood floodColor="var(--kind-ui-scatter-glow-light, #fff)" floodOpacity={0.55} />
              <feComposite in2="edge" operator="in" result="light" />
              <feComposite in="light" in2="SourceGraphic" operator="atop" result="body" />
              <feFlood
                floodColor="var(--kind-ui-scatter-glow-light, #fff)"
                floodOpacity={0.12}
                result="bloom"
              />
              <feComposite in="bloom" in2="body" operator="atop" result="luminousBody" />
            </>
          )}
        </filter>
      </defs>
      {material === "glow" ? (
        <>
          <use
            data-kind-ui="scatter-light"
            href={`#${id}-body`}
            filter={`url(#${id}-halo)`}
            mask={`url(#${id}-outside)`}
            pointerEvents="none"
            aria-hidden="true"
            focusable="false"
            tabIndex={-1}
          />
          <g id={`${id}-body`}>
            <Symbols {...props} filter={`url(#${id})`} />
          </g>
        </>
      ) : (
        <Symbols {...props} filter={`url(#${id})`} />
      )}
    </>
  );
}
