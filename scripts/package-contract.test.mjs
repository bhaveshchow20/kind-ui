import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertPackageContract } from "./package-contract.mjs";

const manifest = JSON.parse(
  readFileSync(new URL("../packages/charts/package.json", import.meta.url), "utf8"),
);
const files = [
  "package.json",
  "README.md",
  "LICENSE",
  "dist/index.js",
  "dist/index.d.ts",
  "dist/styles.css",
  "dist/motion.js",
  "dist/motion.d.ts",
];

test("accepts the declared packed contract", () => assertPackageContract(manifest, files));
for (const missing of [
  "dist/index.js",
  "dist/index.d.ts",
  "dist/styles.css",
  "dist/motion.js",
  "dist/motion.d.ts",
  "LICENSE",
  "README.md",
]) {
  test(`rejects a missing ${missing}`, () => {
    assert.throws(
      () =>
        assertPackageContract(
          manifest,
          files.filter((file) => file !== missing),
        ),
      /Missing packed file/,
    );
  });
}
for (const extra of ["src/index.ts", ".env", "dist/.tsbuildinfo", "dist/node_modules/leak.js"]) {
  test(`rejects an unexpected ${extra}`, () => {
    assert.throws(() => assertPackageContract(manifest, [...files, extra]));
  });
}
test("rejects publication enablement", () => {
  assert.throws(() => assertPackageContract({ ...manifest, private: false }, files), /private/);
});
test("rejects CSS that bundlers may drop or consumers cannot resolve", () => {
  assert.throws(
    () => assertPackageContract({ ...manifest, sideEffects: false }, files),
    /side effects/,
  );
  assert.throws(
    () =>
      assertPackageContract(
        {
          ...manifest,
          exports: { ".": manifest.exports["."], "./motion": manifest.exports["./motion"] },
        },
        files,
      ),
    /CSS export/,
  );
});

test("rejects mandatory Motion", () => {
  assert.throws(
    () => assertPackageContract({ ...manifest, peerDependenciesMeta: {} }, files),
    /optional/,
  );
});
