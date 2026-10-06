/** Caller-supplied estimates; this option never generates values or forecasts. */
export type LineProjection<DataPoint> = {
  /** Flags projected rows. Only the contiguous trailing flagged suffix is projected. */
  isProjected: (datum: DataPoint) => boolean;
  /** Dash treatment on the projected stroke; historical stroke options remain native. */
  strokeDasharray?: string | number;
};

/** First projected row in the supplied display order, or data.length when none. */
export function getProjectedStart<DataPoint>(
  data: readonly DataPoint[],
  isProjected: LineProjection<DataPoint>["isProjected"],
): number {
  let start = data.length;
  while (start > 0 && isProjected(data[start - 1] as DataPoint)) start--;
  return start;
}
