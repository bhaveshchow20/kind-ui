"use client";

export type CartesianLoadingFamily =
  | "area"
  | "bar"
  | "combo"
  | "scatter"
  | "waterfall"
  | "histogram"
  | "box-plot";

const bars = [95, 145, 120, 185, 155, 210, 172];
const bins = [24, 53, 90, 137, 181, 208, 192, 158, 112, 69, 37, 17];
const points: readonly (readonly [number, number, number])[] = [
  [28, 198, 5],
  [62, 167, 7],
  [95, 184, 5],
  [126, 133, 9],
  [169, 158, 6],
  [196, 99, 7],
  [238, 126, 5],
  [276, 68, 8],
  [312, 107, 7],
  [352, 57, 6],
  [388, 86, 9],
  [430, 39, 6],
  [466, 67, 7],
  [507, 21, 5],
  [549, 53, 8],
  [585, 32, 6],
  [620, 72, 5],
];
const boxes: readonly (readonly [number, number, number, number, number, number])[] = [
  [60, 38, 88, 118, 148, 194],
  [184, 65, 112, 137, 164, 212],
  [308, 19, 56, 83, 115, 164],
  [432, 48, 91, 112, 137, 186],
  [556, 27, 65, 93, 118, 164],
];

/** Original bounded illustrations: seeded variation never reads consumer data or scales. */
export function CartesianLoadingDesign({
  family,
  seed,
}: {
  family: CartesianLoadingFamily;
  seed: number;
}) {
  const variation = (slot: number) => {
    const value = Math.sin(seed * 13.37 + slot * 7.91) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  };
  const heights = bars.map((height, index) =>
    Math.max(45, Math.min(220, height + variation(index) * 28)),
  );
  const areaCurve = `M 12 ${180 + variation(1) * 20} C 65 190 75 ${120 + variation(2) * 25} 125 ${125 + variation(2) * 25} S 215 ${72 + variation(3) * 25} 255 ${72 + variation(3) * 25} S 340 ${140 + variation(4) * 25} 375 ${140 + variation(4) * 25} S 450 ${45 + variation(5) * 20} 485 ${45 + variation(5) * 20} S 575 ${112 + variation(6) * 25} 628 ${90 + variation(7) * 25}`;
  if (family === "area")
    return (
      <path
        data-loading-motion="reveal"
        d={`${areaCurve} L 628 238 L 12 238 Z`}
        fill="currentColor"
      />
    );
  if (family === "bar")
    return (
      <g data-loading-motion="grow">
        {heights.map((height, index) => (
          <rect
            key={height}
            x={16 + index * 91}
            y={238 - height}
            width={60}
            height={height}
            rx={3}
            fill="currentColor"
          />
        ))}
      </g>
    );
  if (family === "combo")
    return (
      <>
        <g data-loading-motion="grow">
          {heights.map((height, index) => (
            <rect
              key={height}
              x={16 + index * 91}
              y={238 - height * 0.67}
              width={50}
              height={height * 0.67}
              rx={3}
              fill="currentColor"
              opacity={0.5}
            />
          ))}
        </g>
        <g data-loading-motion="reveal">
          <path d={`${areaCurve} L 628 238 L 12 238 Z`} fill="currentColor" opacity={0.22} />
          <path
            d={areaCurve}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />
        </g>
      </>
    );
  if (family === "scatter")
    return (
      <>
        {points.map(([cx, cy, r]) => (
          <circle
            key={cx}
            data-loading-motion="point"
            cx={cx + variation(cx) * 9}
            cy={cy + variation(cy) * 12}
            r={r}
            fill="currentColor"
          />
        ))}
      </>
    );
  if (family === "histogram")
    return (
      <g data-loading-motion="grow">
        {bins.map((height, index) => (
          <rect
            key={height}
            x={8 + index * 52}
            y={238 - Math.max(12, height + variation(index) * 13)}
            width={50}
            height={Math.max(12, height + variation(index) * 13)}
            fill="currentColor"
          />
        ))}
      </g>
    );
  if (family === "waterfall") {
    const tops = [164, 110, 144, 62, 100, 145].map((top, index) => top + variation(index) * 14);
    const levels = [238, ...tops, 238];
    return (
      <g data-loading-motion="grow">
        {levels.slice(1).map((top, index) => {
          const previous = levels[index] ?? 238;
          const x = 16 + index * 91;
          return (
            <g key={previous}>
              <rect
                x={x}
                y={Math.min(top, previous)}
                width={48}
                height={Math.abs(top - previous)}
                rx={2}
                fill="currentColor"
              />
              {index < 6 && (
                <path
                  d={`M ${x + 48} ${top} H ${x + 91}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </g>
          );
        })}
      </g>
    );
  }
  return (
    <g data-loading-motion="grow">
      {boxes.map(([x, low, q1, median, q3, high]) => (
        <g
          key={x}
          transform={`translate(0 ${variation(x) * 15})`}
          stroke="currentColor"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        >
          <path
            d={`M ${x} ${low} V ${q1} M ${x} ${q3} V ${high} M ${x - 18} ${low} H ${x + 18} M ${x - 18} ${high} H ${x + 18}`}
            fill="none"
          />
          <rect
            x={x - 27}
            y={q1}
            width={54}
            height={q3 - q1}
            fill="currentColor"
            fillOpacity={0.4}
            rx={2}
          />
          <path d={`M ${x - 27} ${median} H ${x + 27}`} fill="none" />
        </g>
      ))}
    </g>
  );
}
