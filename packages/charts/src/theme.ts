/** Paint only: themes cannot supply domains, units, values, or missing policy. */
export interface ChartTheme {
  readonly background: string;
  readonly foreground: string;
  readonly muted: string;
  readonly grid: string;
  readonly line: string;
  readonly selected: string;
}
export const lightTheme: ChartTheme = Object.freeze({
  background: "#ffffff",
  foreground: "#172033",
  muted: "#536176",
  grid: "#d8e0eb",
  line: "#1759c5",
  selected: "#a33500",
});
export const darkTheme: ChartTheme = Object.freeze({
  background: "#111827",
  foreground: "#f3f4f6",
  muted: "#bcc9da",
  grid: "#37465b",
  line: "#8cb8ff",
  selected: "#ffbc80",
});
