import { type CandlestickViewport, getCandlestickVisiblePoints } from "./viewport.js";

export type CandlestickSpacing = "ordinal" | "elapsed";
export type CandlestickPriceScale = "linear" | "log";
export type CandlestickScalePoint = Readonly<{
  timeValue: number;
  gap: boolean;
  low?: number;
  high?: number;
}>;
export type CandlestickPriceDomainOptions = Readonly<{
  viewport?: CandlestickViewport;
  autoscale?: "visible" | "all";
  domain?: readonly [number, number];
  /** Fraction of the linear span, or log span in logarithmic mode, on each side. */
  padding?: number;
  scale?: CandlestickPriceScale;
  /** Validates observations; only computed padding is limited to these bounds. */
  bounds?: readonly [number, number];
  /** Caller-selected overlay observations that should contribute to the domain. */
  overlayValues?: readonly number[];
}>;

export function getCandlestickTimeCoordinate(
  point: Readonly<{ timeValue: number }>,
  index: number,
  spacing: CandlestickSpacing,
): number {
  if (spacing !== "ordinal" && spacing !== "elapsed") {
    throw new Error("Candlestick spacing must be ordinal or elapsed.");
  }
  return spacing === "ordinal" ? index : point.timeValue;
}

/** Invert native numeric coordinates without assuming equal elapsed intervals. */
export function getCandlestickLogicalCoordinate(
  points: readonly Readonly<{ timeValue: number }>[],
  coordinate: number,
  spacing: CandlestickSpacing,
): number {
  if (!Number.isFinite(coordinate)) throw new Error("Candlestick time coordinate must be finite.");
  if (spacing === "ordinal") return coordinate;
  if (spacing !== "elapsed") throw new Error("Candlestick spacing must be ordinal or elapsed.");
  const first = points[0];
  if (!first) return coordinate - 0.5;
  if (points.length === 1) return coordinate - first.timeValue;
  let from = 0;
  let to = points.length - 1;
  while (to - from > 1) {
    const middle = Math.floor((from + to) / 2);
    const point = points[middle];
    if (!point) break;
    if (point.timeValue <= coordinate) from = middle;
    else to = middle;
  }
  const left = points[from];
  const right = points[from + 1];
  if (!left || !right) return 0;
  return from + (coordinate - left.timeValue) / (right.timeValue - left.timeValue);
}

function logicalToElapsed(
  points: readonly Readonly<{ timeValue: number }>[],
  index: number,
): number {
  const first = points[0];
  if (!first) return index + 0.5;
  if (points.length === 1) return first.timeValue + index;
  const leftIndex = Math.max(0, Math.min(points.length - 2, Math.floor(index)));
  const left = points[leftIndex];
  const right = points[leftIndex + 1];
  if (!left || !right) return first.timeValue;
  return left.timeValue + (right.timeValue - left.timeValue) * (index - leftIndex);
}

/** Interpolate fractional windows and extrapolate endpoint half slots for elapsed time. */
export function getCandlestickTimeDomain(
  points: readonly Readonly<{ timeValue: number }>[],
  viewport: CandlestickViewport,
  spacing: CandlestickSpacing,
): [number, number] {
  if (
    !Number.isFinite(viewport.from) ||
    !Number.isFinite(viewport.to) ||
    viewport.from >= viewport.to
  ) {
    throw new Error("Candlestick viewport must have finite from < to logical coordinates.");
  }
  if (spacing === "ordinal") return [viewport.from, viewport.to];
  if (spacing !== "elapsed") throw new Error("Candlestick spacing must be ordinal or elapsed.");
  return [logicalToElapsed(points, viewport.from), logicalToElapsed(points, viewport.to)];
}

function validateDomain(domain: readonly [number, number], name: string): void {
  if (
    !Array.isArray(domain) ||
    domain.length !== 2 ||
    !Number.isFinite(domain[0]) ||
    !Number.isFinite(domain[1]) ||
    domain[0] >= domain[1]
  ) {
    throw new Error(`Candlestick ${name} must have finite minimum < maximum.`);
  }
}

export function getCandlestickPriceDomain<Point extends CandlestickScalePoint>(
  points: readonly Point[],
  options: CandlestickPriceDomainOptions = {},
): [number, number] {
  const scale = options.scale ?? "linear";
  const padding = options.padding ?? 0.05;
  if (scale !== "linear" && scale !== "log") {
    throw new Error("Candlestick price scale must be linear or log.");
  }
  if (
    options.autoscale !== undefined &&
    options.autoscale !== "visible" &&
    options.autoscale !== "all"
  ) {
    throw new Error("Candlestick autoscale must be visible or all.");
  }
  if (!Number.isFinite(padding) || padding < 0) {
    throw new Error("Candlestick price padding must be finite and nonnegative.");
  }
  if (options.domain !== undefined) validateDomain(options.domain, "price domain");
  if (options.bounds !== undefined) validateDomain(options.bounds, "price bounds");
  if (
    scale === "log" &&
    ((options.domain !== undefined && options.domain[0] <= 0) ||
      (options.bounds !== undefined && options.bounds[0] <= 0))
  ) {
    throw new Error("Candlestick logarithmic domain and bounds must be positive.");
  }
  const validateValue = (value: number, path: string): void => {
    if (!Number.isFinite(value)) throw new Error(`Candlestick ${path} must be finite.`);
    if (scale === "log" && value <= 0)
      throw new Error(`Candlestick ${path} must be positive for logarithmic scale.`);
    if (options.bounds !== undefined && (value < options.bounds[0] || value > options.bounds[1])) {
      throw new Error(`Candlestick ${path} is outside price bounds.`);
    }
  };
  points.forEach((point, index) => {
    if (point.gap) return;
    if (point.low !== undefined) validateValue(point.low, `data[${index}].low`);
    if (point.high !== undefined) validateValue(point.high, `data[${index}].high`);
  });
  options.overlayValues?.forEach((value, index) => {
    validateValue(value, `overlayValues[${index}]`);
  });
  if (options.domain !== undefined) {
    if (
      options.bounds !== undefined &&
      (options.domain[0] < options.bounds[0] || options.domain[1] > options.bounds[1])
    ) {
      throw new Error("Candlestick price domain is outside price bounds.");
    }
    return [options.domain[0], options.domain[1]];
  }
  const visible =
    options.viewport && options.autoscale !== "all"
      ? getCandlestickVisiblePoints(points, options.viewport)
      : points;
  let low = Infinity;
  let high = -Infinity;
  const include = (value: number): void => {
    low = Math.min(low, value);
    high = Math.max(high, value);
  };
  for (const point of visible) {
    if (point.gap) continue;
    if (point.low !== undefined) include(point.low);
    if (point.high !== undefined) include(point.high);
  }
  for (const value of options.overlayValues ?? []) include(value);
  if (low === Infinity)
    return options.bounds !== undefined
      ? [options.bounds[0], options.bounds[1]]
      : scale === "log"
        ? [1, 10]
        : [0, 1];
  if (scale === "log") {
    const logLow = Math.log(low);
    const logHigh = Math.log(high);
    const span = logHigh - logLow;
    const amount = span === 0 ? Math.log(1.01) : span * padding;
    low = Math.exp(logLow - amount);
    high = Math.exp(logHigh + amount);
  } else {
    const span = high - low;
    const amount = span === 0 ? Math.max(Math.abs(low) * 0.01, 0.01) : span * padding;
    low -= amount;
    high += amount;
  }
  if (options.bounds !== undefined) {
    low = Math.max(options.bounds[0], low);
    high = Math.min(options.bounds[1], high);
  }
  validateDomain([low, high], "computed price domain");
  if (scale === "log" && low <= 0)
    throw new Error(
      "Candlestick computed logarithmic domain must remain positive; reduce padding.",
    );
  return [low, high];
}
