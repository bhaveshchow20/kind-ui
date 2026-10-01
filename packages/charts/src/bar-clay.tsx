"use client";

/** Convex matte relief, lit from upper left; the native paint keeps its alpha. */
export function BarClay() {
  return (
    <>
      <feOffset in="SourceAlpha" dx={4} dy={4} result="lower" />
      <feComposite in="SourceAlpha" in2="lower" operator="arithmetic" k2={1} k3={-1} result="top" />
      <feGaussianBlur in="top" stdDeviation={2.7} result="softTop" />
      <feFlood
        floodColor="var(--kind-ui-bar-clay-light, #fff)"
        floodOpacity="var(--kind-ui-bar-clay-highlight, 0.48)"
      />
      <feComposite in2="softTop" operator="in" result="light" />
      <feOffset in="SourceAlpha" dx={-4} dy={-4} result="upper" />
      <feComposite
        in="SourceAlpha"
        in2="upper"
        operator="arithmetic"
        k2={1}
        k3={-1}
        result="bottom"
      />
      <feGaussianBlur in="bottom" stdDeviation={2.7} result="softBottom" />
      <feFlood
        floodColor="var(--kind-ui-bar-clay-shade, #17212b)"
        floodOpacity="var(--kind-ui-bar-clay-shadow, 0.26)"
      />
      <feComposite in2="softBottom" operator="in" result="shade" />
      <feComposite in="shade" in2="SourceGraphic" operator="atop" result="shaded" />
      <feComposite in="light" in2="shaded" operator="atop" result="body" />
      <feGaussianBlur in="SourceAlpha" stdDeviation={2.5} result="soft" />
      <feOffset in="soft" dx={1.5} dy={2.5} result="dropped" />
      <feFlood floodColor="var(--kind-ui-bar-clay-shade, #17212b)" floodOpacity={0.16} />
      <feComposite in2="dropped" operator="in" result="cast" />
      {/* Cast shade is exterior only, so translucent native paint does not get denser. */}
      <feComponentTransfer in="SourceAlpha" result="footprint">
        <feFuncA type="linear" slope={100000} />
      </feComponentTransfer>
      <feComposite in="cast" in2="footprint" operator="out" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="body" />
      </feMerge>
    </>
  );
}
