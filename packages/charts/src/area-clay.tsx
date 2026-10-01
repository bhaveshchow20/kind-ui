"use client";

/** Broad, soft inset relief for filled areas; paint remains inside native alpha. */
export function AreaClayRelief() {
  return (
    <>
      {/* Normalize the silhouette for relief, then mask it by the original opacity.
          This avoids tinting the entire body of translucent fills and gradients. */}
      <feComponentTransfer in="SourceAlpha" result="silhouette">
        <feFuncA type="linear" slope={100} />
      </feComponentTransfer>
      <feGaussianBlur in="silhouette" stdDeviation={3} result="rounded" />
      <feOffset in="rounded" dx={2} dy={6} result="lower" />
      <feComposite in="silhouette" in2="lower" operator="out" result="topRim" />
      <feComposite in="topRim" in2="SourceAlpha" operator="in" result="topPaint" />
      <feFlood
        floodColor="var(--kind-ui-area-clay-light, #fff)"
        floodOpacity="var(--kind-ui-area-clay-highlight, 0.9)"
      />
      <feComposite in2="topPaint" operator="in" result="light" />
      <feOffset in="rounded" dx={-2} dy={-7} result="upper" />
      <feComposite in="silhouette" in2="upper" operator="out" result="bottomRim" />
      <feComposite in="bottomRim" in2="SourceAlpha" operator="in" result="bottomPaint" />
      <feFlood
        floodColor="var(--kind-ui-area-clay-shade, #17212b)"
        floodOpacity="var(--kind-ui-area-clay-shadow, 0.65)"
      />
      <feComposite in2="bottomPaint" operator="in" result="shade" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="shade" />
        <feMergeNode in="light" />
      </feMerge>
    </>
  );
}
