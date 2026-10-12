import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertCompatibilityMatrix, compatibilityMatrix } from "./compatibility-matrix.mjs";
import { packageManifestSchema, parseJson } from "./tooling-schemas.mjs";

const peers = packageManifestSchema.parse(
  parseJson(readFileSync(new URL("../packages/charts/package.json", import.meta.url), "utf8")),
).peerDependencies;

test("explicit floor and selected stable rows satisfy the declared package peers", () => {
  assertCompatibilityMatrix(peers);
  assert.equal(compatibilityMatrix[0].versions.tailwindcss, "4.0.0");
  assert.equal(compatibilityMatrix[1].versions.tailwindcss, "4.3.3");
  assert.equal(compatibilityMatrix[0].versions["motion-dom"], "13.4.5");
  assert.equal(compatibilityMatrix[0].versions["motion-utils"], "13.3.0");
  assert.equal(compatibilityMatrix[1].versions["motion-dom"], "13.5.1");
  assert.equal(compatibilityMatrix[1].versions["motion-utils"], "13.5.0");
});

test("raising a peer floor requires a deliberate matrix update", () => {
  assert.throws(() => assertCompatibilityMatrix({ ...peers, motion: "^13.5.1" }), /outside/);
});

test("an in-range but nonminimum floor is rejected", () => {
  const rows = structuredClone(compatibilityMatrix);
  rows[0].versions.motion = "13.5.1";
  assert.throws(() => assertCompatibilityMatrix(peers, rows), /minimum peer/);
});

test("ranges and prereleases cannot silently replace exact stable pins", () => {
  for (const version of ["^13.5.1", "13.5.1-beta.1"]) {
    const rows = structuredClone(compatibilityMatrix);
    rows[1].versions.motion = version;
    assert.throws(() => assertCompatibilityMatrix(peers, rows), /pinned exactly|must be stable/);
  }
});

test("compiler and implementation drift fails instead of weakening a floor proof", () => {
  const rows = structuredClone(compatibilityMatrix);
  rows[0].versions["@tailwindcss/node"] = "4.3.3";
  assert.throws(() => assertCompatibilityMatrix(peers, rows), /compiler versions must match/);
  rows[0].versions["@tailwindcss/node"] = "4.0.0";
  rows[0].versions["framer-motion"] = "13.5.1";
  assert.throws(() => assertCompatibilityMatrix(peers, rows), /Motion implementation must match/);
});
