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
  if (!Array.isArray(samples)) throw new Error("Histogram samples must be an array");
  if (!Array.isArray(edges)) throw new Error("Histogram edges must be an array");
  if (edges.length < 2) throw new Error("Histogram requires at least two edges");
  for (const [index, edge] of edges.entries()) {
    if (typeof edge !== "number" || !Number.isFinite(edge))
      throw new Error(`Histogram edges[${index}] must be a finite number`);
  }
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
  if (!Array.isArray(bins)) throw new Error("Histogram bins must be an array");
  let total = 0;
  let previousUpper: number | undefined;
  for (const [index, bin] of bins.entries()) {
    const path = `Histogram bins[${index}]`;
    if (bin === null || typeof bin !== "object" || Array.isArray(bin))
      throw new Error(`${path} must be a bin object`);
    if (
      !Number.isFinite(bin.lower) ||
      !Number.isFinite(bin.upper) ||
      !(bin.upper > bin.lower) ||
      !Number.isFinite(bin.upper - bin.lower)
    )
      throw new Error(`${path}.lower/upper bounds must be finite with positive finite width`);
    if (previousUpper !== undefined && bin.lower < previousUpper)
      throw new Error(`${path}.lower must be ordered and nonoverlapping with the previous bin`);
    if (!Number.isSafeInteger(bin.count) || bin.count < 0)
      throw new Error(`${path}.count must be a nonnegative safe integer`);
    total += bin.count;
    if (!Number.isSafeInteger(total))
      throw new Error(`${path}.count causes the total to exceed safe integer range`);
    previousUpper = bin.upper;
  }
  return total;
}
