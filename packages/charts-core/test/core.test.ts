import { describe, expect, it } from "vitest";
import { createLineGeometry, type NormalizeOptions, normalizeSeries } from "../src/index.js";

const options: NormalizeOptions = {
  missing: "gap",
  x: { kind: "number", unit: null },
  y: { unit: "requests" },
};
const input = [
  { id: "a", x: 1, y: 8 },
  { id: "b", x: 2, y: null },
  { id: "c", x: 3, y: 12 },
];

describe("normalization", () => {
  it("preserves missing values instead of coercing them", () => {
    const model = normalizeSeries(input, options);
    expect(model.points.map((point) => point.y)).toEqual([8, null, 12]);
    expect(model.yDomain).toEqual([8, 12]);
  });
  it("includes imputed zero in the domain for [8, null, 12]", () => {
    const model = normalizeSeries(input, { ...options, missing: "zero" });
    expect(model.yDomain).toEqual([0, 12]);
    expect(model.points[1]).toMatchObject({ y: 0, rawY: null, imputed: true });
  });
  it("handles fractional domains without integer rounding", () => {
    const model = normalizeSeries(
      [
        { id: "a", x: 0.1, y: 0.25 },
        { id: "b", x: 0.3, y: 0.75 },
      ],
      options,
    );
    expect(model.xDomain).toEqual([0.1, 0.3]);
    expect(model.yDomain).toEqual([0.25, 0.75]);
    const geometry = createLineGeometry(
      model,
      { width: 200, height: 100 },
      { left: 0, right: 0, top: 0, bottom: 0 },
    );
    expect(geometry.points.map(({ px, py }) => [px, py])).toEqual([
      [0, 100],
      [200, 0],
    ]);
  });
  it("retains IDs and deterministic geometry after reordering", () => {
    const before = normalizeSeries(input, options);
    const after = normalizeSeries([...input].reverse(), options);
    expect(after).toEqual(before);
    expect(input.map((point) => point.id)).toEqual(["a", "b", "c"]);
  });
  it("rejects duplicate or blank IDs", () => {
    expect(() =>
      normalizeSeries(
        [
          { id: "a", x: 1, y: 1 },
          { id: "a", x: 2, y: 2 },
        ],
        options,
      ),
    ).toThrow(/unique/);
    expect(() => normalizeSeries([{ id: " ", x: 1, y: 1 }], options)).toThrow(/nonempty/);
  });
  it.each([NaN, Infinity, -Infinity])("rejects non-finite values %s", (value) => {
    expect(() => normalizeSeries([{ id: "a", x: value, y: 1 }], options)).toThrow(/Invalid/);
    expect(() => normalizeSeries([{ id: "a", x: 1, y: value }], options)).toThrow(/Invalid/);
  });
  it("rejects missing values when requested", () => {
    expect(() => normalizeSeries(input, { ...options, missing: "reject" })).toThrow(
      /rejected missing/,
    );
  });
  it("honors includeZero and validated explicit domains", () => {
    expect(normalizeSeries(input, { ...options, includeZero: true }).yDomain).toEqual([0, 12]);
    expect(normalizeSeries(input, { ...options, yDomain: [0, 20] }).yDomain).toEqual([0, 20]);
    expect(() => normalizeSeries(input, { ...options, yDomain: [12, 8] })).toThrow(/increasing/);
    expect(() => normalizeSeries(input, { ...options, missing: "zero", yDomain: [8, 12] })).toThrow(
      /excludes/,
    );
  });
  it("handles empty, all-missing, constant, and negative series", () => {
    expect(normalizeSeries([], options).yDomain).toEqual([0, 1]);
    expect(normalizeSeries([{ id: "a", x: 0, y: null }], options).yDomain).toEqual([0, 1]);
    expect(normalizeSeries([{ id: "a", x: 0, y: 5 }], options).yDomain).toEqual([4, 6]);
    expect(
      normalizeSeries(
        [
          { id: "a", x: 0, y: -10 },
          { id: "b", x: 1, y: -2 },
        ],
        options,
      ).yDomain,
    ).toEqual([-10, -2]);
  });
  it("validates time zones and accepts epoch milliseconds", () => {
    expect(() =>
      normalizeSeries(input, { ...options, x: { kind: "time", timeZone: "invalid-zone" } }),
    ).toThrow();
    const model = normalizeSeries(
      [
        { id: "a", x: Date.UTC(2026, 0, 1), y: 1 },
        { id: "b", x: Date.UTC(2026, 0, 2), y: 2 },
      ],
      { ...options, x: { kind: "time", timeZone: "America/New_York" } },
    );
    expect(model.x).toEqual({ kind: "time", timeZone: "America/New_York" });
    expect(createLineGeometry(model, { width: 720, height: 320 }).xTicks.length).toBeGreaterThan(0);
  });
  it("rejects numerically unsafe ranges before D3 tick generation", () => {
    expect(() =>
      normalizeSeries(
        [
          { id: "a", x: Number.MIN_VALUE, y: 1 },
          { id: "b", x: Number.MIN_VALUE * 2, y: 2 },
        ],
        options,
      ),
    ).toThrow(/too small/);
    expect(() => normalizeSeries([], { ...options, yDomain: [0, 1e-320] })).toThrow(/too small/);
    expect(() =>
      normalizeSeries([], { ...options, yDomain: [-Number.MAX_VALUE, Number.MAX_VALUE] }),
    ).toThrow(/finite/);
  });
  it("requires integer, Date-range temporal values and domains", () => {
    const timeOptions = { ...options, x: { kind: "time" as const, timeZone: "UTC" } };
    expect(() => normalizeSeries([{ id: "a", x: 0.25, y: 1 }], timeOptions)).toThrow(/Invalid x/);
    expect(() => normalizeSeries([], { ...timeOptions, xDomain: [0.25, 1] })).toThrow(
      /Time domain/,
    );
    expect(() => normalizeSeries([], { ...timeOptions, xDomain: [0, 8.64e15 + 1] })).toThrow(
      /Time domain/,
    );
    const timestamp = Date.UTC(2026, 0, 1);
    expect(normalizeSeries([{ id: "a", x: timestamp, y: 1 }], timeOptions).xDomain).toEqual([
      timestamp - 43_200_000,
      timestamp + 43_200_000,
    ]);
  });
  it("does not silently use the host timezone or omitted units for JavaScript callers", () => {
    expect(() =>
      normalizeSeries([], {
        ...options,
        x: { kind: "time", timeZone: undefined },
      } as unknown as NormalizeOptions),
    ).toThrow(/explicit timezone/);
    expect(() => normalizeSeries([], { ...options, y: {} } as unknown as NormalizeOptions)).toThrow(
      /Units must be explicit/,
    );
  });
  it("falls back to numeric ticks at extreme Date boundaries", () => {
    for (const x of [-8.64e15, 8.64e15]) {
      const model = normalizeSeries([{ id: "a", x, y: 0 }], {
        ...options,
        x: { kind: "time", timeZone: "UTC" },
      });
      const geometry = createLineGeometry(model, { width: 720, height: 320 });
      expect(geometry.xTicks.length).toBeGreaterThan(0);
      expect(geometry.points[0]?.px).toBeTypeOf("number");
    }
  });
  it("freezes its semantic snapshot without freezing caller data", () => {
    const model = normalizeSeries(input, options);
    expect(Object.isFrozen(model)).toBe(true);
    expect(Object.isFrozen(model.points[0])).toBe(true);
    expect(Object.isFrozen(input[0])).toBe(false);
  });
});

describe("geometry", () => {
  it("breaks line paths across missing values", () => {
    const geometry = createLineGeometry(normalizeSeries(input, options), {
      width: 400,
      height: 200,
    });
    expect(geometry.path?.match(/M/g)).toHaveLength(2);
    expect(geometry.points[1]?.py).toBeNull();
  });
  it("returns no path for empty data", () => {
    expect(
      createLineGeometry(normalizeSeries([], options), { width: 400, height: 200 }).path,
    ).toBeNull();
  });
  it("rejects zero, negative, or non-finite plot area", () => {
    for (const width of [0, -1, Infinity, NaN, 50]) {
      expect(() =>
        createLineGeometry(normalizeSeries(input, options), { width, height: 200 }),
      ).toThrow(/positive plot area/);
    }
  });
});
