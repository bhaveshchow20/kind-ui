import assert from "node:assert/strict";

export function assertPackageContract(manifest, files, sources = []) {
  assert.equal(manifest.private, true, "Package must remain private");
  assert.equal(manifest.version, "0.0.0", "Version requires separate release authorization");
  assert.ok(manifest.description?.trim(), "Package must describe its purpose");
  assert.equal(manifest.license, "MIT", "Package must declare its license");
  assert.deepEqual(
    manifest.repository,
    {
      type: "git",
      url: "git+https://github.com/bhaveshchow20/kind-ui.git",
      directory: "packages/charts",
    },
    "Repository metadata must identify the package source for provenance",
  );
  assert.equal(manifest.bugs?.url, "https://github.com/bhaveshchow20/kind-ui/issues");
  assert.equal(
    manifest.homepage,
    "https://github.com/bhaveshchow20/kind-ui/tree/main/packages/charts#readme",
  );
  assert.equal(manifest.type, "module", "Package must declare ESM");
  const entry = manifest.exports?.["."];
  assert.ok(entry && typeof entry === "object", "Root export must declare import and types");
  assert.equal(manifest.types, entry.types, "Top-level types must match the root export");
  const required = ["package.json", "README.md", "LICENSE"];
  assert.equal(manifest.exports["./motion"], undefined, "Motion subpath must not be public");
  assert.ok(manifest.peerDependencies.motion, "Motion peer must be declared");
  assert.notEqual(manifest.peerDependenciesMeta?.motion?.optional, true, "Motion must be required");
  for (const [name, exported] of Object.entries(manifest.exports)) {
    if (name === "./styles.css") continue;
    for (const [condition, suffix] of [
      ["import", ".js"],
      ["types", ".d.ts"],
    ]) {
      const target = exported[condition];
      assert.ok(
        typeof target === "string" && target.startsWith("./dist/") && target.endsWith(suffix),
        `${name} ${condition} must point to a built ${suffix} file in dist/`,
      );
      required.push(target.slice(2));
    }
  }
  assert.equal(
    manifest.exports["./styles.css"],
    "./dist/styles.css",
    "CSS export must point to dist/styles.css",
  );
  assert.deepEqual(manifest.sideEffects, ["**/*.css"], "CSS imports must remain side effects");
  required.push("dist/styles.css");
  for (const source of sources) {
    assert.ok(/\.tsx?$/.test(source) && !source.endsWith(".d.ts"), `Unexpected source: ${source}`);
    const stem = source.replace(/\.tsx?$/, "");
    required.push(`dist/${stem}.js`, `dist/${stem}.d.ts`);
  }
  const allowed =
    /^(package\.json|README\.md|LICENSE|dist\/styles\.css|dist\/(?:[^/.][^/]*\/)*[^/.][^/]*\.(js|d\.ts))$/;
  for (const file of files) {
    assert.ok(allowed.test(file), `Unexpected packed file: ${file}`);
    assert.ok(!file.split("/").includes("node_modules"), `Nested dependency in package: ${file}`);
  }
  for (const file of required) assert.ok(files.includes(file), `Missing packed file: ${file}`);
}
