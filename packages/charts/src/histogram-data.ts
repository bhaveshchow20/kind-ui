/** One pre-aggregated interval. Counts are nonnegative safe integers. */
export type HistogramBin = Readonly<{ lower: number; upper: number; count: number }>;
export type HistogramMeasure = "count" | "density";
export type HistogramBinningResult = Readonly<{
  bins: readonly HistogramBin[];
  accepted: number;
  missing: number;
  nonfinite: number;
  outOfRange: number;
}>;

/** Explicit edges only; no inferred domain, rounding, coercion or statistical estimator. */
export function binHistogram(
  samples: readonly (number | null | undefined)[],
  edges: readonly number[],
): HistogramBinningResult {
  if (edges.length < 2) throw new Error("Histogram requires at least two edges");
  const bins = edges.slice(0, -1).map((lower, index) => ({
    lower,
    upper: edges[index + 1] as number,
    count: 0,
  }));
  validateHistogram(bins);
  let accepted = 0;
  let missing = 0;
  let nonfinite = 0;
  let outOfRange = 0;
  const first = edges[0] as number;
  const last = edges[edges.length - 1] as number;
  for (const sample of samples) {
    if (sample == null) {
      missing++;
      continue;
    }
    if (typeof sample !== "number" || !Number.isFinite(sample)) {
      nonfinite++;
      continue;
    }
    if (sample < first || sample > last) {
      outOfRange++;
      continue;
    }
    // Upper-bound search assigns an interior edge to its right-hand bin.
    let low = 0;
    let high = edges.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (sample < (edges[middle] as number)) high = middle;
      else low = middle + 1;
    }
    const bin = bins[Math.min(low - 1, bins.length - 1)];
    if (bin) bin.count++;
    accepted++;
  }
  return { bins, accepted, missing, nonfinite, outOfRange };
}

export function validateHistogram(bins: readonly HistogramBin[]): number {
  let total = 0;
  let previousUpper: number | undefined;
  for (const bin of bins) {
    if (
      !Number.isFinite(bin.lower) ||
      !Number.isFinite(bin.upper) ||
      !(bin.upper > bin.lower) ||
      !Number.isFinite(bin.upper - bin.lower)
    )
      throw new Error("Histogram bounds must be finite with positive finite width");
    if (previousUpper !== undefined && bin.lower < previousUpper)
      throw new Error("Histogram bins must be ordered and nonoverlapping");
    if (!Number.isSafeInteger(bin.count) || bin.count < 0)
      throw new Error("Histogram counts must be nonnegative safe integers");
    total += bin.count;
    if (!Number.isSafeInteger(total)) throw new Error("Histogram total exceeds safe integer range");
    previousUpper = bin.upper;
  }
  return total;
}
