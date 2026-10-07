import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function releaseEntry({
  manifest,
  changelog,
  version,
  commit,
  filename,
  sha256,
  integrity,
}) {
  assert.equal(manifest.name, "@kind-ui/charts");
  assert.equal(manifest.private, undefined);
  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.version, version, "Release version differs from checkout");
  assert.match(commit, /^[a-f0-9]{40}$/);
  assert.equal(filename, `kind-ui-charts-${version}.tgz`);
  assert.match(sha256, /^[a-f0-9]{64}$/);
  assert.match(integrity, /^sha512-[A-Za-z0-9+/]+={0,2}$/);
  const sections = changelog.split(/^## /m).slice(1);
  const matches = sections.filter((section) => section.startsWith(`${version}\n`));
  assert.equal(matches.length, 1, "Expected exactly one changelog section for this version");
  const notes = matches[0].slice(version.length).trim();
  assert.ok(notes, "Release changelog section is empty");
  return {
    tag_name: `@kind-ui/charts@${version}`,
    target_commitish: commit,
    name: `@kind-ui/charts ${version}`,
    body: `${notes}\n\n### Verified npm artifact\n\n- Package: \`@kind-ui/charts@${version}\`\n- Source commit: \`${commit}\`\n- Archive: \`${filename}\`\n- SHA-256: \`${sha256}\`\n- npm integrity: \`${integrity}\`\n`,
    draft: false,
    prerelease: false,
  };
}

export async function ensureGitHubRelease(entry, request) {
  const tagPath = `git/ref/tags/${encodeURIComponent(entry.tag_name)}`;
  const releasePath = `releases/tags/${encodeURIComponent(entry.tag_name)}`;
  const existingTag = await request("GET", tagPath);
  const existingRelease = await request("GET", releasePath);
  async function assertTag(ref) {
    assert.equal(ref.ref, `refs/tags/${entry.tag_name}`);
    let object = ref.object;
    for (let depth = 0; object.type === "tag" && depth < 10; depth++) {
      assert.match(object.sha, /^[a-f0-9]{40}$/);
      object = (await request("GET", `git/tags/${object.sha}`)).object;
    }
    assert.equal(object.type, "commit", "Release tag must resolve to a commit");
    assert.equal(object.sha, entry.target_commitish, "Existing tag points to another commit");
  }
  if (existingTag) await assertTag(existingTag);
  if (existingRelease) {
    assert.ok(existingTag, "Existing release has no matching tag");
    for (const field of ["tag_name", "target_commitish", "name", "body", "draft", "prerelease"])
      assert.equal(existingRelease[field], entry[field], `Existing release differs: ${field}`);
    return "already-released";
  }
  if (!existingTag) {
    await request("POST", "git/refs", {
      ref: `refs/tags/${entry.tag_name}`,
      sha: entry.target_commitish,
    });
    await assertTag(await request("GET", tagPath));
  }
  await request("POST", "releases", entry);
  return "released";
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.env.GITHUB_REPOSITORY, "bhaveshchow20/kind-ui");
  assert.equal(process.env.GITHUB_REF, "refs/heads/main");
  assert.ok(process.env.GITHUB_TOKEN, "GitHub workflow token is required");
  assert.equal(
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    process.env.GITHUB_SHA,
  );
  const entry = releaseEntry({
    manifest: JSON.parse(await readFile("packages/charts/package.json", "utf8")),
    changelog: await readFile("packages/charts/CHANGELOG.md", "utf8"),
    version: process.env.RELEASE_VERSION,
    commit: process.env.GITHUB_SHA,
    filename: process.env.RELEASE_FILENAME,
    sha256: process.env.RELEASE_SHA256,
    integrity: process.env.RELEASE_INTEGRITY,
  });
  const request = async (method, path, body) => {
    const response = await fetch(`https://api.github.com/repos/bhaveshchow20/kind-ui/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (method === "GET" && response.status === 404) return null;
    assert.ok(response.ok, `GitHub ${method} ${path} failed (${response.status})`);
    return response.json();
  };
  console.log(await ensureGitHubRelease(entry, request));
}
