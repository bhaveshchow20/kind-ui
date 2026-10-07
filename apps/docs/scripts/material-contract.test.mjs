import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { families } from "../examples/catalog.mjs";

test("material selectors start with Default and retain public Clay and Glow variants", () => {
  const selectors = families.flatMap((family) =>
    Object.entries(family.variants ?? {}).filter(([, variant]) =>
      ["material", "finish"].includes(variant.prop),
    ),
  );
  assert.equal(selectors.length, 11);
  for (const [id, variant] of selectors) {
    assert.equal(variant.default, "plain", id);
    assert.deepEqual(
      variant.options.map(({ value, label }) => [value, label]),
      [
        ["plain", "Default"],
        ["clay", "Clay"],
        ["glow", "Glow"],
      ],
      id,
    );
    const source = readFileSync(new URL(`../examples/${id}/example.tsx`, import.meta.url), "utf8");
    assert.ok(source.includes(`${variant.prop} = "plain"`), `${id} standalone default`);
  }
});
