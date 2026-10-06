type Point = { x: number | null; y: number | null };
type Bounds = { minX: number; minY: number; maxX: number; maxY: number; strokePadding: number };
export type ProjectionClip = {
  axis: "x" | "y";
  boundary: number;
  direction: 1 | -1;
};

function numericPaint(value: unknown, fallback: number, name: string) {
  const number =
    value === undefined
      ? fallback
      : typeof value === "number"
        ? value
        : typeof value === "string" && /^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:px)?$/i.test(value)
          ? Number.parseFloat(value)
          : NaN;
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(
      `Projected LineSeries requires a finite numeric ${name}; use a custom shape for other paint bounds`,
    );
  }
  return number;
}

/** Known open curves stay within the engine points; caps, joins and material filters extend that box. */
export function getProjectionBounds(
  points: readonly Point[],
  strokeWidth: unknown,
  miterLimit: unknown,
  materialWidth: unknown,
  hasMaterial: boolean,
): Bounds {
  const width = numericPaint(strokeWidth, 1, "strokeWidth");
  const miter = numericPaint(miterLimit, 4, "strokeMiterlimit");
  const strokePadding = width * Math.max(2, miter);
  const filterPadding = hasMaterial
    ? numericPaint(Number(materialWidth), width, "material strokeWidth") / 2 + 6
    : 0;
  const padding = Math.max(strokePadding, filterPadding, 1);
  if (!Number.isFinite(padding))
    throw new Error("Projected LineSeries requires finite paint bounds; use a custom shape");
  const finite = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!finite.length) throw new Error("Projected LineSeries requires finite drawable points");
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of finite) {
    minX = Math.min(minX, point.x as number);
    minY = Math.min(minY, point.y as number);
    maxX = Math.max(maxX, point.x as number);
    maxY = Math.max(maxY, point.y as number);
  }
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    strokePadding,
  };
}

/** A half-plane paint seam is unambiguous only when category coordinates do not backtrack. */
export function getProjectionClip(
  points: readonly Point[],
  start: number,
  type: unknown,
  layout: unknown,
  connectNulls: boolean | undefined,
): ProjectionClip | null {
  if (start <= 0 || start >= points.length) return null;
  if (layout !== undefined && layout !== "horizontal" && layout !== "vertical") {
    throw new Error("Projected LineSeries requires a horizontal or vertical Cartesian layout");
  }
  const axis = layout === "vertical" ? "y" : "x";
  const aligned = axis === "x" ? ["monotoneX", "bumpX"] : ["monotoneY", "bumpY"];
  const supported = ["linear", "monotone", "bump", "step", "basis", "basisOpen", ...aligned];
  if (type !== undefined && (typeof type !== "string" || !supported.includes(type))) {
    throw new Error(
      "Projected LineSeries requires an open curve aligned with its category axis; use a custom shape for other interpolation modes",
    );
  }
  const coordinates = points
    .map((point) => point[axis])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const first = coordinates[0];
  const last = coordinates.at(-1);
  if (first === undefined || last === undefined || first === last) {
    throw new Error("Projected LineSeries requires distinct monotonic category coordinates");
  }
  const direction = last > first ? 1 : -1;
  if (
    coordinates.some(
      (value, index) => index > 0 && direction * (value - (coordinates[index - 1] as number)) <= 0,
    )
  ) {
    throw new Error(
      "Projected LineSeries requires distinct monotonic category coordinates; reordered numeric coordinates need a custom shape",
    );
  }
  let anchor = start - 1;
  if (connectNulls) {
    while (anchor >= 0) {
      const point = points[anchor];
      if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) break;
      anchor--;
    }
  }
  const boundary = points[anchor]?.[axis] ?? points[start]?.[axis];
  if (typeof boundary !== "number" || !Number.isFinite(boundary)) {
    throw new Error(
      "Projected LineSeries requires a finite category coordinate at the projection boundary",
    );
  }
  return { axis, boundary, direction };
}
