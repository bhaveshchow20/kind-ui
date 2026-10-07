import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";

const source = await readFile(
  new URL("../packages/charts/src/line-dash.ts", import.meta.url),
  "utf8",
);
const { dashCycle, dashDuration } = await import(
  `data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(source))}`
);
test("numeric dash cycles repeat odd lists and reject consumer-owned patterns", () => {
  for (const [pattern, expected] of [
    ["6 4", 10],
    ["3,2,1", 12],
    [4, 8],
    ["0 .5", 0.5],
  ])
    assert.equal(dashCycle(pattern), expected);
  for (const pattern of [
    undefined,
    "",
    "none",
    "0 0",
    "-1 4",
    "6px 4px",
    "5% 2%",
    "var(--dash)",
    "NaN",
    "Infinity",
  ])
    assert.equal(dashCycle(pattern), undefined);
});
test("timing is bounded to finite positive duration without mutating options", () => {
  const options = Object.freeze({ durationMs: 800, direction: "reverse" });
  assert.equal(dashDuration(options), 800);
  assert.equal(dashDuration({}), 1000);
  for (const durationMs of [0, -1, NaN, Infinity])
    assert.equal(dashDuration({ durationMs }), undefined);
});
test("dash ownership excludes custom shapes, hidden marks and native entrance", async () => {
  const line = await readFile(
    new URL("../packages/charts/src/line-series.tsx", import.meta.url),
    "utf8",
  );
  assert.match(line, /!effectiveHide/);
  assert.match(line, /props.shape === undefined &&\s+props.isAnimationActive !== true/);
  assert.match(line, /props.style\?\.strokeDasharray \?\? props.strokeDasharray/);
  assert.match(line, /props.style\?\.strokeDashoffset \?\? props.strokeDashoffset/);
  const css = await readFile(new URL("../packages/charts/src/styles.css", import.meta.url), "utf8");
  assert.match(css, /data-motion="off".*kind-ui-line-dash/);
  assert.match(css, /loading-chart-pending.*kind-ui-line-dash/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*kind-ui-line-dash/);
});
