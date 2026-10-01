"use client";

/** Raised inset relief. Every lighting pass is atop native paint to retain its alpha. */
export function BarClay() {
  return (
    <>
      <feMorphology in="SourceAlpha" operator="erode" radius={4} result="inner" />
      <feComposite in="SourceAlpha" in2="inner" operator="arithmetic" k2={1} k3={-1} result="rim" />
      <feGaussianBlur in="SourceAlpha" stdDeviation={1.2} result="soft" />
      <feSpecularLighting
        in="soft"
        surfaceScale={7}
        specularConstant={0.9}
        specularExponent={12}
        lightingColor="var(--kind-ui-bar-clay-light, #fff)"
        result="specular"
      >
        <feDistantLight azimuth={225} elevation={50} />
      </feSpecularLighting>
      <feComposite in="specular" in2="rim" operator="in" result="bevel" />
      <feOffset in="SourceAlpha" dx={3} dy={3} result="lower" />
      <feComposite
        in="SourceAlpha"
        in2="lower"
        operator="arithmetic"
        k2={1}
        k3={-1}
        result="topEdge"
      />
      <feGaussianBlur in="topEdge" stdDeviation={0.7} result="softTop" />
      <feFlood
        floodColor="var(--kind-ui-bar-clay-light, #fff)"
        floodOpacity="var(--kind-ui-bar-clay-highlight, 0.8)"
      />
      <feComposite in2="softTop" operator="in" result="light" />
      <feOffset in="SourceAlpha" dx={-3} dy={-3} result="upper" />
      <feComposite
        in="SourceAlpha"
        in2="upper"
        operator="arithmetic"
        k2={1}
        k3={-1}
        result="bottomEdge"
      />
      <feGaussianBlur in="bottomEdge" stdDeviation={0.9} result="softBottom" />
      <feFlood
        floodColor="var(--kind-ui-bar-clay-shade, #17212b)"
        floodOpacity="var(--kind-ui-bar-clay-shadow, 0.55)"
      />
      <feComposite in2="softBottom" operator="in" result="shade" />
      <feComposite in="shade" in2="SourceGraphic" operator="atop" result="shaded" />
      <feComposite in="light" in2="shaded" operator="atop" result="raised" />
      <feComposite in="bevel" in2="raised" operator="atop" />
    </>
  );
}
