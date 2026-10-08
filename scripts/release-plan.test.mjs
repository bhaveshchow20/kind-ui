import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  assertRecoverySource,
  publicPackageMetadata,
  reviewedTransitionParent,
} from "./release-intent.mjs";
import {
  assertReleaseContext,
  assertReleaseTransition,
  assertReviewedVersion,
  chartsVersionPlan,
  publishedReleaseDecision,
} from "./release-plan.mjs";

const previous = { name: "@kind-ui/charts", version: "0.1.1" };
const manifest = { ...previous, version: "0.1.2" };
const status = {
  releases: [
    {
      name: previous.name,
      oldVersion: previous.version,
      newVersion: manifest.version,
      type: "patch",
      changesets: ["fixture-fix"],
    },
  ],
};
const policy = {
  package: previous.name,
  version: manifest.version,
  previousVersion: previous.version,
  changesets: ["fixture-fix"],
};
const transition = {
  policy,
  manifest,
  previous,
  status,
  pending: [],
  changelog: "# @kind-ui/charts\n\n## 0.1.2\n\nFixture fix\n",
};
test("the reviewed exact version changes only through a Changesets plan", () => {
  assert.deepEqual(chartsVersionPlan(status, previous), policy);
  assertReleaseTransition(transition);
  assert.throws(() => assertReviewedVersion(policy, { ...manifest, version: "0.1.3" }));
});
for (const [name, mutate] of [
  [
    "an arbitrary manifest bump",
    (t) => {
      t.manifest.version = "0.1.3";
    },
  ],
  [
    "a fabricated reviewed policy",
    (t) => {
      t.policy.version = t.manifest.version = "0.1.3";
    },
  ],
  [
    "an unconsumed changeset",
    (t) => {
      t.pending = ["later-fix.md"];
    },
  ],
  [
    "another package release",
    (t) => {
      t.status.releases.push({ ...t.status.releases[0], name: "other" });
    },
  ],
  [
    "no package changeset",
    (t) => {
      t.status.releases[0].changesets = [];
    },
  ],
  [
    "a prerelease",
    (t) => {
      t.policy.version = t.manifest.version = "0.1.2-rc.1";
    },
  ],
  [
    "a private package",
    (t) => {
      t.manifest.private = true;
    },
  ],
  [
    "a stale parent plan",
    (t) => {
      t.status.releases[0].oldVersion = "0.1.0";
    },
  ],
  [
    "a missing changelog",
    (t) => {
      t.changelog = "# @kind-ui/charts\n\n## 0.1.1\n";
    },
  ],
])
  test(`blocks release for ${name}`, () => {
    const t = structuredClone(transition);
    mutate(t);
    assert.throws(() => assertReleaseTransition(t));
  });

test("only push or explicit validation on canonical main can enter the pipeline", () => {
  const context = { repository: "bhaveshchow20/kind-ui", ref: "refs/heads/main", event: "push" };
  assertReleaseContext(context);
  assertReleaseContext({ ...context, event: "workflow_dispatch" });
  for (const bad of [
    { repository: "fork/kind-ui" },
    { ref: "refs/pull/1/merge" },
    { event: "pull_request" },
    { event: "pull_request_target" },
    { event: "workflow_run" },
  ])
    assert.throws(() => assertReleaseContext({ ...context, ...bad }));
});
test("published versions skip publication and mismatched bytes never retry", () => {
  const metadata = {
    versions: { "0.1.2": { dist: { integrity: "sha512-fixture" } } },
    "dist-tags": { latest: "0.1.2" },
  };
  assert.equal(publishedReleaseDecision(metadata, "0.1.2", "sha512-fixture"), "already-published");
  assert.throws(() => publishedReleaseDecision(metadata, "0.1.2", "sha512-different"));
  assert.throws(() => publishedReleaseDecision(metadata, "0.1.1"));
  assert.equal(publishedReleaseDecision(metadata, "0.1.3"), "publish");
  assert.equal(publishedReleaseDecision(null, "0.1.2"), "publish");
});
test("registry errors do not become absence or publication permission", async () => {
  for (const status of [401, 403, 429, 500, 503])
    await assert.rejects(publicPackageMetadata(async () => ({ status })));
  assert.equal(await publicPackageMetadata(async () => ({ status: 404 })), null);
  await assert.rejects(
    publicPackageMetadata(async () => {
      throw Error("offline");
    }),
  );
});

test("public proof waits only for propagation and rejects changed archive bytes", async () => {
  const { createHash } = await import("node:crypto");
  const { verifyPublishedRelease } = await import("./public-release.mjs");
  const bytes = Buffer.from("fixture archive");
  const integrity = `sha512-${createHash("sha512").update(bytes).digest("base64")}`;
  const metadata = {
    versions: {
      "0.1.2": {
        dist: {
          integrity,
          tarball: "https://registry.npmjs.org/@kind-ui/charts/-/charts-0.1.2.tgz",
        },
      },
    },
    "dist-tags": { latest: "0.1.2" },
  };
  let reads = 0;
  let waits = 0;
  const options = {
    readMetadata: async () => (++reads === 1 ? null : metadata),
    fetcher: async () => ({ status: 200, arrayBuffer: async () => bytes }),
    wait: async () => {
      waits++;
    },
    attempts: 2,
  };
  assert.equal((await verifyPublishedRelease("0.1.2", integrity, options)).version, "0.1.2");
  assert.equal(waits, 1);
  await assert.rejects(
    verifyPublishedRelease("0.1.2", integrity, {
      ...options,
      readMetadata: async () => metadata,
      fetcher: async () => ({ status: 200, arrayBuffer: async () => Buffer.from("tampered") }),
    }),
    /bytes differ/,
  );
  await assert.rejects(
    verifyPublishedRelease("0.1.2", integrity, { ...options, readMetadata: async () => null }),
    /did not become public/,
  );
  await assert.rejects(
    verifyPublishedRelease("0.1.2", integrity, {
      ...options,
      readMetadata: async () => {
        throw Error("registry unavailable");
      },
    }),
    /registry unavailable/,
  );
});

test("a batch of minor features and fixes selects one 0.2.0 release", () => {
  const batch = {
    releases: [
      {
        name: previous.name,
        oldVersion: previous.version,
        newVersion: "0.2.0",
        type: "minor",
        changesets: ["second-feature", "fixture-fix", "first-feature"],
      },
    ],
  };
  const next = chartsVersionPlan(batch, previous);
  assert.deepEqual(next, {
    package: previous.name,
    version: "0.2.0",
    previousVersion: "0.1.1",
    changesets: ["first-feature", "fixture-fix", "second-feature"],
  });
  assertReleaseTransition({
    previous,
    status: batch,
    manifest: { ...previous, version: "0.2.0" },
    policy: next,
    pending: [],
    changelog: "# @kind-ui/charts\n\n## 0.2.0\n\nFeatures and fixes\n",
  });
});

test("stack merges recover the exact reviewed plan from reachable version ancestry", async () => {
  const root = await mkdtemp(join(tmpdir(), "kind-stack-release-"));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const save = async (path, value) => writeFile(join(root, path), `${JSON.stringify(value)}\n`);
  const commit = (message) => {
    git("add", ".");
    git("commit", "-m", message);
    return git("rev-parse", "HEAD");
  };
  const base = { name: "@kind-ui/charts", version: "0.3.0" };
  const next = { ...base, version: "0.4.0" };
  const reviewed = {
    package: base.name,
    version: next.version,
    previousVersion: base.version,
    changesets: ["stack-feature"],
  };
  const resolve = (revision, policy = reviewed) =>
    reviewedTransitionParent(
      root,
      revision,
      policy,
      fileURLToPath(new URL("../node_modules/@changesets/cli/bin.js", import.meta.url)),
    );
  try {
    await mkdir(join(root, "packages/charts"), { recursive: true });
    await mkdir(join(root, ".changeset"));
    await save("package.json", {
      name: "stack-fixture",
      private: true,
      version: "0.0.0",
      workspaces: ["packages/*"],
    });
    await save("packages/charts/package.json", base);
    await save("package-lock.json", {
      name: "stack-fixture",
      version: "0.0.0",
      lockfileVersion: 3,
      packages: {
        "": { name: "stack-fixture", version: "0.0.0", workspaces: ["packages/*"] },
        "packages/charts": base,
      },
    });
    await save(".changeset/release-version.json", {
      ...reviewed,
      version: "0.3.0",
      previousVersion: "0.2.0",
      changesets: ["old-feature"],
    });
    await writeFile(
      join(root, ".changeset/config.json"),
      await readFile(new URL("../.changeset/config.json", import.meta.url)),
    );
    git("init", "-b", "main");
    git("config", "user.name", "Release fixture");
    git("config", "user.email", "fixture@example.invalid");
    const initial = commit("Main without pending changesets");
    git("switch", "-c", "stack");
    await writeFile(
      join(root, ".changeset/stack-feature.md"),
      '---\n"@kind-ui/charts": minor\n---\nStack feature\n',
    );
    const feature = commit("Reviewed stack feature");
    await save("packages/charts/package.json", next);
    await save(".changeset/release-version.json", reviewed);
    await rm(join(root, ".changeset/stack-feature.md"));
    const version = commit("Consume exact Changesets plan");
    git("switch", "main");
    git("merge", "--no-ff", "stack", "-m", "Coordinated stack merge");
    const merged = git("rev-parse", "HEAD");
    assert.equal(git("rev-parse", `${merged}^1`), initial);
    const transition = await resolve(merged);
    assert.equal(transition.previousCommit, feature);
    assert.equal(transition.versionCommit, version);
    assertReleaseTransition({
      policy: reviewed,
      manifest: next,
      previous: transition.previous,
      status: transition.status,
      pending: [],
      changelog: "# @kind-ui/charts\n\n## 0.4.0\n\nFeature\n",
    });
    await assert.rejects(resolve(initial), /one reachable exact/);
    await assert.rejects(
      resolve(merged, { ...reviewed, changesets: ["fabricated"] }),
      /one reachable exact/,
    );
    // Recovery permits tooling-only descendants, but never unpublished package edits.
    await writeFile(join(root, "release-tooling.txt"), "Correction\n");
    const repair = commit("Release tooling correction");
    assertRecoverySource(root, repair, merged, reviewed, next);
    assert.throws(() => assertRecoverySource(root, repair, feature, reviewed, next));
    assert.throws(() =>
      assertRecoverySource(root, repair, merged, { ...reviewed, changesets: ["fabricated"] }, next),
    );
    await writeFile(join(root, "packages/charts/runtime.js"), "export const changed = true;\n");
    const changed = commit("Unreviewed package edit");
    assert.throws(
      () => assertRecoverySource(root, changed, merged, reviewed, next),
      /new reviewed version/,
    );
    git("switch", "--detach", initial);
    await writeFile(join(root, "unrelated.txt"), "Not merged\n");
    const unrelated = commit("Unrelated history");
    assert.throws(() => assertRecoverySource(root, repair, unrelated, reviewed, next));
    git("switch", "--detach", feature);
    git("merge", "--no-ff", version, "-m", "Ordinary version merge");
    assert.equal((await resolve(git("rev-parse", "HEAD"))).versionCommit, version);
    git("switch", "--detach", feature);
    const fabricated = { ...reviewed, changesets: ["fabricated"] };
    await save("packages/charts/package.json", next);
    await save(".changeset/release-version.json", fabricated);
    await rm(join(root, ".changeset/stack-feature.md"));
    const invalid = commit("Fabricated version receipt");
    await assert.rejects(resolve(invalid, fabricated), /consume the reviewed plan/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
