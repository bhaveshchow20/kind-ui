export type WaterfallEntry = { id: string; label: string } & (
  | { kind: "start" | "total" | "end" | "delta"; value: number | null }
  | { kind: "subtotal"; value?: never }
);

export type WaterfallDatum = {
  id: string;
  label: string;
  kind: WaterfallEntry["kind"];
  /** Original delta/checkpoint value; the computed balance for a subtotal. */
  value: number | null;
  /** Directed numeric endpoints. Unknown geometry stays null. */
  start: number | null;
  end: number | null;
  balance: number | null;
  range: [number, number] | null;
};

/** Pure, ordered arithmetic. A missing change poisons the balance until a known checkpoint. */
export function computeWaterfallData(
  entries: readonly WaterfallEntry[],
  initialBalance: number | null = 0,
): WaterfallDatum[] {
  const valid = (value: unknown): value is number | null =>
    value === null || (typeof value === "number" && Number.isFinite(value));
  if (!valid(initialBalance)) throw new Error("Waterfall initialBalance must be finite or null");
  let balance = initialBalance;
  const ids = new Set<string>();
  return entries.map((entry) => {
    if (!entry.id || ids.has(entry.id)) throw new Error("Waterfall requires unique nonempty ids");
    ids.add(entry.id);
    if (!["start", "total", "end", "delta", "subtotal"].includes(entry.kind))
      throw new Error("Unknown Waterfall kind");
    if (entry.kind === "subtotal" ? entry.value !== undefined : !valid(entry.value))
      throw new Error("Waterfall values must be finite or null; subtotals have no supplied value");
    let start: number | null;
    let end: number | null;
    if (entry.kind === "delta") {
      start = balance;
      end = balance === null || entry.value === null ? null : balance + entry.value;
      if (end !== null && !Number.isFinite(end)) throw new Error("Waterfall balance overflow");
      balance = end;
    } else if (entry.kind === "subtotal") {
      start = balance === null ? null : 0;
      end = balance;
    } else {
      balance = entry.value;
      start = balance === null ? null : 0;
      end = balance;
    }
    return {
      id: entry.id,
      label: entry.label,
      kind: entry.kind,
      value: entry.kind === "subtotal" ? balance : entry.value,
      start,
      end,
      balance,
      range: start === null || end === null ? null : [Math.min(start, end), Math.max(start, end)],
    };
  });
}
