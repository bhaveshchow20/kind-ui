import { LoadingPulseMark } from "../loading-motion.js";

type Tile = readonly [x: number, y: number, width: number, height: number];

// Decorative partitions only. Each new profile appears at the shared pulse's invisible seam.
const profiles: readonly (readonly Tile[])[] = [
  [
    [8, 8, 260, 130],
    [8, 144, 150, 88],
    [164, 144, 104, 88],
    [274, 8, 200, 92],
    [480, 8, 152, 92],
    [274, 106, 132, 126],
    [412, 106, 220, 126],
  ],
  [
    [8, 8, 210, 146],
    [8, 160, 118, 72],
    [132, 160, 86, 72],
    [224, 8, 230, 100],
    [460, 8, 172, 100],
    [224, 114, 136, 118],
    [366, 114, 134, 118],
    [506, 114, 126, 118],
  ],
  [
    [8, 8, 140, 92],
    [154, 8, 154, 92],
    [8, 106, 300, 126],
    [314, 8, 318, 120],
    [314, 134, 100, 98],
    [420, 134, 94, 98],
    [520, 134, 112, 98],
  ],
];

export function TreemapLoadingDesign({ seed }: { seed: number }) {
  const profile = seed % profiles.length;
  return (
    <g fill="currentColor" data-profile={profile}>
      {profiles[profile]?.map(([x, y, width, height]) => (
        <LoadingPulseMark
          key={`${x}:${y}`}
          delay={((x / 640 + y / 240) / 2) * (0.55 / 0.8)}
          span={0.25 / 0.8}
        >
          <rect x={x} y={y} width={width} height={height} rx="4" />
        </LoadingPulseMark>
      ))}
    </g>
  );
}
