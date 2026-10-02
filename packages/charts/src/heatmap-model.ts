export type HeatmapDatum = { row: string; column: string; value: number | null };
export type HeatmapDuplicatePolicy = "error" | "first" | "last" | "sum";
export type HeatmapCell = {
  row: string;
  column: string;
  rowIndex: number;
  columnIndex: number;
  value: number | null;
  /** All original records at this coordinate, in input order. */
  sources: readonly HeatmapDatum[];
};
export type HeatmapModel = {
  rows: readonly string[];
  columns: readonly string[];
  cells: readonly (readonly HeatmapCell[])[];
};
export type HeatmapModelOptions = {
  rows: readonly string[];
  columns: readonly string[];
  data: readonly HeatmapDatum[];
  duplicates?: HeatmapDuplicatePolicy;
};

/** Explicit ordered domains; absent and null records are missing, never coerced to zero. */
export function createHeatmapModel({
  rows,
  columns,
  data,
  duplicates = "error",
}: HeatmapModelOptions): HeatmapModel {
  if (!["error", "first", "last", "sum"].includes(duplicates))
    throw new Error("Invalid heatmap duplicate policy");
  for (const [name, domain] of [
    ["row", rows],
    ["column", columns],
  ] as const) {
    if (domain.some((key) => typeof key !== "string") || new Set(domain).size !== domain.length)
      throw new Error(`Heatmap ${name} domain must contain unique strings`);
  }
  const rowMap = new Map(rows.map((key, index) => [key, index]));
  const columnMap = new Map(columns.map((key, index) => [key, index]));
  const cells = rows.map((row, rowIndex) =>
    columns.map((column, columnIndex) => ({
      row,
      column,
      rowIndex,
      columnIndex,
      value: null as number | null,
      sources: [] as HeatmapDatum[],
    })),
  );
  for (const datum of data) {
    const r = rowMap.get(datum.row);
    const c = columnMap.get(datum.column);
    if (r === undefined || c === undefined)
      throw new Error("Heatmap datum is outside its explicit domains");
    if (datum.value !== null && !Number.isFinite(datum.value))
      throw new Error("Heatmap values must be finite numbers or null");
    const cell = cells[r]?.[c];
    if (!cell) throw new Error("Invalid heatmap coordinate");
    if (cell.sources.length && duplicates === "error")
      throw new Error(`Duplicate heatmap cell: ${datum.row}, ${datum.column}`);
    const first = cell.sources.length === 0;
    cell.sources.push(datum);
    if (first || duplicates === "last") cell.value = datum.value;
    else if (duplicates === "sum" && datum.value !== null)
      cell.value = (cell.value ?? 0) + datum.value;
    if (cell.value !== null && !Number.isFinite(cell.value))
      throw new Error("Heatmap sum must remain finite");
  }
  return { rows: [...rows], columns: [...columns], cells };
}

export type HeatmapScaleOptions = {
  /** Finite ascending endpoints. A constant domain uses the palette midpoint. */
  domain: readonly [number, number];
  /** Evenly spaced opaque sRGB stops, each in #rrggbb format. */
  colors: readonly string[];
};
export type HeatmapScale = HeatmapScaleOptions & { color: (value: number) => string };
export function createHeatmapScale({ domain, colors }: HeatmapScaleOptions): HeatmapScale {
  const [min, max] = domain;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max || !Number.isFinite(max - min))
    throw new Error("Heatmap scale requires a finite ascending domain");
  if (colors.length < 2 || colors.some((color) => !/^#[0-9a-f]{6}$/i.test(color)))
    throw new Error("Heatmap scale requires at least two opaque #rrggbb colors");
  const palette = [...colors];
  const channels = palette.map((color) =>
    [1, 3, 5].map((i) => Number.parseInt(color.slice(i, i + 2), 16)),
  );
  return {
    domain: [min, max],
    colors: palette,
    color(value) {
      if (!Number.isFinite(value)) throw new Error("Heatmap color requires a finite value");
      const t = min === max ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
      const p = t * (palette.length - 1);
      const i = Math.min(Math.floor(p), palette.length - 2);
      const start = channels[i];
      const end = channels[i + 1];
      if (!start || !end) throw new Error("Invalid heatmap palette");
      return `#${start
        .map((v, c) =>
          Math.round(v + ((end[c] ?? v) - v) * (p - i))
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")}`;
    },
  };
}
