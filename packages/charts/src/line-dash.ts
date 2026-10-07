/** Timing for one complete numeric dash-pattern cycle. */
export type LineDashAnimation = {
  durationMs?: number;
  direction?: "forward" | "reverse";
};

/** Unitless SVG lengths only: native CSS/percentage patterns remain consumer-owned. */
export function dashCycle(pattern: string | number | undefined): number | undefined {
  if (pattern === undefined) return undefined;
  const tokens = String(pattern)
    .trim()
    .split(/[\s,]+/);
  if (!tokens.length || tokens.some((token) => !/^(?:\d+\.?\d*|\.\d+)$/.test(token)))
    return undefined;
  const values = tokens.map(Number);
  const sum = values.reduce((total, value) => total + value, 0);
  const cycle = sum * (values.length % 2 ? 2 : 1);
  return Number.isFinite(cycle) && cycle > 0 ? cycle : undefined;
}

export function dashDuration(options: LineDashAnimation): number | undefined {
  const duration = options.durationMs ?? 1000;
  return Number.isFinite(duration) && duration > 0 ? duration : undefined;
}
