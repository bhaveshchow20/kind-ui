"use client";

/** Soft convex matte relief for filled areas; native body alpha is preserved. */
export function AreaClayRelief() {
  return (
    <>
      {/* Normalize the silhouette for relief, then mask it by the original opacity.
          This avoids tinting the entire body of translucent fills and gradients. */}
      <feComponentTransfer in="SourceAlpha" result="silhouette">
        <feFuncA type="linear" slope={1000} />
      </feComponentTransfer>
      <feGaussianBlur in="silhouette" stdDeviation={6} result="rounded" />
      <feDiffuseLighting
        in="rounded"
        surfaceScale={6}
        diffuseConstant={1.22}
        lightingColor="#fff"
        result="matteLight"
      >
        <feDistantLight azimuth={225} elevation={55} />
      </feDiffuseLighting>
      <feComposite
        in="SourceGraphic"
        in2="matteLight"
        operator="arithmetic"
        k1={0.35}
        k2={0.65}
        result="matteBody"
      />
      <feOffset in="rounded" dx={5} dy={7} result="lower" />
      <feComposite in="silhouette" in2="lower" operator="out" result="topRim" />
      <feComposite in="topRim" in2="SourceAlpha" operator="in" result="topPaint" />
      <feFlood
        floodColor="var(--kind-ui-area-clay-light, #fff)"
        floodOpacity="var(--kind-ui-area-clay-highlight, 0.48)"
      />
      <feComposite in2="topPaint" operator="in" result="light" />
      <feOffset in="rounded" dx={-6} dy={-8} result="upper" />
      <feComposite in="silhouette" in2="upper" operator="out" result="bottomRim" />
      <feComposite in="bottomRim" in2="SourceAlpha" operator="in" result="bottomPaint" />
      <feFlood
        floodColor="var(--kind-ui-area-clay-shade, #17212b)"
        floodOpacity="var(--kind-ui-area-clay-shadow, 0.28)"
      />
      <feComposite in2="bottomPaint" operator="in" result="shade" />
      <feComposite in="shade" in2="matteBody" operator="atop" result="shaded" />
      <feComposite in="light" in2="shaded" operator="atop" result="body" />
      {/* A small detached cast supplies depth, never opaque paint under the body. */}
      <feGaussianBlur in="SourceAlpha" stdDeviation={1.5} result="castBlur" />
      <feOffset in="castBlur" dx={1} dy={1.5} result="castOffset" />
      <feFlood
        floodColor="var(--kind-ui-area-clay-shade, #17212b)"
        floodOpacity="var(--kind-ui-area-clay-cast, 0.12)"
      />
      <feComposite in2="castOffset" operator="in" result="castPaint" />
      <feComposite in="castPaint" in2="silhouette" operator="out" result="cast" />
      <feMerge>
        <feMergeNode in="cast" />
        <feMergeNode in="body" />
      </feMerge>
    </>
  );
}
