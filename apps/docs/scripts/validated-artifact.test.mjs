import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readLocalCandidate, readValidatedArtifact } from "./validated-artifact.mjs";

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "kind-docs-retained-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const directory = path.join(root, "retained");
  mkdirSync(directory);
  const manifest = { name: "@kind-ui/charts", version: "0.2.0" };
  writeFileSync(path.join(root, "package.json"), JSON.stringify(manifest));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  git("init");
  git("add", "package.json");
  git(
    "-c",
    "user.name=Docs fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "commit",
    "-m",
    "Package source",
  );
  const bytes = Buffer.from("retained validated bytes");
  const metadata = {
    filename: "kind-ui-charts-0.2.0.tgz",
    package: manifest,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
    source: {
      checkoutCommit: git("rev-parse", "HEAD"),
      pullRequestHeadCommit: null,
      pullRequestBaseCommit: null,
      dirty: false,
    },
    workflow: { event: "push", runId: "123", runAttempt: "1", runUrl: null },
    tools: { node: "v22.23.3", npm: "11.9.0", typescript: "5.9.3", vite: "8.3.1" },
  };
  writeFileSync(path.join(directory, metadata.filename), bytes);
  const save = () =>
    writeFileSync(path.join(directory, "validated-artifact.json"), JSON.stringify(metadata));
  save();
  return {
    root,
    directory,
    manifest,
    metadata,
    save,
    read: () => readValidatedArtifact(root, directory, manifest),
  };
}

test("retained artifact accepts matching hosted bytes and unchanged package source", (t) => {
  const f = fixture(t);
  const result = f.read();
  assert.equal(result.metadata.source.checkoutCommit, f.metadata.source.checkoutCommit);
  assert.equal(readFileSync(result.artifact, "utf8"), "retained validated bytes");
});

test("local candidate preserves local provenance and rejects changed package source", (t) => {
  const f = fixture(t);
  f.metadata.source.dirty = true;
  f.metadata.workflow = { event: null, runId: null, runAttempt: null, runUrl: null };
  f.save();
  const result = readLocalCandidate(f.root, f.directory, f.manifest);
  assert.equal(result.metadata.workflow.runId, null);
  assert.equal(result.metadata.source.dirty, true);
  assert.throws(f.read, /must be clean/);
  writeFileSync(
    path.join(f.root, "package.json"),
    JSON.stringify({ ...f.manifest, changed: true }),
  );
  assert.throws(() => readLocalCandidate(f.root, f.directory, f.manifest));
});

test("local candidate rejects stale identity and corrupt artifact bytes", (t) => {
  const f = fixture(t);
  f.metadata.package = { ...f.manifest, version: "0.1.1" };
  f.save();
  assert.throws(() => readLocalCandidate(f.root, f.directory, f.manifest), /version differs/);
  f.metadata.package = f.manifest;
  f.save();
  writeFileSync(path.join(f.directory, f.metadata.filename), "tampered");
  assert.throws(() => readLocalCandidate(f.root, f.directory, f.manifest), /checksum differs/);
});

test("retained artifact rejects a different package version and unsafe filename", (t) => {
  const f = fixture(t);
  f.metadata.package = { ...f.manifest, version: "0.1.1" };
  f.save();
  assert.throws(f.read, /version differs/);
  f.metadata.package = f.manifest;
  f.metadata.filename = "../kind-ui-charts-0.2.0.tgz";
  f.save();
  assert.throws(f.read, /plain tarball filename/);
});

test("retained artifact rejects corrupt bytes and mismatched npm integrity", (t) => {
  const f = fixture(t);
  f.metadata.integrity = "sha512-wrong";
  f.save();
  assert.throws(f.read, /integrity differs/);
  f.metadata.integrity = `sha512-${createHash("sha512").update("retained validated bytes").digest("base64")}`;
  f.save();
  writeFileSync(path.join(f.directory, f.metadata.filename), "tampered");
  assert.throws(f.read, /checksum differs/);
});

test("retained artifact rejects dirty or changed source and the wrong Node gate", (t) => {
  const f = fixture(t);
  f.metadata.source.dirty = true;
  f.save();
  assert.throws(f.read, /must be clean/);
  f.metadata.source.dirty = false;
  f.metadata.tools.node = "v24.19.0";
  f.save();
  assert.throws(f.read, /Node 22/);
  f.metadata.tools.node = "v22.23.3";
  f.save();
  writeFileSync(
    path.join(f.root, "package.json"),
    JSON.stringify({ ...f.manifest, changed: true }),
  );
  assert.throws(f.read);
});

for (const [field, invalid] of [
  ["source", null],
  ["workflow", []],
  ["package", { version: 12 }],
  ["sha256", false],
]) {
  test(`retained artifact rejects malformed ${field} before using the receipt`, (t) => {
    const f = fixture(t);
    f.metadata[field] = invalid;
    f.save();
    assert.throws(f.read, /invalid_type/);
  });
}
