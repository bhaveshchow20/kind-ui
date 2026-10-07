import assert from "node:assert/strict";
import test from "node:test";
import { ensureGitHubRelease, releaseEntry } from "./github-release.mjs";

const input = {
  manifest: { name: "@kind-ui/charts", version: "0.3.0" },
  changelog:
    "# @kind-ui/charts\n\n## 0.3.0\n\n### Minor Changes\n\n- New materials.\n\n## 0.2.0\n\n- Older change.\n",
  version: "0.3.0",
  commit: "a".repeat(40),
  filename: "kind-ui-charts-0.3.0.tgz",
  sha256: "b".repeat(64),
  integrity: `sha512-${Buffer.alloc(64, 1).toString("base64")}`,
};
const entry = releaseEntry(input);
const tag = { ref: `refs/tags/${entry.tag_name}`, object: { type: "commit", sha: input.commit } };

function github({ ref = null, release = null, annotated = null, failRelease = false } = {}) {
  const writes = [];
  const request = async (method, path, body) => {
    if (method === "GET") {
      if (path.startsWith("git/ref/")) return ref;
      if (path.startsWith("git/tags/")) return annotated;
      if (path.startsWith("releases/tags/")) return release;
    }
    writes.push({ path, body });
    if (path === "git/refs") {
      ref = structuredClone(tag);
      return ref;
    }
    if (path === "releases") {
      if (failRelease) throw Error("GitHub unavailable");
      release = body;
      return release;
    }
    throw Error(`Unexpected request: ${method} ${path}`);
  };
  return { request, writes };
}

test("notes contain only this changelog section and exact verified artifact metadata", () => {
  assert.equal(entry.tag_name, "@kind-ui/charts@0.3.0");
  assert.equal(entry.target_commitish, input.commit);
  assert.ok(entry.body.startsWith("### Minor Changes\n\n- New materials."));
  assert.ok(!entry.body.includes("Older change"));
  for (const field of ["version", "commit", "filename", "sha256", "integrity"])
    assert.ok(entry.body.includes(input[field]));
});

test("rejects mismatched candidate versions, filenames and missing/duplicate changelog sections", () => {
  for (const patch of [
    { version: "0.2.0" },
    { filename: "kind-ui-charts-0.2.0.tgz" },
    { sha256: "invalid" },
    { integrity: "invalid" },
    { changelog: "## 0.2.0\n\nOld." },
    { changelog: "## 0.3.0\n" },
    { changelog: `${input.changelog}\n## 0.3.0\n\nDuplicate.` },
  ])
    assert.throws(() => releaseEntry({ ...input, ...patch }));
});

test("creates an exact commit tag then its release; identical reruns perform no writes", async () => {
  const api = github();
  assert.equal(await ensureGitHubRelease(entry, api.request), "released");
  assert.deepEqual(
    api.writes.map((write) => write.path),
    ["git/refs", "releases"],
  );
  assert.deepEqual(api.writes[0].body, { ref: tag.ref, sha: input.commit });
  assert.equal(await ensureGitHubRelease(entry, api.request), "already-released");
  assert.equal(api.writes.length, 2);
});

test("recovers a matching tag left by a failed release request", async () => {
  const failed = github({ failRelease: true });
  await assert.rejects(() => ensureGitHubRelease(entry, failed.request), /unavailable/);
  const retry = github({ ref: tag });
  assert.equal(await ensureGitHubRelease(entry, retry.request), "released");
  assert.deepEqual(
    retry.writes.map((write) => write.path),
    ["releases"],
  );
});

test("resolves annotated tags before accepting an existing release", async () => {
  const api = github({
    ref: { ...tag, object: { type: "tag", sha: "c".repeat(40) } },
    annotated: { object: tag.object },
    release: entry,
  });
  assert.equal(await ensureGitHubRelease(entry, api.request), "already-released");
  assert.equal(api.writes.length, 0);
});

test("refuses conflicting tag commits and existing release metadata without writing", async () => {
  for (const state of [
    { ref: { ...tag, object: { type: "commit", sha: "d".repeat(40) } } },
    { release: entry },
    ...["tag_name", "target_commitish", "name", "body", "draft", "prerelease"].map((field) => ({
      ref: tag,
      release: { ...entry, [field]: "conflict" },
    })),
  ]) {
    const api = github(state);
    await assert.rejects(() => ensureGitHubRelease(entry, api.request));
    assert.equal(api.writes.length, 0);
  }
});
