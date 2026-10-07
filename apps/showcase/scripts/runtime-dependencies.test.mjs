import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const manifestURL = new URL("../package.json", import.meta.url);
const manifest = JSON.parse(readFileSync(manifestURL, "utf8"));
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const require = createRequire(manifestURL);

test("the showcase pins React-compatible fragment detection as a production dependency", () => {
  // Recharts uses react-is to discover color Cells inside React fragments.
  assert.equal(manifest.dependencies["react-is"], manifest.dependencies.react);
  assert.equal(lock.packages[""].dependencies["react-is"], manifest.dependencies.react);
  assert.equal(lock.packages["node_modules/react-is"].version, manifest.dependencies.react);
  assert.notEqual(lock.packages["node_modules/react-is"].dev, true);
  const { createElement, Fragment } = require("react");
  const { isFragment } = require("react-is");
  assert.equal(isFragment(createElement(Fragment)), true);
});
