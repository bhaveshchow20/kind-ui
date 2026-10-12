import assert from "node:assert/strict";
import test from "node:test";
import * as Chart from "@kind-ui/charts";

const data = (values) =>
  values.map((value, index) => ({ id: String(index), label: `Stage ${index}`, value }));

test("funnel exposes a public model preserving ordered records and unknown values", () => {
  assert.equal(typeof Chart.createFunnelModel, "function");
  const records = data([20, 35.5, null, undefined, 0]);
  const model = Chart.createFunnelModel({ data: records });
  assert.equal(model.maximum, 35.5);
  assert.equal(model.scaleMax, 35.5);
  assert.deepEqual(
    model.stages.map((stage) => stage.value),
    [20, 35.5, null, null, 0],
  );
  for (const [index, stage] of model.stages.entries()) {
    assert.equal(stage.datum, records[index]);
    assert.equal(stage.index, index);
    assert.equal(stage.denominator, null);
    assert.equal(stage.ratio, null);
  }
});

test("funnel first and immediate previous ratios preserve growth and missing denominators", () => {
  const records = data([100, 175, null, 0, 25]);
  const first = Chart.createFunnelModel({ data: records, denominator: "first" });
  assert.deepEqual(
    first.stages.map((stage) => stage.ratio),
    [1, 1.75, null, 0, 0.25],
  );
  const previous = Chart.createFunnelModel({ data: records, denominator: "previous" });
  assert.deepEqual(
    previous.stages.map((stage) => stage.denominator),
    [null, 100, 175, null, 0],
  );
  assert.deepEqual(
    previous.stages.map((stage) => stage.ratio),
    [null, 1.75, null, null, null],
  );
  assert.deepEqual(
    Chart.createFunnelModel({ data: data([0, 1]), denominator: "first" }).stages.map(
      (stage) => stage.ratio,
    ),
    [null, null],
  );
});

test("funnel custom records and denominators retain typed metadata and canonical stage context", () => {
  const records = [
    { key: "signed-up", title: "Signed up", amount: 12.5, eligible: 25, duration: 3 },
  ];
  const model = Chart.createFunnelModel({
    data: records,
    accessors: {
      id: (record) => record.key,
      label: (record) => record.title,
      value: (record) => record.amount,
    },
    denominator: (stage, index, stages) => {
      assert.equal(stage, stages[index]);
      assert.equal(stage.datum, records[index]);
      assert.equal(stage.ratio, null);
      return stage.datum.eligible;
    },
  });
  assert.equal(model.stages[0].ratio, 0.5);
  assert.equal(model.stages[0].datum.duration, 3);
  assert.equal(Chart.createFunnelModel({ data: data([5]), denominator: 10 }).stages[0].ratio, 0.5);
  assert.equal(
    Chart.createFunnelModel({ data: data([5]), denominator: () => undefined }).stages[0].ratio,
    null,
  );
});

test("funnel shared scale and empty or all-zero domains stay finite", () => {
  for (const records of [[], data([0]), data([null, undefined])]) {
    const model = Chart.createFunnelModel({ data: records });
    assert.equal(model.maximum, 0);
    assert.equal(model.scaleMax, 1);
  }
  assert.equal(Chart.createFunnelModel({ data: data([50, 100]), scaleMax: 200 }).scaleMax, 200);
  assert.equal(
    Chart.createFunnelModel({ data: data([Number.MAX_VALUE, Number.MAX_VALUE]) }).maximum,
    Number.MAX_VALUE,
  );
  assert.equal(
    Chart.createFunnelModel({ data: data([Number.MIN_VALUE]) }).scaleMax,
    Number.MIN_VALUE,
  );
});

test("funnel rejects malformed records and geometry or ratio options with actionable errors", () => {
  for (const options of [null, undefined, [], 1])
    assert.throws(() => Chart.createFunnelModel(options), /Funnel options must be an object/);
  for (const records of [null, undefined, {}, "data"])
    assert.throws(() => Chart.createFunnelModel({ data: records }), /Funnel data must be an array/);
  for (const record of [null, undefined, [], 1])
    assert.throws(() => Chart.createFunnelModel({ data: [record] }), /data\[0\].*datum object/);
  assert.throws(() => Chart.createFunnelModel({ data: Array(1) }), /data\[0\]/);
  for (const id of ["", "   ", 1, null])
    assert.throws(
      () => Chart.createFunnelModel({ data: [{ id, label: "A", value: 1 }] }),
      /data\[0\].id/,
    );
  assert.throws(() => Chart.createFunnelModel({ data: [...data([1]), ...data([2])] }), /unique/);
  assert.throws(
    () => Chart.createFunnelModel({ data: [{ id: "a", label: 5, value: 1 }] }),
    /data\[0\].label/,
  );
  for (const value of [-1, NaN, Infinity, -Infinity, "5"])
    assert.throws(() => Chart.createFunnelModel({ data: data([value]) }), /data\[0\].value/);
  for (const scaleMax of [0, -1, NaN, Infinity, 5, "10"])
    assert.throws(() => Chart.createFunnelModel({ data: data([10]), scaleMax }), /scaleMax/);
  for (const denominator of [-1, NaN, Infinity, "all", {}])
    assert.throws(() => Chart.createFunnelModel({ data: data([1]), denominator }), /denominator/);
  for (const denominator of [-1, NaN, Infinity, "5"])
    assert.throws(
      () => Chart.createFunnelModel({ data: data([1]), denominator: () => denominator }),
      /denominator/,
    );
  for (const accessors of [null, {}, { id: "id", label: () => "A", value: () => 1 }])
    assert.throws(() => Chart.createFunnelModel({ data: [], accessors }), /accessors/);
});

test("funnel rejects positive normalized or ratio underflow and overflow instead of losing values", () => {
  assert.throws(
    () => Chart.createFunnelModel({ data: data([Number.MIN_VALUE, Number.MAX_VALUE]) }),
    /rescale/i,
  );
  assert.throws(
    () => Chart.createFunnelModel({ data: data([Number.MIN_VALUE]), scaleMax: Number.MAX_VALUE }),
    /rescale/i,
  );
  assert.throws(
    () =>
      Chart.createFunnelModel({ data: data([Number.MAX_VALUE]), denominator: Number.MIN_VALUE }),
    /rescale/i,
  );
  assert.throws(
    () =>
      Chart.createFunnelModel({ data: data([Number.MIN_VALUE]), denominator: Number.MAX_VALUE }),
    /rescale/i,
  );
});

test("funnel keeps prototype-like IDs and rejects sparse custom records or null scales", () => {
  const records = ["__proto__", "constructor", "toString"].map((id) => ({
    id,
    label: id,
    value: 1,
  }));
  assert.deepEqual(
    Chart.createFunnelModel({ data: records }).stages.map((stage) => stage.id),
    records.map((record) => record.id),
  );
  assert.throws(() => Chart.createFunnelModel({ data: data([1]), scaleMax: null }), /scaleMax/);
  assert.throws(
    () =>
      Chart.createFunnelModel({
        data: Array(1),
        accessors: { id: () => "A", label: () => "A", value: () => 1 },
      }),
    /data\[0\]/,
  );
});
