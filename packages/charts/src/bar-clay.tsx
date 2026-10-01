"use client";

/** Convex matte relief, lit from upper left; the native paint keeps its alpha. */
export function BarClay({ horizontal }: { horizontal: boolean }) {
  return (
    <>
      {/* A silhouette keeps the same surface light at any fill opacity. */}
      <feComponentTransfer in="SourceAlpha" result="footprint">
        <feFuncA type="linear" slope={100000} />
      </feComponentTransfer>
      <feOffset in="footprint" dx={horizontal ? 2 : 4} dy={horizontal ? 4 : 2} result="lower" />
      <feComposite in="footprint" in2="lower" operator="arithmetic" k2={1} k3={-1} result="top" />
      <feGaussianBlur in="top" stdDeviation={horizontal ? "2.7 3.2" : "3.2 2.7"} result="softTop" />
      <feFlood
        floodColor="var(--kind-ui-bar-clay-light, #fff)"
        floodOpacity="var(--kind-ui-bar-clay-highlight, 0.48)"
      />
      <feComposite in2="softTop" operator="in" result="light" />
      <feOffset in="footprint" dx={horizontal ? -2 : -4} dy={horizontal ? -4 : -2} result="upper" />
      <feComposite
        in="footprint"
        in2="upper"
        operator="arithmetic"
        k2={1}
        k3={-1}
        result="bottom"
      />
      <feGaussianBlur
        in="bottom"
        stdDeviation={horizontal ? "2.7 3.2" : "3.2 2.7"}
        result="softBottom"
      />
      <feFlood
        floodColor="var(--kind-ui-bar-clay-shade, #17212b)"
        floodOpacity="var(--kind-ui-bar-clay-shadow, 0.26)"
      />
      <feComposite in2="softBottom" operator="in" result="shade" />
      <feComposite in="shade" in2="SourceGraphic" operator="atop" result="shaded" />
      <feComposite in="light" in2="shaded" operator="atop" result="body" />
      {/* A quiet static microtexture keeps the broad surface matte. */}
      <feTurbulence
        type="fractalNoise"
        baseFrequency={0.7}
        numOctaves={1}
        seed={17}
        result="grain"
      />
      <feFlood floodColor="var(--kind-ui-bar-clay-light, #fff)" floodOpacity={0.025} />
      <feComposite in2="grain" operator="in" result="texture" />
      <feComposite in="texture" in2="body" operator="atop" result="matte" />
      {/* Cast across the category axis: no extension of value length or dark stack seam. */}
      <feGaussianBlur
        in="SourceAlpha"
        stdDeviation={horizontal ? "0 2.5" : "2.5 0"}
        result="soft"
      />
      <feOffset in="soft" dx={horizontal ? 0 : 1.5} dy={horizontal ? 1.5 : 0} result="dropped" />
      <feFlood floodColor="var(--kind-ui-bar-clay-shade, #17212b)" floodOpacity={0.16} />
      <feComposite in2="dropped" operator="in" result="cast" />
      {/* Cast shade is exterior only, so translucent native paint does not get denser. */}
      <feComposite in="cast" in2="footprint" operator="out" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="matte" />
      </feMerge>
    </>
  );
}
