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

function github({
  ref = null,
  release = null,
  annotated = null,
  failRelease = false,
  failUpload = false,
} = {}) {
  const writes = [];
  const request = async (method, path, body) => {
    if (method === "GET") {
      if (path.startsWith("git/ref/")) return ref;
      if (path.startsWith("git/tags/")) return annotated;
      if (path.startsWith("releases/tags/")) return release?.draft === true ? null : release;
      if (path === "releases?per_page=100") return release ? [release] : [];
    }
    writes.push({ path, body });
    if (path === "git/refs") {
      ref = structuredClone(tag);
      return ref;
    }
    if (path === "releases") {
      if (failRelease) throw Error("GitHub unavailable");
      release = { ...body, id: 7, upload_url: "upload{?name,label}", assets: [] };
      return release;
    }
    if (method === "PATCH" && path === `releases/${release.id}`) {
      Object.assign(release, body);
      return release;
    }
    if (method === "DELETE" && path.startsWith("releases/assets/")) {
      release.assets = release.assets.filter((asset) => `releases/assets/${asset.id}` !== path);
      return null;
    }
    throw Error(`Unexpected request: ${method} ${path}`);
  };
  const upload = async (url, name) => {
    writes.push({ path: `upload:${name}` });
    if (failUpload) throw Error("Upload interrupted");
    assert.equal(url, "upload{?name,label}");
    release.assets.push({ id: release.assets.length + 1, name, state: "uploaded" });
  };
  return { request, upload, writes };
}

const assets = ["charts-site-0.3.0.tar.gz", "charts-site-0.3.0.tar.gz.sha256"].map((name) => ({
  name,
  data: Buffer.from(name),
}));

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

test("site assets are uploaded to a draft before the release is published", async () => {
  const api = github();
  const options = { assets, upload: api.upload };
  assert.equal(await ensureGitHubRelease(entry, api.request, options), "released");
  assert.deepEqual(
    api.writes.map((write) => write.path),
    [
      "git/refs",
      "releases",
      "upload:charts-site-0.3.0.tar.gz",
      "upload:charts-site-0.3.0.tar.gz.sha256",
      "releases/7",
    ],
  );
  assert.equal(api.writes[1].body.draft, true);
  assert.deepEqual(api.writes.at(-1).body, { draft: false });
  assert.equal(await ensureGitHubRelease(entry, api.request, options), "already-released");
  assert.equal(api.writes.length, 5);
});

test("a rerun finishes a draft left by an interrupted upload instead of creating another", async () => {
  const failed = github({ failUpload: true });
  await assert.rejects(
    () => ensureGitHubRelease(entry, failed.request, { assets, upload: failed.upload }),
    /interrupted/,
  );
  const draft = failed.writes.find((write) => write.path === "releases").body;
  const retry = github({
    ref: tag,
    release: {
      ...draft,
      id: 7,
      upload_url: "upload{?name,label}",
      assets: [{ id: 9, name: assets[0].name, state: "starter" }],
    },
  });
  assert.equal(
    await ensureGitHubRelease(entry, retry.request, { assets, upload: retry.upload }),
    "released",
  );
  assert.deepEqual(
    retry.writes.map((write) => write.path),
    [
      "releases/assets/9",
      "upload:charts-site-0.3.0.tar.gz",
      "upload:charts-site-0.3.0.tar.gz.sha256",
      "releases/7",
    ],
  );
});

test("attaches missing site assets to an existing published release", async () => {
  const api = github({
    ref: tag,
    release: { ...entry, id: 7, upload_url: "upload{?name,label}", assets: [] },
  });
  assert.equal(
    await ensureGitHubRelease(entry, api.request, { assets, upload: api.upload }),
    "already-released",
  );
  assert.deepEqual(
    api.writes.map((write) => write.path),
    ["upload:charts-site-0.3.0.tar.gz", "upload:charts-site-0.3.0.tar.gz.sha256"],
  );
});

test("refuses a leftover draft with different release metadata", async () => {
  const api = github({
    ref: tag,
    release: { ...entry, draft: true, body: "conflict", id: 7, assets: [] },
  });
  await assert.rejects(() =>
    ensureGitHubRelease(entry, api.request, { assets, upload: api.upload }),
  );
  assert.equal(api.writes.length, 0);
});
