"use client";

export type SankeyFinish = "plain" | "paper" | "clay" | "glow";

/** Sankey-local surface treatment. Never displace the quantitative silhouette. */
export function SankeyFinishFilter({
  id,
  finish,
  thickness,
  bounds,
}: {
  id: string;
  finish: Exclude<SankeyFinish, "plain">;
  thickness: number;
  bounds: {
    x: number | string;
    y: number | string;
    width: number | string;
    height: number | string;
  };
}) {
  const edge = Math.min(1.2, thickness / 6);
  const relief = Math.min(4, thickness / 4);
  const halo = Math.min(0.6, thickness / 8);
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      {...bounds}
      colorInterpolationFilters="sRGB"
    >
      <feComponentTransfer in="SourceAlpha" result="footprint">
        <feFuncA type="linear" slope={100000} />
      </feComponentTransfer>
      {finish === "clay" ? (
        <>
          <feOffset in="footprint" dx={relief} dy={relief} result="lower" />
          <feComposite
            in="footprint"
            in2="lower"
            operator="arithmetic"
            k2={1}
            k3={-1}
            result="top"
          />
          <feGaussianBlur in="top" stdDeviation={relief * 0.8} result="softTop" />
          <feFlood floodColor="#fff" floodOpacity={0.48} />
          <feComposite in2="softTop" operator="in" result="light" />
          <feOffset in="footprint" dx={-relief} dy={-relief} result="upper" />
          <feComposite
            in="footprint"
            in2="upper"
            operator="arithmetic"
            k2={1}
            k3={-1}
            result="bottom"
          />
          <feGaussianBlur in="bottom" stdDeviation={relief * 0.8} result="softBottom" />
          <feFlood floodColor="#17212b" floodOpacity={0.26} />
          <feComposite in2="softBottom" operator="in" result="shade" />
          <feComposite in="shade" in2="SourceGraphic" operator="atop" result="shaded" />
          <feComposite in="light" in2="shaded" operator="atop" result="body" />
        </>
      ) : (
        <>
          <feMorphology in="footprint" operator="erode" radius={edge} result="inside" />
          <feComposite in="footprint" in2="inside" operator="out" result="edge" />
          {finish === "paper" ? (
            <>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.08 0.2"
                numOctaves={1}
                seed={11}
                result="pencil"
              />
              <feColorMatrix in="pencil" type="luminanceToAlpha" result="pencilMask" />
              <feComponentTransfer in="pencilMask" result="sketch">
                <feFuncA type="linear" slope={1.6} intercept={-0.15} />
              </feComponentTransfer>
              <feComposite in="edge" in2="sketch" operator="in" result="sketchEdge" />
              <feFlood floodColor="#17212b" floodOpacity={0.5} />
              <feComposite in2="sketchEdge" operator="in" result="contour" />
              <feComposite in="contour" in2="SourceGraphic" operator="atop" result="body" />
            </>
          ) : (
            <>
              <feGaussianBlur in="edge" stdDeviation={edge} result="softEdge" />
              <feFlood floodColor="#fff" floodOpacity={0.8} />
              <feComposite in2="softEdge" operator="in" result="light" />
              <feComposite in="light" in2="SourceGraphic" operator="atop" result="body" />
            </>
          )}
        </>
      )}
      {finish !== "glow" ? (
        <>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65 0.3"
            numOctaves={1}
            seed={7}
            result="fiber"
          />
          <feFlood floodColor="#fff" floodOpacity={finish === "paper" ? 0.14 : 0.025} />
          <feComposite in2="fiber" operator="in" result="grain" />
          <feComposite in="grain" in2="body" operator="atop" />
        </>
      ) : (
        <>
          <feGaussianBlur in="SourceAlpha" stdDeviation={halo} result="blur" />
          <feComposite in="blur" in2="footprint" operator="out" result="exterior" />
          <feFlood floodColor="#fff" floodOpacity={0.12} />
          <feComposite in2="exterior" operator="in" result="halo" />
          <feMerge>
            <feMergeNode in="halo" />
            <feMergeNode in="body" />
          </feMerge>
        </>
      )}
    </filter>
  );
}
