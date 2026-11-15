/** Fractional inclusive logical coordinates. A fitted series spans -0.5 to count - 0.5. */
export type CandlestickViewport = Readonly<{ from: number; to: number }>;
export type CandlestickViewportReason = "pan" | "zoom" | "reset" | "data" | "keyboard";
export type CandlestickViewportIdentity = Readonly<{ identity: string }>;

function validateCount(count: number): void {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("Candlestick point count must be a nonnegative safe integer.");
  }
}

function validateViewport(viewport: CandlestickViewport): void {
  if (
    !viewport ||
    !Number.isFinite(viewport.from) ||
    !Number.isFinite(viewport.to) ||
    viewport.to <= viewport.from ||
    !Number.isFinite(viewport.to - viewport.from)
  ) {
    throw new Error("Candlestick viewport must have finite from < to logical coordinates.");
  }
}

export function fitCandlestickViewport(count: number): CandlestickViewport {
  validateCount(count);
  return { from: -0.5, to: Math.max(count, 1) - 0.5 };
}

/** Clamp the window to available history while retaining its span where possible. */
export function normalizeCandlestickViewport(
  viewport: CandlestickViewport,
  count: number,
): CandlestickViewport {
  validateViewport(viewport);
  validateCount(count);
  const fitted = fitCandlestickViewport(count);
  const span = Math.min(viewport.to - viewport.from, Math.max(count, 1));
  const from = Math.max(fitted.from, Math.min(viewport.from, fitted.to - span));
  return { from, to: from + span };
}

export function panCandlestickViewport(
  viewport: CandlestickViewport,
  delta: number,
  count: number,
): CandlestickViewport {
  validateViewport(viewport);
  if (!Number.isFinite(delta)) throw new Error("Candlestick pan delta must be finite.");
  return normalizeCandlestickViewport(
    { from: viewport.from + delta, to: viewport.to + delta },
    count,
  );
}

/** factor > 1 zooms in; anchor is a logical coordinate, normally under the pointer. */
export function zoomCandlestickViewport(
  viewport: CandlestickViewport,
  factor: number,
  anchor: number,
  count: number,
): CandlestickViewport {
  const current = normalizeCandlestickViewport(viewport, count);
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new Error("Candlestick zoom factor must be finite and positive.");
  }
  if (!Number.isFinite(anchor)) throw new Error("Candlestick zoom anchor must be finite.");
  const oldSpan = current.to - current.from;
  const span = Math.min(Math.max(count, 1), Math.max(1, oldSpan / factor));
  const ratio = Math.min(1, Math.max(0, (anchor - current.from) / oldSpan));
  const from = current.from + ratio * (oldSpan - span);
  return normalizeCandlestickViewport({ from, to: from + span }, count);
}

/** Gaps retain their indexes. Overscan supplies extra real records without aggregation. */
export function getCandlestickVisiblePoints<Point>(
  points: readonly Point[],
  viewport: CandlestickViewport,
  overscan = 0,
): Point[] {
  validateViewport(viewport);
  if (!Number.isSafeInteger(overscan) || overscan < 0) {
    throw new Error("Candlestick overscan must be a nonnegative safe integer.");
  }
  const from = Math.max(0, Math.ceil(viewport.from) - overscan);
  const to = Math.min(points.length, Math.floor(viewport.to) + overscan + 1);
  return points.slice(from, Math.max(from, to));
}

/**
 * Preserve the first surviving visible identity during immutable updates. If every
 * identity is removed, retain and clamp the old logical window. Follow-latest only
 * applies when the previous window was already at the latest edge.
 */
export function reconcileCandlestickViewport<Point extends CandlestickViewportIdentity>(
  previousPoints: readonly Point[],
  nextPoints: readonly Point[],
  viewport: CandlestickViewport,
  options: Readonly<{ followLatest?: boolean }> = {},
): CandlestickViewport {
  const current = normalizeCandlestickViewport(viewport, previousPoints.length);
  if (previousPoints.length === 0) return fitCandlestickViewport(nextPoints.length);
  const span = current.to - current.from;
  if (options.followLatest && current.to >= previousPoints.length - 0.5 - 1e-9) {
    const to = Math.max(nextPoints.length, 1) - 0.5;
    return normalizeCandlestickViewport({ from: to - span, to }, nextPoints.length);
  }
  const nextIndexes = new Map(nextPoints.map((point, index) => [point.identity, index]));
  const start = Math.max(0, Math.ceil(current.from));
  const end = Math.min(previousPoints.length - 1, Math.floor(current.to));
  for (let index = start; index <= end; index += 1) {
    const point = previousPoints[index];
    if (!point) continue;
    const nextIndex = nextIndexes.get(point.identity);
    if (nextIndex !== undefined) {
      const shift = nextIndex - index;
      return normalizeCandlestickViewport(
        { from: current.from + shift, to: current.to + shift },
        nextPoints.length,
      );
    }
  }
  return normalizeCandlestickViewport(current, nextPoints.length);
}
