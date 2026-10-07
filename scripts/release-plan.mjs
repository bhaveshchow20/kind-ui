import assert from "node:assert/strict";
import { gt, inc, valid } from "semver";

export function assertReviewedVersion(policy, manifest) {
  assert.equal(policy.package, "@kind-ui/charts", "Unexpected reviewed package");
  assert.equal(valid(policy.version), policy.version, "Expected a canonical version");
  assert.match(policy.version, /^\d+\.\d+\.\d+$/, "Expected a stable reviewed version");
  assert.equal(manifest.name, policy.package);
  assert.equal(
    manifest.version,
    policy.version,
    "Version must match the reviewed public candidate",
  );
}

export function chartsVersionPlan(status, manifest) {
  assert.equal(status.releases.length, 1, "Version only the charts package");
  const release = status.releases[0];
  assert.equal(release.name, "@kind-ui/charts");
  assert.equal(release.oldVersion, manifest.version, "Plan must start from the current version");
  assert.ok(["patch", "minor", "major"].includes(release.type));
  assert.equal(release.newVersion, inc(manifest.version, release.type));
  assert.ok(release.changesets?.length > 0, "A release needs a package changeset");
  assert.equal(new Set(release.changesets).size, release.changesets.length);
  return {
    package: release.name,
    version: release.newVersion,
    previousVersion: release.oldVersion,
    changesets: [...release.changesets].sort(),
  };
}

export function assertReleaseTransition({
  policy,
  manifest,
  previous,
  status,
  pending,
  changelog,
}) {
  assertReviewedVersion(policy, manifest);
  assert.equal(manifest.private, undefined, "Public charts must omit the private flag");
  assert.ok(gt(manifest.version, previous.version), "Release must advance the version");
  assert.equal(pending.length, 0, "Refresh the version PR before releasing pending changesets");
  assert.deepEqual(
    policy,
    chartsVersionPlan(status, previous),
    "Release must match the Changesets plan",
  );
  assert.ok(changelog.startsWith(`# @kind-ui/charts\n\n## ${policy.version}\n`));
}

export function assertReleaseContext(context) {
  assert.equal(
    context.repository,
    "bhaveshchow20/kind-ui",
    "Release only the canonical repository",
  );
  assert.equal(context.ref, "refs/heads/main", "Release only main");
  assert.ok(["push", "workflow_dispatch"].includes(context.event), "Unexpected release event");
}

export function publishedReleaseDecision(metadata, version, integrity) {
  if (metadata === null) return "publish";
  const published = metadata.versions?.[version];
  if (published) {
    if (integrity)
      assert.equal(
        published.dist.integrity,
        integrity,
        "Published bytes differ; never retry publication",
      );
    return "already-published";
  }
  const latest = metadata["dist-tags"]?.latest;
  if (latest) assert.ok(gt(version, latest), "Do not downgrade the latest dist-tag");
  return "publish";
}
