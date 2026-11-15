import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const emitted = ts.transpileModule(read("../lib/market-candlestick-source.ts"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { marketCandlestickSource } = await import(
  `data:text/javascript;base64,${Buffer.from(emitted).toString("base64")}`
);

test("copied streaming example equals the rendered component with explicit consumer inputs", () => {
  const component = read("../components/market-candlestick-chart.tsx").replace(
    'import type { DemoOptions } from "@/lib/demo-options";\n',
    "",
  );
  const parsed = ts.createSourceFile(
    "market.tsx",
    component,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const implementation = parsed.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === "MarketCandlestickChart",
  );
  assert.ok(implementation?.body);
  const bodyStart = implementation.body.getStart(parsed);
  for (const animate of [false, true]) {
    const colors = ["#087f68", "#c43d54", "#53657b"];
    const options = { showLabels: false, width: 9, strokeWidth: 2 };
    const expected =
      component.slice(0, implementation.getStart(parsed)) +
      `export function Example() {\n  const colors = ${JSON.stringify(colors)};\n  const animate = ${animate};\n  const options = ${JSON.stringify(options)} as { showGrid?: boolean; showLabels?: boolean; width?: number; strokeWidth?: number };\n` +
      component.slice(bodyStart + 2);
    assert.equal(marketCandlestickSource(colors, animate, options), expected);
  }
});
