"use client";

import { LoadingPulseMark } from "./loading-motion.js";

export type CartesianLoadingFamily =
  | "area"
  | "bar"
  | "combo"
  | "scatter"
  | "waterfall"
  | "histogram"
  | "box-plot";

const barProfiles = [
  [35, 64, 92, 128, 164, 188, 216],
  [211, 178, 154, 114, 82, 57, 30],
  [185, 74, 209, 47, 149, 91, 195],
  [38, 105, 173, 218, 154, 90, 32],
] as const;
const curveProfiles = [
  [208, 181, 142, 115, 88, 51, 27],
  [28, 52, 89, 116, 145, 180, 209],
  [39, 88, 172, 210, 168, 87, 35],
  [190, 51, 158, 33, 194, 74, 142],
] as const;
const waterfallProfiles = [
  [192, 131, 160, 70, 117, 48],
  [39, 109, 66, 161, 131, 204],
  [172, 41, 182, 64, 194, 106],
  [203, 162, 91, 145, 55, 83],
] as const;
const boxCenters = [
  [174, 144, 114, 84, 54],
  [55, 86, 117, 148, 179],
  [131, 75, 159, 92, 143],
  [86, 143, 61, 168, 111],
] as const;
const bound = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

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
  const profile = ((Math.trunc(seed) % 4) + 4) % 4;
  const heights = (barProfiles[profile] ?? barProfiles[0]).map((height, index) => ({
    x: 16 + index * 91,
    height: bound(height + variation(index) * 12, 20, 220),
  }));
  const ys = (curveProfiles[profile] ?? curveProfiles[0]).map((y, index) =>
    bound(y + variation(index + 20) * 10, 15, 220),
  );
  let areaCurve = `M 12 ${ys[0] ?? 120}`;
  for (let index = 1; index < ys.length; index++) {
    const x = 12 + index * (616 / 6);
    const previousX = 12 + (index - 1) * (616 / 6);
    areaCurve += ` C ${previousX + 51} ${ys[index - 1]} ${x - 51} ${ys[index]} ${x} ${ys[index]}`;
  }
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
        {heights.map(({ x, height }) => (
          <rect
            key={x}
            x={x}
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
          {heights.map(({ x, height }) => (
            <rect
              key={x}
              x={x}
              y={238 - height * 0.67}
              width={50}
              height={height * 0.67}
              rx={3}
              fill="currentColor"
              opacity={0.5}
            />
          ))}
        </g>
        <g>
          <path
            data-loading-motion="area-reveal"
            d={`${areaCurve} L 628 238 L 12 238 Z`}
            fill="currentColor"
            opacity={0.22}
          />
          <path
            data-loading-motion="reveal"
            d={areaCurve}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.25}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />
        </g>
      </>
    );
  if (family === "scatter") {
    const points = Array.from({ length: 24 }, (_, index) => {
      const u = (variation(index + 50) + 1) / 2;
      const v = (variation(index + 80) + 1) / 2;
      let cx: number;
      let cy: number;
      if (profile === 0 || profile === 1) {
        cx = 24 + index * 25;
        cy = profile === 0 ? 211 - index * 7.6 : 28 + index * 7.6;
        cy += variation(index + 110) * 24;
      } else if (profile === 2) {
        const cluster = index % 3;
        cx = [114, 328, 528][cluster] ?? 328;
        cy = [166, 62, 159][cluster] ?? 110;
        cx += (u - 0.5) * 126;
        cy += (v - 0.5) * 83;
      } else {
        cx = 22 + u * 596;
        cy = 18 + v * 204;
      }
      return {
        id: `point-${index}`,
        cx: bound(cx, 12, 628),
        cy: bound(cy, 12, 228),
        r: 4 + (variation(index + 140) + 1) * 3,
      };
    });
    return (
      <>
        {points.map(({ id, cx, cy, r }) => (
          <LoadingPulseMark key={id} delay={(cx / 640) * 0.65} span={0.35}>
            <circle data-loading-motion="point" cx={cx} cy={cy} r={r} fill="currentColor" />
          </LoadingPulseMark>
        ))}
      </>
    );
  }
  if (family === "histogram") {
    const gaussian = (x: number, peak: number, spread: number) =>
      Math.exp(-((x - peak) ** 2) / (2 * spread ** 2));
    const bins = Array.from({ length: 12 }, (_, index) => {
      const density =
        profile === 0
          ? gaussian(index, 2.5, 1.8)
          : profile === 1
            ? gaussian(index, 8.5, 1.8)
            : profile === 2
              ? Math.max(gaussian(index, 2, 1.15), gaussian(index, 8.5, 1.5))
              : index === 0
                ? 0.4
                : Math.exp(-(index - 1) / 3.8);
      return {
        x: 8 + index * 52,
        height: bound(18 + density * 194 + variation(index + 170) * 8, 10, 220),
      };
    });
    return (
      <g data-loading-motion="grow">
        {bins.map(({ x, height }) => (
          <rect key={x} x={x} y={238 - height} width={50} height={height} fill="currentColor" />
        ))}
      </g>
    );
  }
  if (family === "waterfall") {
    const tops = (waterfallProfiles[profile] ?? waterfallProfiles[0]).map((top, index) =>
      bound(top + variation(index + 200) * 9, 16, 220),
    );
    const levels = [238, ...tops, 238];
    return (
      <g data-loading-motion="grow">
        {levels.slice(1).map((top, index) => {
          const previous = levels[index] ?? 238;
          const x = 16 + index * 91;
          return (
            <g key={x}>
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
  const boxes = (boxCenters[profile] ?? boxCenters[0]).map((center, index) => {
    const median = center + variation(index + 230) * 9;
    const lowerSpan = 14 + (variation(index + 250) + 1) * 19;
    const upperSpan = 12 + (variation(index + 270) + 1) * 20;
    const q1 = bound(median - lowerSpan, 22, median - 6);
    const q3 = bound(median + upperSpan, median + 6, 216);
    const low = bound(q1 - 10 - (variation(index + 290) + 1) * 14, 10, q1 - 5);
    const high = bound(q3 + 10 + (variation(index + 310) + 1) * 14, q3 + 5, 230);
    return { x: 60 + index * 124, low, q1, median, q3, high };
  });
  return (
    <g data-loading-motion="grow">
      {boxes.map(({ x, low, q1, median, q3, high }) => (
        <g key={x} stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke">
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
