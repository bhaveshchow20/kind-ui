import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { changesetStatus, pendingChangesets } from "./prepare-release-version.mjs";
import {
  assertReleaseContext,
  assertReleaseTransition,
  assertReviewedVersion,
  chartsVersionPlan,
  publishedReleaseDecision,
} from "./release-plan.mjs";
import {
  packageIdentitySchema,
  parseJson,
  registryMetadataSchema,
  reviewedVersionSchema,
  workspaceManifestSchema,
} from "./tooling-schemas.mjs";

/** @typedef {import("zod").infer<typeof reviewedVersionSchema>} ReviewedVersion */

export async function publicPackageMetadata(fetcher = fetch) {
  const response = await fetcher("https://registry.npmjs.org/@kind-ui%2Fcharts", {
    headers: { "cache-control": "no-cache" },
  });
  if (response.status === 404) return null;
  assert.equal(response.status, 200, "Registry errors are not proof that a version is absent");
  /** @type {unknown} */
  const metadata = await response.json();
  return registryMetadataSchema.parse(metadata);
}

/** @param {string} root @param {string} commit @param {ReviewedVersion} policy @param {string} [cli] */
export async function reviewedTransitionParent(
  root,
  commit,
  policy,
  cli = join(root, "node_modules/@changesets/cli/bin.js"),
) {
  assert.match(commit, /^[a-f0-9]{40}$/);
  /** @param {string[]} args */
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  /** @param {string} revision */
  const manifestAt = (revision) =>
    packageIdentitySchema.parse(
      parseJson(git(["show", `${revision}:packages/charts/package.json`])),
    );
  /** @param {string} revision */
  const policyAt = (revision) =>
    reviewedVersionSchema.parse(
      parseJson(git(["show", `${revision}:.changeset/release-version.json`])),
    );
  const candidates = git([
    "log",
    "--full-history",
    "--format=%H",
    commit,
    "--",
    "packages/charts/package.json",
    ".changeset/release-version.json",
  ]).split("\n");
  const matches = [];
  for (const candidate of candidates) {
    const parents = git(["show", "-s", "--format=%P", candidate]).split(" ");
    if (!parents[0] || parents.length !== 1) continue;
    const manifest = manifestAt(candidate);
    if (manifest.version !== policy.version) continue;
    const previous = manifestAt(parents[0]);
    if (previous.version !== policy.previousVersion) continue;
    if (!isDeepStrictEqual(policyAt(candidate), policy)) continue;
    const status = await previousVersionStatus(root, parents[0], cli);
    // A coordinated stack merge's main parent may have no pending changesets.
    // The reachable version commit must still consume the exact reviewed plan.
    if (!status.releases.length) continue;
    assert.deepEqual(
      chartsVersionPlan(status, previous),
      policy,
      "Reachable version commit must consume the reviewed plan",
    );
    matches.push({ previousCommit: parents[0], previous, status, versionCommit: candidate });
  }
  assert.equal(matches.length, 1, "Require one reachable exact reviewed Changesets transition");
  const transition = matches[0];
  assert.ok(transition, "Require a reviewed Changesets transition");
  return transition;
}

/** @param {string} root @param {string} commit @param {string} releaseCommit @param {ReviewedVersion} policy @param {unknown} manifest */
export function assertRecoverySource(root, commit, releaseCommit, policy, manifest) {
  assert.match(releaseCommit, /^[a-f0-9]{40}$/, "Recovery needs an immutable release merge commit");
  /** @param {string[]} args */
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  execFileSync("git", ["merge-base", "--is-ancestor", releaseCommit, commit], { cwd: root });
  const original = packageIdentitySchema.parse(
    parseJson(git(["show", `${releaseCommit}:packages/charts/package.json`])),
  );
  const previous = packageIdentitySchema.parse(
    parseJson(git(["show", `${releaseCommit}^1:packages/charts/package.json`])),
  );
  assert.equal(
    previous.version,
    policy.previousVersion,
    "Recovery must name the reviewed version transition",
  );
  assert.notEqual(original.version, previous.version, "Recovery must name a version transition");
  assert.deepEqual(original, manifest, "Recovery must retain the reviewed package manifest");
  assert.deepEqual(
    reviewedVersionSchema.parse(
      parseJson(git(["show", `${releaseCommit}:.changeset/release-version.json`])),
    ),
    policy,
    "Recovery must retain the reviewed release policy",
  );
  assert.equal(
    git(["diff", "--name-only", releaseCommit, commit, "--", "packages/charts"]),
    "",
    "Package changes after the release transition require a new reviewed version",
  );
}

/** @param {string} root @param {string} previousCommit @param {string} [cli] */
export async function previousVersionStatus(
  root,
  previousCommit,
  cli = join(root, "node_modules/@changesets/cli/bin.js"),
) {
  const scratch = await mkdtemp(join(tmpdir(), "kind-release-parent-"));
  /** @param {string[]} args */
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
  const manifest = packageIdentitySchema.parse(
    parseJson(await readFile(join(root, "packages/charts/package.json"), "utf8")),
  );
  const workspace = workspaceManifestSchema.parse(
    parseJson(await readFile(join(root, "package.json"), "utf8")),
  );
  assert.equal(workspace.private, true);
  assert.equal(workspace.version, "0.0.0");
  const policy = reviewedVersionSchema.parse(
    parseJson(await readFile(join(root, ".changeset/release-version.json"), "utf8")),
  );
  assertReviewedVersion(policy, manifest);
  if (process.env.RELEASE_VERSION)
    assert.equal(
      process.env.RELEASE_VERSION,
      manifest.version,
      "Dispatch version must match the reviewed candidate",
    );
  assert.equal(process.env.RELEASE_TAG || "latest", "latest", "Stable releases use latest");
  const commit = process.env.GITHUB_SHA;
  assert.ok(commit, "GITHUB_SHA is required");
  assert.match(commit, /^[a-f0-9]{40}$/);
  const previousCommit = execFileSync("git", ["rev-parse", `${commit}^1`], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  const previous = packageIdentitySchema.parse(
    parseJson(
      execFileSync("git", ["show", `${previousCommit}:packages/charts/package.json`], {
        cwd: root,
        encoding: "utf8",
      }),
    ),
  );
  const changed = previous.version !== manifest.version;
  const recovery = process.env.RELEASE_COMMIT || "";
  if (recovery) {
    assert.equal(process.env.GITHUB_EVENT_NAME, "workflow_dispatch");
    assert.equal(process.env.RELEASE_VERSION, manifest.version, "Recovery needs the exact version");
    assertRecoverySource(root, commit, recovery, policy, manifest);
  }
  const validate = changed || process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
  let publish = false;
  if (changed || recovery) {
    const transition = await reviewedTransitionParent(root, recovery || commit, policy);
    assertReleaseTransition({
      policy,
      manifest,
      previous: transition.previous,
      status: transition.status,
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
