import type { ChartModel, Domain, InputPoint, NormalizeOptions } from "./types.js";

function resolvedDomain(
  values: readonly number[],
  explicit: Domain | undefined,
  time = false,
): Domain {
  if (explicit) {
    const [min, max] = explicit;
    if (
      explicit.length !== 2 ||
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min >= max ||
      !Number.isFinite(max - min)
    ) {
      throw new RangeError("An explicit domain must contain two finite, increasing values");
    }
    if (values.some((value) => value < min || value > max)) {
      throw new RangeError("Explicit domain excludes an observed or imputed value");
    }
    if (max - min < 1e-300)
      throw new RangeError("Domain range is too small for stable tick generation");
    if (
      time &&
      (!Number.isInteger(min) || !Number.isInteger(max) || min < -8.64e15 || max > 8.64e15)
    )
      throw new RangeError("Time domain exceeds valid Date range");
    return Object.freeze([min, max]);
  }
  if (values.length === 0) return Object.freeze([0, 1]);
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (min === max) {
    const padding = time ? 43_200_000 : Math.max(Math.abs(min) * 0.01, 1);
    const low = min - padding;
    const high = max + padding;
    // Keep even Number.MAX_VALUE finite without overflowing scale arithmetic.
    min = Number.isFinite(low) ? low : min;
    max = Number.isFinite(high) ? high : max;
  }
  if (!Number.isFinite(max - min) || max - min < 1e-300) {
    throw new RangeError("Domain range is too large or too small to represent safely");
  }
  if (time) {
    min = Math.max(-8.64e15, min);
    max = Math.min(8.64e15, max);
  }
  return Object.freeze([min, max]);
}

/** Validate once, preserve missingness, and resolve domains before rendering. */
export function normalizeSeries(
  input: readonly InputPoint[],
  options: NormalizeOptions,
): ChartModel {
  if (!["gap", "zero", "reject"].includes(options.missing)) {
    throw new TypeError("Choose a missing-value policy: gap, zero, or reject");
  }
  if (!["number", "time"].includes(options.x.kind))
    throw new TypeError("Choose a number or time x axis");
  if (
    (options.y.unit !== null && typeof options.y.unit !== "string") ||
    (options.x.kind === "number" && options.x.unit !== null && typeof options.x.unit !== "string")
  ) {
    throw new TypeError("Units must be explicit strings or null for unitless values");
  }
  if (options.x.kind === "time") {
    if (typeof options.x.timeZone !== "string" || options.x.timeZone.trim() === "")
      throw new TypeError("Time axes require an explicit timezone");
    // Fail at the semantic boundary rather than during a render.
    new Intl.DateTimeFormat("en-US", { timeZone: options.x.timeZone }).format(0);
  }
  const ids = new Set<string>();
  const points = input.map((point) => {
    if (point.id.trim() === "" || ids.has(point.id)) {
      throw new TypeError(`Point IDs must be nonempty and unique: ${point.id}`);
    }
    ids.add(point.id);
    if (
      !Number.isFinite(point.x) ||
      (options.x.kind === "time" && (!Number.isInteger(point.x) || Math.abs(point.x) > 8.64e15))
    ) {
      throw new TypeError(`Invalid x value for point ${point.id}`);
    }
    const missing = point.y === null || point.y === undefined;
    if ((!missing && !Number.isFinite(point.y)) || (missing && options.missing === "reject")) {
      throw new TypeError(`Invalid or rejected missing y value for point ${point.id}`);
    }
    const rawY = point.y ?? null;
    return Object.freeze({
      id: point.id,
      x: point.x,
      y: missing && options.missing === "zero" ? 0 : rawY,
      rawY,
      imputed: missing && options.missing === "zero",
      label: point.label ?? point.id,
    });
  });
  // Sorting never changes identity or mutates caller-owned data.
  points.sort((a, b) => a.x - b.x || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const yValues = points.flatMap((point) => (point.y === null ? [] : [point.y]));
  if (options.includeZero) yValues.push(0);
  return Object.freeze({
    points: Object.freeze(points),
    x: Object.freeze({ ...options.x }),
    y: Object.freeze({ ...options.y }),
    missing: options.missing,
    xDomain: resolvedDomain(
      points.map((point) => point.x),
      options.xDomain,
      options.x.kind === "time",
    ),
    yDomain: resolvedDomain(yValues, options.yDomain),
  });
}
