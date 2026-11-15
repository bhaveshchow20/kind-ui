import assert from "node:assert/strict";
import test from "node:test";
import * as Chart from "@kind-ui/charts";

const points = [
  { identity: "a", timeValue: 100, gap: false, open: 10, close: 11, low: 5, high: 15 },
  { identity: "b", timeValue: 200, gap: true },
  { identity: "c", timeValue: 500, gap: false, open: 20, close: 21, low: 18, high: 25 },
  { identity: "d", timeValue: 600, gap: false, open: 30, close: 31, low: 28, high: 35 },
];

test("candlestick viewport clamps while preserving span and supports fractional pan/anchor zoom", () => {
  assert.deepEqual(Chart.fitCandlestickViewport(4), { from: -0.5, to: 3.5 });
  assert.deepEqual(Chart.panCandlestickViewport({ from: 0.5, to: 2.5 }, 100, 4), {
    from: 1.5,
    to: 3.5,
  });
  assert.deepEqual(Chart.zoomCandlestickViewport({ from: -0.5, to: 3.5 }, 2, 1.5, 4), {
    from: 0.5,
    to: 2.5,
  });
  assert.deepEqual(Chart.zoomCandlestickViewport({ from: 0.5, to: 2.5 }, 2, 0.5, 4), {
    from: 0.5,
    to: 1.5,
  });
  assert.throws(() => Chart.zoomCandlestickViewport({ from: 0, to: 1 }, 0, 0, 4), /factor/);
  assert.throws(() => Chart.normalizeCandlestickViewport({ from: 2, to: 1 }, 4), /viewport/);
});

test("candlestick visible window retains gap positions and never silently aggregates", () => {
  assert.deepEqual(
    Chart.getCandlestickVisiblePoints(points, { from: 0.5, to: 2.5 }),
    points.slice(1, 3),
  );
  assert.deepEqual(Chart.getCandlestickVisiblePoints(points, { from: 0.5, to: 2.5 }, 1), points);
  assert.deepEqual(Chart.fitCandlestickViewport(0), { from: -0.5, to: 0.5 });
});

test("candlestick updates preserve historical identities through prepends and corrections", () => {
  const before = { from: 0.5, to: 2.5 };
  const prepended = [{ identity: "older", timeValue: 50, gap: true }, ...points];
  assert.deepEqual(Chart.reconcileCandlestickViewport(points, prepended, before), {
    from: 1.5,
    to: 3.5,
  });
  assert.deepEqual(
    Chart.reconcileCandlestickViewport(
      points,
      points.map((point) => ({ ...point })),
      before,
    ),
    before,
  );
  const appended = [...points, { identity: "new", timeValue: 700, gap: true }];
  assert.deepEqual(
    Chart.reconcileCandlestickViewport(points, appended, before, { followLatest: true }),
    before,
  );
  assert.deepEqual(Chart.reconcileCandlestickViewport(points, appended, { from: 1.5, to: 3.5 }), {
    from: 1.5,
    to: 3.5,
  });
  assert.deepEqual(
    Chart.reconcileCandlestickViewport(
      points,
      appended,
      { from: 1.5, to: 3.5 },
      { followLatest: true },
    ),
    { from: 2.5, to: 4.5 },
  );
});

test("candlestick time scales distinguish omitted elapsed intervals and logical spacing", () => {
  assert.deepEqual(
    Chart.getCandlestickTimeDomain(points, { from: -0.5, to: 3.5 }, "ordinal"),
    [-0.5, 3.5],
  );
  assert.deepEqual(
    Chart.getCandlestickTimeDomain(points, { from: -0.5, to: 3.5 }, "elapsed"),
    [50, 650],
  );
  assert.deepEqual(
    Chart.getCandlestickTimeDomain(points, { from: 0.5, to: 2.5 }, "elapsed"),
    [150, 550],
  );
  assert.equal(Chart.getCandlestickTimeCoordinate(points[2], 2, "ordinal"), 2);
  assert.equal(Chart.getCandlestickTimeCoordinate(points[2], 2, "elapsed"), 500);
});

test("candlestick price domains use wick extremes with explicit overlay participation", () => {
  assert.deepEqual(Chart.getCandlestickPriceDomain(points, { padding: 0 }), [5, 35]);
  assert.deepEqual(
    Chart.getCandlestickPriceDomain(points, { viewport: { from: 1.5, to: 2.5 }, padding: 0 }),
    [18, 25],
  );
  assert.deepEqual(
    Chart.getCandlestickPriceDomain(points, {
      viewport: { from: 1.5, to: 2.5 },
      autoscale: "all",
      padding: 0,
    }),
    [5, 35],
  );
  assert.deepEqual(
    Chart.getCandlestickPriceDomain(points, { padding: 0, overlayValues: [40] }),
    [5, 40],
  );
  assert.deepEqual(
    Chart.getCandlestickPriceDomain(points, { domain: [1, 100], padding: 0.5 }),
    [1, 100],
  );
  assert.deepEqual(Chart.getCandlestickPriceDomain(points, { padding: 0.1 }), [2, 38]);
});

test("candlestick log, bounded and constant domains stay valid without clamping observations", () => {
  const flat = [{ identity: "flat", timeValue: 1, gap: false, low: 10, high: 10 }];
  const domain = Chart.getCandlestickPriceDomain(flat, { padding: 0 });
  assert.ok(domain[0] < 10 && domain[1] > 10);
  const logDomain = Chart.getCandlestickPriceDomain(points, { padding: 0.1, scale: "log" });
  assert.ok(logDomain[0] > 0 && logDomain[0] < 5 && logDomain[1] > 35);
  assert.deepEqual(Chart.getCandlestickPriceDomain([], { scale: "log" }), [1, 10]);
  assert.throws(
    () => Chart.getCandlestickPriceDomain([{ ...flat[0], low: 0 }], { scale: "log" }),
    /positive/,
  );
  assert.throws(() => Chart.getCandlestickPriceDomain(points, { bounds: [0, 1] }), /bounds/);
  assert.deepEqual(
    Chart.getCandlestickPriceDomain([{ ...flat[0], low: 0, high: 1 }], {
      bounds: [0, 1],
      padding: 0.1,
    }),
    [0, 1],
  );
  assert.throws(() => Chart.getCandlestickPriceDomain(points, { domain: [2, 1] }), /domain/);
  assert.throws(
    () => Chart.getCandlestickPriceDomain(points, { overlayValues: [Number.NaN] }),
    /overlay/,
  );
});

test("candlestick removal uses surviving visible identity and otherwise clamps the old window", () => {
  assert.deepEqual(
    Chart.reconcileCandlestickViewport(points, points.slice(2), { from: 0.5, to: 2.5 }),
    { from: -0.5, to: 1.5 },
  );
  const replacements = points
    .slice(0, 2)
    .map((point) => ({ ...point, identity: `replacement-${point.identity}` }));
  assert.deepEqual(
    Chart.reconcileCandlestickViewport(points, replacements, { from: 1.5, to: 3.5 }),
    { from: -0.5, to: 1.5 },
  );
  assert.deepEqual(Chart.reconcileCandlestickViewport([], points, { from: -0.5, to: 0.5 }), {
    from: -0.5,
    to: 3.5,
  });
});

test("candlestick viewport rejects invalid navigation and preserves exact source records", () => {
  for (const count of [-1, 1.5, Infinity, Number.NaN]) {
    assert.throws(() => Chart.fitCandlestickViewport(count), /count/);
  }
  assert.throws(() => Chart.panCandlestickViewport({ from: 0, to: 1 }, Infinity, 4), /delta/);
  assert.throws(() => Chart.zoomCandlestickViewport({ from: 0, to: 1 }, 2, Infinity, 4), /anchor/);
  assert.throws(
    () => Chart.getCandlestickVisiblePoints(points, { from: 0, to: 1 }, 0.5),
    /overscan/,
  );
  assert.equal(Chart.getCandlestickVisiblePoints(points, { from: 1.5, to: 2.5 })[0], points[2]);
  assert.deepEqual(Chart.zoomCandlestickViewport({ from: 0.5, to: 2.5 }, 0.001, 1.5, 4), {
    from: -0.5,
    to: 3.5,
  });
});

test("candlestick fixed domains allow explicit clipping but never bypass log or bound validation", () => {
  assert.deepEqual(Chart.getCandlestickPriceDomain(points, { domain: [10, 20] }), [10, 20]);
  assert.throws(
    () => Chart.getCandlestickPriceDomain(points, { domain: [0, 20], scale: "log" }),
    /positive/,
  );
  assert.throws(
    () => Chart.getCandlestickPriceDomain(points, { domain: [-1, 40], bounds: [0, 40] }),
    /bounds/,
  );
  assert.throws(() => Chart.getCandlestickPriceDomain(points, { padding: -1 }), /padding/);
  assert.throws(() => Chart.getCandlestickPriceDomain(points, { padding: Infinity }), /padding/);
  assert.deepEqual(Chart.getCandlestickPriceDomain([], { bounds: [-10, 10] }), [-10, 10]);
  assert.throws(
    () =>
      Chart.getCandlestickPriceDomain([{ ...points[0], low: 0 }, ...points.slice(1)], {
        viewport: { from: 1.5, to: 2.5 },
        scale: "log",
      }),
    /data\[0\].low.*positive/,
  );
});

test("candlestick elapsed inverse preserves irregular time anchors and edge extrapolation", () => {
  assert.equal(Chart.getCandlestickLogicalCoordinate(points, 350, "elapsed"), 1.5);
  assert.equal(Chart.getCandlestickLogicalCoordinate(points, 50, "elapsed"), -0.5);
  assert.equal(Chart.getCandlestickLogicalCoordinate(points, 650, "elapsed"), 3.5);
  assert.equal(Chart.getCandlestickLogicalCoordinate(points, 1.5, "ordinal"), 1.5);
  assert.equal(Chart.getCandlestickLogicalCoordinate([points[0]], 100.5, "elapsed"), 0.5);
  assert.equal(Chart.getCandlestickLogicalCoordinate([], 0.5, "elapsed"), 0);
  assert.throws(
    () => Chart.getCandlestickLogicalCoordinate(points, Infinity, "elapsed"),
    /coordinate/,
  );
});

test("candlestick price domains reject every explicitly supplied malformed tuple", () => {
  for (const domain of [null, 0, false]) {
    assert.throws(() => Chart.getCandlestickPriceDomain(points, { domain }), /price domain/);
  }
  for (const bounds of [null, 0, false]) {
    assert.throws(() => Chart.getCandlestickPriceDomain(points, { bounds }), /price bounds/);
  }
});

test("candlestick included overlay validation is independent of fixed and visible domain selection", () => {
  const viewport = { from: 1.5, to: 2.5 };
  for (const domain of [undefined, [1, 100]]) {
    const fixed = domain === undefined ? {} : { domain };
    assert.throws(
      () =>
        Chart.getCandlestickPriceDomain(points, {
          viewport,
          ...fixed,
          overlayValues: [Number.NaN],
        }),
      /overlayValues\[0\].*finite/,
    );
    assert.throws(
      () =>
        Chart.getCandlestickPriceDomain(points, {
          viewport,
          ...fixed,
          scale: "log",
          overlayValues: [0],
        }),
      /overlayValues\[0\].*positive/,
    );
    assert.throws(
      () =>
        Chart.getCandlestickPriceDomain(points, {
          viewport,
          ...fixed,
          bounds: [1, 100],
          overlayValues: [101],
        }),
      /overlayValues\[0\].*bounds/,
    );
  }
});
