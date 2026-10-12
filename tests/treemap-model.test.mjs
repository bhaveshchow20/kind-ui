import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTreemap } from "@kind-ui/charts";

const leaf = (id, value = 0) => ({ kind: "leaf", id, label: "Repeated label", value });
const group = (id, children) => ({ kind: "group", id, label: id, children });

test("treemap model derives totals, ancestry and explicitly named shares without changing records", () => {
  const first = leaf("first", 3);
  const second = leaf("second", 1);
  const nested = group("nested", [first, second]);
  const input = [group("root", [nested]), leaf("other", 4)];
  const model = normalizeTreemap(input);
  assert.equal(model.total, 8);
  assert.deepEqual(
    model.nodes.map((node) => node.id),
    ["root", "nested", "first", "second", "other"],
  );
  const node = model.byId.get("first");
  assert.equal(node.datum, first);
  assert.equal(node.parentId, "nested");
  assert.equal(node.depth, 2);
  assert.deepEqual(node.path, ["root", "nested", "first"]);
  assert.equal(node.rootShare, 3 / 8);
  assert.equal(node.parentShare, 3 / 4);
  assert.equal(model.roots[0].parentId, null);
  assert.equal(model.roots[0].parentShare, 1 / 2);
  assert.equal(model.byId.get("nested").value, 4);
  assert.equal(first.value, 3);
  assert.equal(input[0].children[0], nested);
});

test("treemap model preserves zero leaves, empty groups and undefined shares for zero totals", () => {
  const model = normalizeTreemap([group("empty", []), leaf("zero")]);
  assert.equal(model.total, 0);
  assert.equal(model.nodes.length, 2);
  assert.equal(model.roots[0].kind, "group");
  assert.equal(model.roots[1].kind, "leaf");
  assert.deepEqual(model.roots[0].children, []);
  for (const node of model.nodes) {
    assert.equal(node.rootShare, null);
    assert.equal(node.parentShare, null);
  }
  assert.deepEqual(normalizeTreemap([]).roots, []);
});

test("generic accessors preserve original data and evaluate area only for leaves", () => {
  const record = {
    key: "root",
    title: "Root",
    members: [{ key: "child", title: "Child", area: 7 }],
  };
  const visited = [];
  const model = normalizeTreemap([record], {
    id: (datum) => datum.key,
    label: (datum) => datum.title,
    children: (datum) => datum.members,
    value: (datum) => {
      visited.push(datum.key);
      return datum.area;
    },
  });
  assert.deepEqual(visited, ["child"]);
  assert.equal(model.roots[0].datum, record);
  assert.equal(model.roots[0].value, 7);
  assert.equal(model.byId.get("child").rootShare, 1);
});

test("treemap model rejects invalid IDs and labels with a useful location", () => {
  for (const id of ["", "  ", 1, undefined]) {
    assert.throws(() => normalizeTreemap([{ ...leaf("ok"), id }]), /Treemap.*data\[0\].*id/i);
  }
  for (const label of ["", "  ", 1, undefined]) {
    assert.throws(
      () => normalizeTreemap([group("parent", [{ ...leaf("child"), label }])]),
      /parent.*children\[0\].*label/i,
    );
  }
  assert.throws(
    () => normalizeTreemap([group("a", [leaf("duplicate")]), leaf("duplicate")]),
    /duplicate.*duplicate/i,
  );
});

test("treemap model rejects missing, nonnumeric, nonfinite and negative leaf area", () => {
  for (const value of [undefined, null, "1", Number.NaN, Number.POSITIVE_INFINITY, -1]) {
    assert.throws(
      () => normalizeTreemap([group("parent", [{ ...leaf("child"), value }])]),
      /parent.*child.*finite nonnegative/i,
    );
  }
  assert.equal(normalizeTreemap([leaf("zero", -0)]).total, 0);
});

test("treemap model rejects malformed and ambiguous standard records", () => {
  for (const children of [null, {}, "child"]) {
    assert.throws(
      () => normalizeTreemap([{ ...group("bad", []), children }]),
      /bad.*children.*array/i,
    );
  }
  assert.throws(() => normalizeTreemap([{ ...group("bad", []), value: 0 }]), /bad.*group.*value/i);
  assert.throws(
    () => normalizeTreemap([{ ...leaf("bad", 1), children: [] }]),
    /bad.*leaf.*children/i,
  );
  assert.throws(() => normalizeTreemap([{ id: "bad", label: "Bad", value: 1 }]), /bad.*kind/i);
  assert.throws(() => normalizeTreemap([null]), /data\[0\].*record/i);
  assert.throws(() => normalizeTreemap({}), /data.*array/i);
});

test("treemap model rejects cycles and reused records across branches", () => {
  const cycle = group("cycle", []);
  cycle.children.push(cycle);
  assert.throws(() => normalizeTreemap([cycle]), /cycle.*cycle/i);
  const shared = leaf("shared", 1);
  assert.throws(
    () => normalizeTreemap([group("a", [shared]), group("b", [shared])]),
    /b.*shared.*reused/i,
  );
});

test("treemap model rejects overflowing group and forest totals", () => {
  const large = Number.MAX_VALUE;
  assert.throws(
    () => normalizeTreemap([group("overflow", [leaf("a", large), leaf("b", large)])]),
    /overflow.*total.*finite/i,
  );
  assert.throws(
    () => normalizeTreemap([leaf("a", large), leaf("b", large)]),
    /data.*total.*finite/i,
  );
});

test("treemap model rejects sparse forest and child arrays with record locations", () => {
  assert.throws(() => normalizeTreemap(Array(1)), /data\[0\].*record/i);
  assert.throws(
    () => normalizeTreemap([group("parent", Array(1))]),
    /parent.*children\[0\].*record/i,
  );
});
