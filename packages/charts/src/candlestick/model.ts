/** Intraday instants use epoch milliseconds; session dates use YYYY-MM-DD. */
export type CandlestickTime = number | string;
export type CandlestickTimeMode = "epoch-ms" | "business-date";

/** Complete observed OHLC or an explicit gap with no fabricated prices or volume. */
export type CandlestickRecord = {
  time: CandlestickTime;
  state?: string;
} & (
  | {
      gap?: false;
      open: number;
      high: number;
      low: number;
      close: number;
      volume?: number;
    }
  | {
      gap: true;
      open?: never;
      high?: never;
      low?: never;
      close?: never;
      volume?: never;
    }
);

type CandlestickAccessor<Row, Value> =
  | { [Key in keyof Row]-?: Row[Key] extends Value ? Key : never }[keyof Row]
  | ((row: Row, index: number) => Value);

export interface CandlestickAccessors<Row> {
  time?: CandlestickAccessor<Row, CandlestickTime>;
  open?: CandlestickAccessor<Row, number | undefined>;
  high?: CandlestickAccessor<Row, number | undefined>;
  low?: CandlestickAccessor<Row, number | undefined>;
  close?: CandlestickAccessor<Row, number | undefined>;
  volume?: CandlestickAccessor<Row, number | undefined>;
  gap?: CandlestickAccessor<Row, boolean | undefined>;
  state?: CandlestickAccessor<Row, string | undefined>;
}

export interface CandlestickDataOptions<Row> {
  timeMode: CandlestickTimeMode;
  accessors?: CandlestickAccessors<Row>;
  priceScale?: "linear" | "log";
  /** Inclusive caller-owned bounds. Values outside these bounds are rejected. */
  priceBounds?: readonly [number, number];
}

export interface CandlestickPoint<Row = CandlestickRecord> {
  time: CandlestickTime;
  timeValue: number;
  identity: string;
  original: Row;
  gap: boolean;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  state?: string;
}

const priceFields = ["open", "high", "low", "close"] as const;
const fields = ["time", ...priceFields, "volume", "gap", "state"] as const;
type Field = (typeof fields)[number];

function invalid(path: string, message: string): never {
  throw new TypeError(`CandlestickChart ${path}: ${message}`);
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function timeValue(time: unknown, mode: CandlestickTimeMode, path: string): number {
  if (mode === "epoch-ms") {
    if (typeof time !== "number" || !Number.isSafeInteger(time) || Math.abs(time) > 8.64e15) {
      return invalid(path, "expected a safe epoch-millisecond instant within the Date range");
    }
    return time;
  }
  if (typeof time !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(time) || time.startsWith("0000-")) {
    return invalid(path, "expected a calendar-valid YYYY-MM-DD business date");
  }
  const value = Date.parse(`${time}T00:00:00.000Z`);
  if (!Number.isFinite(value) || new Date(value).toISOString().slice(0, 10) !== time) {
    return invalid(path, "expected a calendar-valid YYYY-MM-DD business date");
  }
  return value;
}

function finiteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return invalid(path, "expected a finite number");
  }
  return value;
}

/** Validate without sorting, filling, clamping or mutating caller records. */
export function normalizeCandlestickData<Row = CandlestickRecord>(
  data: readonly Row[],
  options: CandlestickDataOptions<Row>,
): CandlestickPoint<Row>[] {
  if (!Array.isArray(data)) invalid("data", "expected an array");
  if (
    !isRecord(options) ||
    (options.timeMode !== "epoch-ms" && options.timeMode !== "business-date")
  ) {
    invalid("timeMode", "choose epoch-ms or business-date explicitly");
  }
  if (
    options.priceScale !== undefined &&
    options.priceScale !== "linear" &&
    options.priceScale !== "log"
  ) {
    invalid("priceScale", "expected linear or log");
  }
  const bounds = options.priceBounds;
  if (bounds !== undefined) {
    if (!Array.isArray(bounds) || bounds.length !== 2)
      invalid("priceBounds", "expected [minimum, maximum]");
    finiteNumber(bounds[0], "priceBounds[0]");
    finiteNumber(bounds[1], "priceBounds[1]");
    if (bounds[0] >= bounds[1]) invalid("priceBounds", "minimum must be less than maximum");
    if (options.priceScale === "log" && bounds[0] <= 0)
      invalid("priceBounds", "log bounds must be positive");
  }
  const accessors = options.accessors;
  if (accessors !== undefined && !isRecord(accessors))
    invalid("accessors", "expected a field-accessor object");
  for (const field of fields) {
    const accessor = accessors?.[field];
    if (
      accessor !== undefined &&
      typeof accessor !== "function" &&
      typeof accessor !== "string" &&
      typeof accessor !== "symbol" &&
      typeof accessor !== "number"
    ) {
      invalid(`accessors.${field}`, "expected a row key or accessor function");
    }
    // Numeric field keys are supported only as actual row keys, not field indices.
    if (
      typeof accessor === "number" &&
      data.length > 0 &&
      !data.some((row) => isRecord(row) && accessor in row)
    ) {
      invalid(`accessors.${field}`, "numeric key does not occur in the supplied rows");
    }
  }
  let previous = Number.NEGATIVE_INFINITY;
  const points: CandlestickPoint<Row>[] = [];
  for (let index = 0; index < data.length; index += 1) {
    const row = data[index];
    const path = `data[${index}]`;
    if (!Object.hasOwn(data, index) || !isRecord(row))
      invalid(path, "expected a non-sparse object row");
    const read = (field: Field): unknown => {
      const accessor = accessors?.[field];
      try {
        if (typeof accessor === "function") return accessor(row as Row, index);
        if (
          typeof accessor === "string" ||
          typeof accessor === "symbol" ||
          typeof accessor === "number"
        )
          return row[accessor];
        return row[field];
      } catch (cause) {
        throw new TypeError(`CandlestickChart ${path}.${field}: accessor failed`, { cause });
      }
    };
    const rawTime = read("time");
    const value = timeValue(rawTime, options.timeMode, `${path}.time`);
    if (value <= previous)
      invalid(`${path}.time`, "identities must be unique and ordered ascending");
    previous = value;
    // timeValue has established the time type for the explicit mode.
    const time = rawTime as CandlestickTime;
    const rawGap = read("gap");
    if (rawGap !== undefined && typeof rawGap !== "boolean")
      invalid(`${path}.gap`, "expected a boolean");
    const point: CandlestickPoint<Row> = {
      time,
      timeValue: value,
      identity: `${options.timeMode}:${time}`,
      original: row as Row,
      gap: rawGap === true,
    };
    const state = read("state");
    if (state !== undefined) {
      if (typeof state !== "string") invalid(`${path}.state`, "expected a string");
      point.state = state;
    }
    for (const field of priceFields) {
      const raw = read(field);
      if (point.gap) {
        if (raw !== undefined) invalid(`${path}.${field}`, "gaps must omit observed OHLC values");
        continue;
      }
      const price = finiteNumber(raw, `${path}.${field}`);
      if (options.priceScale === "log" && price <= 0)
        invalid(`${path}.${field}`, "log prices must be positive");
      if (bounds && (price < bounds[0] || price > bounds[1]))
        invalid(`${path}.${field}`, "price is outside caller bounds");
      point[field] = price;
    }
    if (
      !point.gap &&
      point.open !== undefined &&
      point.high !== undefined &&
      point.low !== undefined &&
      point.close !== undefined
    ) {
      if (point.low > Math.min(point.open, point.close))
        invalid(`${path}.low`, "low must contain open and close");
      if (point.high < Math.max(point.open, point.close))
        invalid(`${path}.high`, "high must contain open and close");
    }
    const volume = read("volume");
    if (volume !== undefined) {
      if (point.gap) invalid(`${path}.volume`, "gaps must omit observed volume");
      const quantity = finiteNumber(volume, `${path}.volume`);
      if (quantity < 0) invalid(`${path}.volume`, "volume must be nonnegative");
      point.volume = quantity;
    }
    points.push(point);
  }
  return points;
}
