import type { TooltipContentProps } from "recharts";

type Entry = TooltipContentProps["payload"][number];
/** Return a fraction for selected entries; undefined retains ordinary formatting. */
export type NormalizedValue = (entry: Entry) => number | undefined;
export type PercentStackOptions = {
  /** Raw members of this entry's native expand stack, including its own value.
   * Return undefined for other series/axes. Match native hidden-series membership.
   */
  values: (entry: Entry) => readonly (number | null | undefined)[] | undefined;
};

/** Formats an existing fraction; never normalizes chart data or changes domains. */
export function formatPercent(value: number): string {
  return `${Number((value * 100).toFixed(1))}%`;
}

/** Formatting only for native stackOffset="expand" scalar stacks. */
export function createPercentStack({ values }: PercentStackOptions) {
  const normalizedValue: NormalizedValue = (entry) => {
    if (typeof entry.value !== "number" || !Number.isFinite(entry.value)) return undefined;
    const members = values(entry);
    if (!members || members.length === 0) return undefined;
    let total = 0;
    let allZero = true;
    for (const member of members) {
      if (member == null) continue;
      if (!Number.isFinite(member)) return undefined;
      total += member;
      if (member !== 0) allZero = false;
    }
    if (!Number.isFinite(total)) return undefined;
    // Expand uses a signed sum. A cancelling sum has no normalized share.
    if (total === 0) return allZero && entry.value === 0 ? 0 : undefined;
    const fraction = entry.value / total;
    return Number.isFinite(fraction * 100) ? fraction : undefined;
  };
  return { tickFormatter: formatPercent, normalizedValue };
}
