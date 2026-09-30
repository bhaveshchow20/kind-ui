export type Row = { day: string; completed: number | null; review: number | null };
export const series = [
  { key: "completed", label: "Completed", color: "#3659b8", dash: undefined },
  { key: "review", label: "Needs review", color: "#a75019", dash: "6 4" },
] as const;
export type SeriesKey = (typeof series)[number]["key"];
export const sample: Row[] = [
  { day: "Mon", completed: 42, review: 12 },
  { day: "Tue", completed: 58, review: 8 },
  { day: "Wed", completed: null, review: 14 },
  { day: "Thu", completed: 64, review: 0 },
  { day: "Fri", completed: 82, review: 9 },
  { day: "Sat", completed: 76, review: null },
  { day: "Sun", completed: 94, review: 6 },
];
const number = new Intl.NumberFormat("en-US");
export function formatValue(value: number | null): string {
  if (value === null) return "No data";
  if (!Number.isFinite(value)) throw new Error("Chart values must be finite numbers or null");
  return number.format(value);
}
