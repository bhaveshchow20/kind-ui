import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { changesetStatus, pendingChangesets } from "./prepare-release-version.mjs";
import {
  assertReleaseContext,
  assertReleaseTransition,
  assertReviewedVersion,
  publishedReleaseDecision,
} from "./release-plan.mjs";

export async function publicPackageMetadata(fetcher = fetch) {
  const response = await fetcher("https://registry.npmjs.org/@kind-ui%2Fcharts", {
    headers: { "cache-control": "no-cache" },
  });
  if (response.status === 404) return null;
  assert.equal(response.status, 200, "Registry errors are not proof that a version is absent");
  return response.json();
}

export async function previousVersionStatus(
  root,
  previousCommit,
  cli = join(root, "node_modules/@changesets/cli/bin.js"),
) {
  const scratch = await mkdtemp(join(tmpdir(), "kind-release-parent-"));
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  try {
    const files = git(["ls-tree", "-r", "--name-only", previousCommit])
      .split("\n")
      .filter(
        (path) =>
          path === "package.json" ||
          path === "package-lock.json" ||
          /^packages\/[^/]+\/package.json$/.test(path) ||
          path === ".changeset/config.json" ||
          /^\.changeset\/[^/]+\.md$/.test(path),
      );
    for (const file of files) {
      await mkdir(dirname(join(scratch, file)), { recursive: true });
      await writeFile(join(scratch, file), git(["show", `${previousCommit}:${file}`]));
    }
    execFileSync("git", ["init", "-b", "main"], { cwd: scratch, stdio: "ignore" });
    execFileSync("git", ["add", "."], { cwd: scratch });
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Release fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "commit",
        "-m",
        "Version parent",
      ],
      { cwd: scratch, stdio: "ignore" },
    );
    return await changesetStatus(scratch, cli);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

const root = fileURLToPath(new URL("../", import.meta.url));
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assertReleaseContext({
    repository: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF,
    event: process.env.GITHUB_EVENT_NAME,
  });
  const manifest = JSON.parse(await readFile(join(root, "packages/charts/package.json")));
  const workspace = JSON.parse(await readFile(join(root, "package.json")));
  assert.equal(workspace.private, true);
  assert.equal(workspace.version, "0.0.0");
  const policy = JSON.parse(await readFile(join(root, ".changeset/release-version.json")));
  assertReviewedVersion(policy, manifest);
  if (process.env.RELEASE_VERSION)
    assert.equal(
      process.env.RELEASE_VERSION,
      manifest.version,
      "Dispatch version must match the reviewed candidate",
    );
  assert.equal(process.env.RELEASE_TAG || "latest", "latest", "Stable releases use latest");
  const commit = process.env.GITHUB_SHA;
  assert.match(commit, /^[a-f0-9]{40}$/);
  const previousCommit = execFileSync("git", ["rev-parse", `${commit}^1`], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const previous = JSON.parse(
    execFileSync("git", ["show", `${previousCommit}:packages/charts/package.json`], {
      cwd: root,
      encoding: "utf8",
    }),
  );
  const changed = previous.version !== manifest.version;
  const validate = changed || process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
  let publish = false;
  if (changed) {
    assertReleaseTransition({
      policy,
      manifest,
      previous,
      status: await previousVersionStatus(root, previousCommit),
      pending: await pendingChangesets(root),
      changelog: await readFile(join(root, "packages/charts/CHANGELOG.md"), "utf8"),
    });
    publish =
      publishedReleaseDecision(await publicPackageMetadata(), manifest.version) === "publish";
  }
  if (process.env.GITHUB_OUTPUT)
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `validate=${validate}\npublish=${publish}\nversion=${manifest.version}\ntag=latest\nevent=${process.env.GITHUB_EVENT_NAME}\n`,
    );
  console.log(JSON.stringify({ validate, publish, version: manifest.version, source: commit }));
}
