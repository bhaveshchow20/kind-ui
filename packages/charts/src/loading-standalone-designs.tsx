import type { CSSProperties } from "react";

/** Fixed illustrations; no user cells, flows, values, or native marks are sampled. */
export function StandaloneLoadingDesign({
  family,
  seed,
}: {
  family: "heatmap" | "sankey";
  seed: number;
}) {
  if (family === "heatmap") {
    return (
      <g fill="currentColor">
        {Array.from({ length: 40 }, (_, index) => {
          const row = Math.floor(index / 8);
          const column = index % 8;
          return (
            <rect
              key={`${row}-${column}`}
              data-motion="heatmap-cell"
              style={{ "--kind-ui-loading-delay": `${(row + column) * 42}ms` } as CSSProperties}
              x={16 + column * 77}
              y={10 + row * 45}
              width="69"
              height="37"
              rx="3"
              opacity={0.38 + ((row * 3 + column * 5 + seed) % 7) * 0.09}
            />
          );
        })}
      </g>
    );
  }
  const firstTop = 30 + (seed % 5) * 5;
  const split = 106 + (seed % 4) * 4;
  const bottom = 184 + (seed % 3) * 6;
  const band = (
    x0: number,
    top0: number,
    bottom0: number,
    x1: number,
    top1: number,
    bottom1: number,
  ) => {
    const middle = (x0 + x1) / 2;
    return `M ${x0} ${top0} C ${middle} ${top0} ${middle} ${top1} ${x1} ${top1} L ${x1} ${bottom1} C ${middle} ${bottom1} ${middle} ${bottom0} ${x0} ${bottom0} Z`;
  };
  const flow = (x0: number, y0: number, x1: number, y1: number) => {
    const middle = (x0 + x1) / 2;
    return `M ${x0} ${y0} C ${middle} ${y0} ${middle} ${y1} ${x1} ${y1}`;
  };
  return (
    <g fill="currentColor">
      <g opacity="0.5">
        <path d={band(32, 26, 91, 298, firstTop, firstTop + 47)} />
        <path d={band(32, 106, 164, 298, split + 26, bottom)} />
        <path d={band(32, 178, 220, 298, split, split + 26)} />
        <path d={band(322, firstTop, firstTop + 47, 608, 22, 100)} />
        <path d={band(322, split, split + 26, 608, 113, 152)} />
        <path d={band(322, split + 26, bottom, 608, 164, 218)} />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path data-motion="sankey-flow" d={flow(32, 58.5, 298, firstTop + 23.5)} />
        <path data-motion="sankey-flow" d={flow(32, 135, 298, (split + 26 + bottom) / 2)} />
        <path data-motion="sankey-flow" d={flow(32, 199, 298, split + 13)} />
        <path data-motion="sankey-flow" d={flow(322, firstTop + 23.5, 608, 61)} />
        <path data-motion="sankey-flow" d={flow(322, split + 13, 608, 132.5)} />
        <path data-motion="sankey-flow" d={flow(322, (split + 26 + bottom) / 2, 608, 191)} />
      </g>
      <rect x="16" y="26" width="16" height="65" rx="2" />
      <rect x="16" y="106" width="16" height="58" rx="2" />
      <rect x="16" y="178" width="16" height="42" rx="2" />
      <rect x="298" y={firstTop} width="24" height="47" rx="2" />
      <rect x="298" y={split} width="24" height={bottom - split} rx="2" />
      <rect x="608" y="22" width="16" height="78" rx="2" />
      <rect x="608" y="113" width="16" height="39" rx="2" />
      <rect x="608" y="164" width="16" height="54" rx="2" />
    </g>
  );
}
