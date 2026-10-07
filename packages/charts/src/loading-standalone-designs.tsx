import { LoadingPulseFlow, LoadingPulseMark } from "./loading-motion.js";

// Authored clustered, diagonal, paired-hotspot and striped illustrations.
const heatmapPatterns = [
  [
    9, 9, 7, 2, 1, 1, 1, 2, 9, 8, 6, 2, 1, 1, 2, 1, 7, 6, 4, 2, 1, 2, 1, 1, 2, 2, 1, 1, 2, 1, 1, 1,
    1, 1, 1, 2, 1, 1, 2, 1,
  ],
  [
    9, 7, 2, 1, 1, 1, 1, 1, 2, 8, 9, 6, 1, 1, 1, 1, 1, 1, 3, 9, 8, 3, 1, 1, 1, 1, 1, 1, 5, 9, 7, 2,
    1, 1, 1, 1, 1, 2, 7, 9,
  ],
  [
    1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 5, 3, 1, 1, 4, 7, 5, 6, 9, 8, 2, 2, 8, 9, 8,
    4, 8, 6, 1, 1, 6, 8, 5,
  ],
  [
    1, 8, 9, 1, 2, 1, 8, 9, 2, 7, 9, 1, 1, 1, 9, 7, 1, 9, 8, 2, 1, 2, 7, 9, 1, 8, 9, 1, 1, 1, 9, 8,
    2, 9, 7, 1, 2, 1, 8, 9,
  ],
] as const;

type NodeIllustration = readonly [x: number, y: number, width: number, height: number];
type FlowIllustration = readonly [x0: number, y0: number, x1: number, y1: number, width: number];
// Each flow width is conserved at its node junctions. These are decorative authored layouts.
const sankeyProfiles: readonly {
  nodes: readonly NodeIllustration[];
  flows: readonly FlowIllustration[];
}[] = [
  {
    nodes: [
      [16, 20, 16, 60],
      [16, 100, 16, 50],
      [16, 170, 16, 50],
      [298, 35, 24, 90],
      [298, 145, 24, 70],
      [608, 20, 16, 50],
      [608, 95, 16, 40],
      [608, 155, 16, 70],
    ],
    flows: [
      [32, 20, 298, 35, 60],
      [32, 100, 298, 95, 30],
      [32, 130, 298, 145, 20],
      [32, 170, 298, 165, 50],
      [322, 35, 608, 20, 50],
      [322, 85, 608, 95, 40],
      [322, 145, 608, 155, 70],
    ],
  },
  {
    nodes: [
      [16, 20, 16, 100],
      [16, 140, 16, 80],
      [298, 20, 24, 50],
      [298, 90, 24, 60],
      [298, 170, 24, 70],
      [608, 25, 16, 100],
      [608, 145, 16, 80],
    ],
    flows: [
      [32, 20, 298, 20, 50],
      [32, 70, 298, 90, 50],
      [32, 140, 298, 140, 10],
      [32, 150, 298, 170, 70],
      [322, 20, 608, 25, 50],
      [322, 90, 608, 75, 50],
      [322, 140, 608, 145, 10],
      [322, 170, 608, 155, 70],
    ],
  },
  {
    nodes: [
      [16, 32, 16, 176],
      [298, 12, 24, 64],
      [298, 96, 24, 46],
      [298, 162, 24, 66],
      [608, 20, 16, 110],
      [608, 154, 16, 66],
    ],
    flows: [
      [32, 32, 298, 12, 64],
      [32, 96, 298, 96, 46],
      [32, 142, 298, 162, 66],
      [322, 12, 608, 20, 64],
      [322, 96, 608, 84, 46],
      [322, 162, 608, 154, 66],
    ],
  },
  {
    nodes: [
      [16, 12, 16, 30],
      [16, 58, 16, 40],
      [16, 114, 16, 50],
      [16, 174, 16, 60],
      [608, 20, 16, 60],
      [608, 102, 16, 55],
      [608, 174, 16, 65],
    ],
    flows: [
      [32, 12, 608, 20, 30],
      [32, 58, 608, 50, 30],
      [32, 88, 608, 102, 10],
      [32, 114, 608, 112, 45],
      [32, 159, 608, 174, 5],
      [32, 174, 608, 179, 60],
    ],
  },
];

/** Fixed illustrations; no user cells, flows, values, or native marks are sampled. */
export function StandaloneLoadingDesign({
  family,
  seed,
}: {
  family: "heatmap" | "sankey";
  seed: number;
}) {
  const profile = seed % 4;
  if (family === "heatmap") {
    return (
      <g fill="currentColor" data-profile={profile}>
        {heatmapPatterns[profile]?.map((intensity, index) => {
          const row = Math.floor(index / 8);
          const column = index % 8;
          return (
            <LoadingPulseMark
              key={`${row}-${column}`}
              delay={((row + column) / 11) * (0.55 / 0.8)}
              span={0.25 / 0.8}
            >
              <rect
                data-motion="heatmap-cell"
                x={16 + column * 77}
                y={10 + row * 45}
                width="69"
                height="37"
                rx="3"
                opacity={0.2 + (intensity / 9) * 0.8}
              />
            </LoadingPulseMark>
          );
        })}
      </g>
    );
  }
  const design = sankeyProfiles[profile];
  if (!design) return null;
  const band = ([x0, y0, x1, y1, width]: FlowIllustration) => {
    const middle = (x0 + x1) / 2;
    return `M ${x0} ${y0} C ${middle} ${y0} ${middle} ${y1} ${x1} ${y1} L ${x1} ${y1 + width} C ${middle} ${y1 + width} ${middle} ${y0 + width} ${x0} ${y0 + width} Z`;
  };
  const flow = ([x0, y0, x1, y1, width]: FlowIllustration) => {
    const middle = (x0 + x1) / 2;
    return `M ${x0} ${y0 + width / 2} C ${middle} ${y0 + width / 2} ${middle} ${y1 + width / 2} ${x1} ${y1 + width / 2}`;
  };
  return (
    <g fill="currentColor" data-profile={profile}>
      {design.flows.map((item) => (
        <LoadingPulseFlow
          key={item.join("-")}
          d={flow(item)}
          width={item[4]}
          delay={(item[0] / 640) * 0.55}
        >
          <path d={band(item)} opacity="0.5" />
          <path
            data-motion="sankey-flow"
            d={flow(item)}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.55"
          />
        </LoadingPulseFlow>
      ))}
      {design.nodes.map(([x, y, width, height]) => (
        <LoadingPulseMark key={`${x}-${y}`} delay={(x / 640) * 0.55} span={0.45}>
          <rect x={x} y={y} width={width} height={height} rx="2" />
        </LoadingPulseMark>
      ))}
    </g>
  );
}
