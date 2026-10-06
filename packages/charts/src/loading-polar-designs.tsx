// Fixed presentation geometry. These silhouettes never inspect chart rows or values.
export type PolarLoadingFamily = "pie" | "radar" | "radial-bar" | "activity-rings";

function point(radius: number, angle: number): [number, number] {
  const radians = (angle * Math.PI) / 180;
  return [320 + Math.cos(radians) * radius, 120 + Math.sin(radians) * radius];
}
function arc(radius: number, start: number, end: number) {
  const [sx, sy] = point(radius, start);
  const [ex, ey] = point(radius, end);
  return `M ${sx} ${sy} A ${radius} ${radius} 0 ${end - start > 180 ? 1 : 0} 1 ${ex} ${ey}`;
}
function polygon(radius: number) {
  return [-90, -30, 30, 90, 150, 210].map((angle) => point(radius, angle).join(",")).join(" ");
}

/** Rendered twice by the shared skeleton surface for the static silhouette and sweep. */
export function PolarLoadingDesign({
  family,
  seed = 0,
}: {
  family: PolarLoadingFamily;
  seed?: number;
}) {
  const variant = Math.abs(seed) % 3;
  const sectorSets = [
    [
      [-88, 24],
      [28, 146],
      [150, 208],
      [212, 268],
    ],
    [
      [-88, 68],
      [72, 156],
      [160, 220],
      [224, 268],
    ],
    [
      [-88, 4],
      [8, 116],
      [120, 212],
      [216, 268],
    ],
  ];
  if (family === "pie") {
    return (
      <g fill="currentColor">
        {(sectorSets[variant] ?? sectorSets[0] ?? []).map(([start = 0, end = 0]) => (
          <path key={start} d={`${arc(100, start, end)} L 320 120 Z`} />
        ))}
      </g>
    );
  }
  if (family === "radar") {
    return (
      <g
        data-kind-ui="loading-radar-motion"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      >
        {[34, 67, 100].map((radius) => (
          <polygon key={radius} points={polygon(radius)} opacity="0.4" />
        ))}
        {[-90, -30, 30, 90, 150, 210].map((angle) => {
          const [x, y] = point(100, angle);
          return <line key={angle} x1="320" y1="120" x2={x} y2={y} opacity="0.35" />;
        })}
        <polygon
          points={
            [
              "320,36 375,88 393,162 320,180 246,163 272,92",
              "320,59 392,78 370,149 320,208 260,155 256,83",
              "320,27 370,91 383,157 320,189 242,165 281,97",
            ][variant]
          }
          fill="currentColor"
          fillOpacity="0.25"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  const rings = family === "activity-rings" ? [91, 66, 41] : [97, 73, 49, 25];
  const ends =
    family === "activity-rings"
      ? [
          [205, 155, 260],
          [260, 110, 195],
          [175, 235, 125],
        ][variant]
      : [
          [175, 230, 110, 195],
          [225, 150, 250, 135],
          [120, 250, 180, 220],
        ][variant];
  return (
    <g fill="none" stroke="currentColor" strokeWidth={family === "activity-rings" ? 17 : 13}>
      {rings.map((radius, index) => (
        <g key={radius}>
          <circle cx="320" cy="120" r={radius} opacity="0.2" />
          <path d={arc(radius, -90, ends?.[index] ?? 180)} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}
