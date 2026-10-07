import assert from "node:assert/strict";
import test from "node:test";
import { publicPackageMetadata } from "./release-intent.mjs";
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
