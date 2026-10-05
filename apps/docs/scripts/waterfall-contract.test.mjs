import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { computeWaterfallData } from "@kind-ui/charts";
import ts from "typescript";

const bundles = JSON.parse(readFileSync("generated/waterfall-examples.json", "utf8"));
test("every Waterfall hidden row matches arithmetic from the copied public inputs", () => {
  for (const bundle of Object.values(bundles)) {
    const source = bundle.files[`src/examples/${bundle.id}/example.tsx`];
    const entries = source.match(
      /const entries = ([\s\S]*?) satisfies Chart.WaterfallEntry\[\];/,
    )[1];
    const js = ts.transpile(`const entries = ${entries};`, { target: ts.ScriptTarget.ES2022 });
    const inputs = new Function(`${js}\nreturn entries;`)();
    const rows = computeWaterfallData(inputs).map(({ id, label, kind, value, start, balance }) => ({
      id,
      label,
      kind,
      value: value ?? "Unknown",
      start: start ?? "Unknown",
      balance: balance ?? "Unknown",
    }));
    assert.deepEqual(bundle.dataAlternative.rows, rows);
    assert.match(source, /role="status"/);
    assert.match(source, /aria-live="polite"/);
    assert.match(source, /<Chart.WaterfallConnectors\s+data={data}/);
    assert.match(source, /filterNull={false}/);
  }
  const missing = bundles["waterfall-missing"].dataAlternative.rows;
  assert.equal(missing.find((r) => r.id === "fees").value, -10);
  assert.equal(missing.find((r) => r.id === "fees").balance, "Unknown");
  assert.equal(missing.find((r) => r.id === "adjustment").value, 0);
  assert.equal(missing.find((r) => r.id === "closing").balance, 105);
});
