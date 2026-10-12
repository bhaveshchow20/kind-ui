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
export function createHeatmapModel(options: HeatmapModelOptions): HeatmapModel {
  if (options === null || typeof options !== "object" || Array.isArray(options))
    throw new Error("Heatmap options must be an object");
  const { rows, columns, data, duplicates = "error" } = options;
  if (!["error", "first", "last", "sum"].includes(duplicates))
    throw new Error("Invalid heatmap duplicate policy");
  for (const [name, domain] of [
    ["row", rows],
    ["column", columns],
  ] as const) {
    if (!Array.isArray(domain)) throw new Error(`Heatmap ${name} domain must be an array`);
    for (const [index, key] of domain.entries()) {
      if (typeof key !== "string")
        throw new Error(`Heatmap ${name} domain[${index}] must be a string`);
    }
    if (new Set(domain).size !== domain.length)
      throw new Error(`Heatmap ${name} domain must contain unique strings`);
  }
  if (!Array.isArray(data)) throw new Error("Heatmap data must be an array");
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
  for (const [index, datum] of data.entries()) {
    const path = `Heatmap data[${index}]`;
    if (datum === null || typeof datum !== "object" || Array.isArray(datum))
      throw new Error(`${path} must be a datum object`);
    if (typeof datum.row !== "string") throw new Error(`${path}.row must be a string`);
    if (typeof datum.column !== "string") throw new Error(`${path}.column must be a string`);
    const r = rowMap.get(datum.row);
    const c = columnMap.get(datum.column);
    if (r === undefined || c === undefined)
      throw new Error(`${path}.row/column is outside its explicit domains`);
    if (datum.value !== null && !Number.isFinite(datum.value))
      throw new Error(`${path}.value must be a finite number or null`);
    const cell = cells[r]?.[c];
    if (!cell) throw new Error("Invalid heatmap coordinate");
    if (cell.sources.length && duplicates === "error")
      throw new Error(`${path}: Duplicate heatmap cell: ${datum.row}, ${datum.column}`);
    const first = cell.sources.length === 0;
    cell.sources.push(datum);
    if (first || duplicates === "last") cell.value = datum.value;
    else if (duplicates === "sum" && datum.value !== null)
      cell.value = (cell.value ?? 0) + datum.value;
    if (cell.value !== null && !Number.isFinite(cell.value))
      throw new Error(`${path}.value causes the sum to exceed finite numeric range`);
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
export function createHeatmapScale(options: HeatmapScaleOptions): HeatmapScale {
  if (options === null || typeof options !== "object" || Array.isArray(options))
    throw new Error("Heatmap scale options must be an object");
  const { domain, colors } = options;
  if (!Array.isArray(domain) || domain.length !== 2)
    throw new Error("Heatmap scale domain must be an array with exactly two endpoints");
  const [min, max] = domain;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max || !Number.isFinite(max - min))
    throw new Error("Heatmap scale requires a finite ascending domain");
  if (!Array.isArray(colors) || colors.length < 2)
    throw new Error("Heatmap scale requires at least two opaque #rrggbb colors");
  for (const [index, color] of colors.entries()) {
    if (typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color))
      throw new Error(`Heatmap scale colors[${index}] must be an opaque #rrggbb color`);
  }
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
