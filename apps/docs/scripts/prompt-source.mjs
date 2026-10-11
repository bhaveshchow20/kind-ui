import assert from "node:assert/strict";
import { publicPath } from "../lib/routing.mjs";

/** Validate public prompt links, then fetch the same route from the candidate export. */
export function candidatePromptSource(url, origin) {
  const source = new URL(url);
  assert.equal(source.origin, "https://kindui.dev", "Copied prompts must use the deployed site");
  const prefix = "/charts/docs/";
  assert.ok(source.pathname.startsWith(`${prefix}examples/`), "Expected a deployed example URL");
  assert.equal(source.search, "");
  assert.equal(source.hash, "");
  return new URL(publicPath(`/${source.pathname.slice(prefix.length)}`), origin).href;
}
