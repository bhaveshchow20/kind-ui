import assert from "node:assert/strict";
import test from "node:test";
import * as Chart from "@kind-ui/charts";

const normalize = (...args) => Chart.normalizeCandlestickData(...args);
const bar = (time, overrides = {}) => ({
  time,
  open: 10,
  high: 14,
  low: 8,
  close: 12,
  ...overrides,
});
const options = { timeMode: "epoch-ms" };

test("candlestick normalization retains original rows and missing versus zero volume", () => {
  const data = [Object.freeze(bar(0)), Object.freeze(bar(1000, { volume: 0, state: "partial" }))];
  const points = normalize(Object.freeze(data), options);
  assert.equal(points[0].original, data[0]);
  assert.equal(points[0].volume, undefined);
  assert.equal(points[1].volume, 0);
  assert.equal(points[1].state, "partial");
  assert.equal(points[0].timeValue, 0);
  assert.equal(points[0].identity, "epoch-ms:0");
});

test("candlestick generic keys and accessors preserve source metadata", () => {
  const row = { t: "2024-02-29", prices: [4, 7, 2, 5], qty: 3, source: "ask" };
  const [point] = normalize([row], {
    timeMode: "business-date",
    accessors: {
      time: "t",
      open: (r) => r.prices[0],
      high: (r) => r.prices[1],
      low: (r) => r.prices[2],
      close: (r) => r.prices[3],
      volume: "qty",
    },
  });
  assert.equal(point.timeValue, 1709164800000);
  assert.equal(point.original.source, "ask");
  assert.equal(point.high, 7);
});

test("candlestick explicit gaps retain time without fabricated candle or volume", () => {
  const points = normalize([bar(0), { time: 1, gap: true }, bar(2)], options);
  assert.equal(points[1].gap, true);
  assert.equal(points[1].open, undefined);
  assert.equal(points[1].volume, undefined);
  assert.throws(() => normalize([{ time: 0, gap: true, volume: 0 }], options), /data\[0\].volume/);
  assert.throws(() => normalize([{ time: 0, gap: true, open: 0 }], options), /data\[0\].open/);
});

test("candlestick rejects malformed containers, sparse rows and incomplete OHLC with paths", () => {
  assert.throws(() => normalize({}, options), /data/);
  assert.throws(() => normalize(Array(1), options), /data\[0\]/);
  assert.throws(() => normalize([null], options), /data\[0\]/);
  assert.throws(() => normalize([{ time: 0, open: 2 }], options), /data\[0\].high/);
  assert.throws(
    () => normalize([bar(0)], { ...options, accessors: { open: 3 } }),
    /accessors.open/,
  );
  assert.throws(
    () =>
      normalize([bar(0)], {
        ...options,
        accessors: {
          open: () => {
            throw new Error("bad feed");
          },
        },
      }),
    /data\[0\].open/,
  );
});

test("candlestick time identities are explicit, ordered, unique and calendar-valid", () => {
  for (const value of [0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER, "1000"]) {
    assert.throws(() => normalize([bar(value)], options), /data\[0\].time/);
  }
  for (const value of [
    "2023-02-29",
    "2024-02-30",
    "2024-13-01",
    "2024-2-01",
    "2024-01-01T00:00:00Z",
    "0000-01-01",
  ]) {
    assert.throws(() => normalize([bar(value)], { timeMode: "business-date" }), /data\[0\].time/);
  }
  assert.throws(() => normalize([bar(1), bar(1)], options), /data\[1\].time/);
  assert.throws(() => normalize([bar(2), bar(1)], options), /data\[1\].time/);
  assert.throws(() => normalize([bar(0)], {}), /timeMode/);
});

test("candlestick enforces OHLC extremes, finite values and supplied nonnegative volume", () => {
  for (const overrides of [
    { low: 11 },
    { high: 11 },
    { open: NaN },
    { close: Infinity },
    { volume: -1 },
    { volume: Infinity },
    { gap: "yes" },
    { state: 2 },
  ]) {
    assert.throws(() => normalize([bar(0, overrides)], options), /data\[0\]/);
  }
  assert.equal(
    normalize([bar(0, { open: -2, high: -1, low: -4, close: -3 })], options)[0].close,
    -3,
  );
});

test("candlestick logarithmic prices and caller bounds validate without clamping", () => {
  assert.throws(
    () => normalize([bar(0, { low: 0 })], { ...options, priceScale: "log" }),
    /data\[0\].low/,
  );
  assert.throws(() => normalize([bar(0)], { ...options, priceBounds: [0, 1] }), /data\[0\]/);
  assert.throws(() => normalize([], { ...options, priceBounds: [2, 1] }), /priceBounds/);
  assert.throws(() => normalize([], { ...options, priceScale: "unknown" }), /priceScale/);
  const [point] = normalize([bar(0, { open: 0.2, high: 1, low: 0, close: 0.7 })], {
    ...options,
    priceBounds: [0, 1],
  });
  assert.equal(point.high, 1);
  assert.equal(point.low, 0);
});

test("candlestick immutable live changes keep identities while retaining corrected records", () => {
  const initial = [bar(1000), bar(2000)];
  const first = normalize(initial, options);
  const correction = bar(1000, { low: 7, state: "corrected" });
  const current = bar(2000, { high: 15, close: 13, state: "partial" });
  const next = normalize([bar(0), correction, current, bar(3000)], options);
  assert.equal(next[1].identity, first[0].identity);
  assert.equal(next[2].identity, first[1].identity);
  assert.equal(next[1].original, correction);
  assert.equal(next[1].low, 7);
  assert.equal(next[2].high, 15);
  assert.equal(first[0].low, 8);
  assert.equal(initial[1].high, 14);
});

test("candlestick rejects degenerate price bounds before deriving a scale", () => {
  assert.throws(() => normalize([], { ...options, priceBounds: [1, 1] }), /priceBounds/);
});

test("candlestick rejects nonpositive logarithmic bounds even without observations", () => {
  assert.throws(
    () => normalize([], { ...options, priceScale: "log", priceBounds: [0, 1] }),
    /priceBounds/,
  );
  assert.throws(
    () => normalize([], { ...options, priceScale: "log", priceBounds: [-2, -1] }),
    /priceBounds/,
  );
});

test("candlestick numeric row-key accessors accept empty loading data", () => {
  const accessors = { time: 0, open: 1, high: 2, low: 3, close: 4 };
  assert.deepEqual(normalize([], { ...options, accessors }), []);
  const [point] = normalize([{ 0: 1000, 1: 10, 2: 14, 3: 8, 4: 12 }], { ...options, accessors });
  assert.equal(point.time, 1000);
  assert.equal(point.close, 12);
  assert.throws(
    () => normalize([bar(0)], { ...options, accessors: { open: 99 } }),
    /accessors.open/,
  );
});
