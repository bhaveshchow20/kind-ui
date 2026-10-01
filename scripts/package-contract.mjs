import assert from "node:assert/strict";

export function assertPackageContract(manifest, files) {
  assert.equal(manifest.private, true, "Package must remain private");
  assert.equal(manifest.type, "module", "Package must declare ESM");
  const entry = manifest.exports?.["."];
  assert.ok(entry && typeof entry === "object", "Root export must declare import and types");
  assert.equal(manifest.types, entry.types, "Top-level types must match the root export");
  const required = ["package.json", "README.md", "LICENSE"];
  for (const [condition, suffix] of [
    ["import", ".js"],
    ["types", ".d.ts"],
  ]) {
    const target = entry[condition];
    assert.ok(
      typeof target === "string" && target.startsWith("./dist/") && target.endsWith(suffix),
      `${condition} must point to a built ${suffix} file in dist/`,
    );
    required.push(target.slice(2));
  }
  assert.equal(
    manifest.exports["./styles.css"],
    "./dist/styles.css",
    "CSS export must point to dist/styles.css",
  );
  assert.deepEqual(manifest.sideEffects, ["**/*.css"], "CSS imports must remain side effects");
  required.push("dist/styles.css");
  const allowed =
    /^(package\.json|README\.md|LICENSE|dist\/styles\.css|dist\/(?:[^/.][^/]*\/)*[^/.][^/]*\.(js|d\.ts))$/;
  for (const file of files) {
    assert.ok(allowed.test(file), `Unexpected packed file: ${file}`);
    assert.ok(!file.split("/").includes("node_modules"), `Nested dependency in package: ${file}`);
  }
  for (const file of required) assert.ok(files.includes(file), `Missing packed file: ${file}`);
}
