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
  "CHANGELOG.md",
  "LICENSE",
  "dist/index.js",
  "dist/index.d.ts",
  "dist/styles.css",
];

test("accepts the declared packed contract", () => assertPackageContract(manifest, files));
test("requires runtime and declarations for every source module", () => {
  const sources = ["index.ts", "nested/series.tsx"];
  const complete = [...files, "dist/nested/series.js", "dist/nested/series.d.ts"];
  assertPackageContract(manifest, complete, sources);
  for (const missing of ["dist/nested/series.js", "dist/nested/series.d.ts"]) {
    assert.throws(
      () =>
        assertPackageContract(
          manifest,
          complete.filter((file) => file !== missing),
          sources,
        ),
      /Missing packed file/,
    );
  }
});
for (const missing of [
  "dist/index.js",
  "dist/index.d.ts",
  "dist/styles.css",
  "LICENSE",
  "README.md",
  "CHANGELOG.md",
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
for (const privateFlag of [true, false]) {
  test(`rejects an unreviewed private flag ${privateFlag}`, () => {
    assert.throws(
      () => assertPackageContract({ ...manifest, private: privateFlag }, files),
      /private flag/,
    );
  });
}
for (const version of ["0.0.0", "0.1.0", "0.1.2", "0.2.0", "1.0.0", "0.1.1-preview.1"]) {
  test(`rejects unreviewed candidate version ${version}`, () => {
    assert.throws(
      () => assertPackageContract({ ...manifest, version }, files),
      /reviewed public candidate/,
    );
  });
}
test("rejects missing or incorrect source metadata", () => {
  assert.throws(
    () => assertPackageContract({ ...manifest, repository: undefined }, files),
    /provenance/,
  );
  assert.throws(() => assertPackageContract({ ...manifest, description: "" }, files), /purpose/);
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
          exports: { ".": manifest.exports["."] },
        },
        files,
      ),
    /CSS export/,
  );
});

test("rejects optional Motion", () => {
  assert.throws(
    () =>
      assertPackageContract(
        { ...manifest, peerDependenciesMeta: { motion: { optional: true } } },
        files,
      ),
    /required/,
  );
});
