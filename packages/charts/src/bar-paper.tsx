"use client";

/** Uneven inset pencil contours, never displacement or an expanded quantitative mark. */
export function BarPaper() {
  return (
    <>
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.65 0.3"
        numOctaves={1}
        seed={7}
        result="fiber"
      />
      <feFlood
        floodColor="var(--kind-ui-bar-paper-fiber, #fff)"
        floodOpacity="var(--kind-ui-bar-paper-grain, 0.14)"
      />
      <feComposite in2="fiber" operator="in" result="texture" />
      <feComposite in="texture" in2="SourceGraphic" operator="atop" result="paper" />
      <feMorphology in="SourceAlpha" operator="erode" radius={1.2} result="inside" />
      <feComposite
        in="SourceAlpha"
        in2="inside"
        operator="arithmetic"
        k2={1}
        k3={-1}
        result="edge"
      />
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
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0.35 0 0 0 0 0 0.35 0 0 0 0 0 0.35 0 0 0 0 0 1 0"
        result="ink"
      />
      <feComposite in="ink" in2="sketchEdge" operator="in" result="contour" />
      <feComposite in="contour" in2="paper" operator="atop" />
    </>
  );
}
