import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

const workflow = parse(
  await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8"),
);
const versionWorkflow = parse(
  await readFile(new URL("../.github/workflows/version.yml", import.meta.url), "utf8"),
);

function assertVersionPullRequests(w) {
  assert.deepEqual(Object.keys(w.on), ["push"]);
  assert.deepEqual(w.on.push.branches, ["main"]);
  assert.deepEqual(w.on.push.paths, [".changeset/**", ".github/workflows/version.yml"]);
  assert.deepEqual(w.permissions, { contents: "read" });
  assert.deepEqual(Object.keys(w.jobs), ["version"]);
  const job = w.jobs.version;
  assert.equal(
    job.if,
    "github.repository == 'bhaveshchow20/kind-ui' && github.ref == 'refs/heads/main'",
  );
  assert.deepEqual(job.permissions, { contents: "write", "pull-requests": "write" });
  assert.equal(job.environment, undefined);
  const plan = job.steps.find((step) => step.id === "plan");
  assert.equal(plan.run, "node scripts/prepare-release-version.mjs --status");
  const action = job.steps.find((step) => step.uses?.startsWith("changesets/"));
  assert.equal(action.uses, "changesets/action/version@ae32849d5ba541f9ae29e40e22a623bc13562f51");
  assert.equal(action.if, "steps.plan.outputs.has_changesets == 'true'");
  assert.deepEqual(action.with, {
    script: "npm run release:version",
    "pr-title": "Version packages",
    "pr-draft": "create",
  });
  assert.ok(!JSON.stringify(w).includes("secrets."));
  for (const step of job.steps) {
    if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/);
    if (step.uses?.startsWith("actions/checkout@"))
      assert.equal(step.with["persist-credentials"], false);
    assert.ok(!/npm publish|changeset publish/.test(step.run ?? ""));
  }
}

test("Changesets opens draft version PRs only for pending changes on main", () =>
  assertVersionPullRequests(versionWorkflow));
for (const [name, mutate] of [
  [
    "untrusted trigger",
    (w) => {
      w.on.pull_request = null;
    },
  ],
  [
    "publishing permission",
    (w) => {
      w.jobs.version.permissions["id-token"] = "write";
    },
  ],
  [
    "unconditional version bump",
    (w) => {
      w.jobs.version.steps.at(-1).if = undefined;
    },
  ],
  [
    "publishing action",
    (w) => {
      w.jobs.version.steps.at(-1).uses =
        "changesets/action/publish@ae32849d5ba541f9ae29e40e22a623bc13562f51";
    },
  ],
]) {
  test(`version PR workflow rejects ${name}`, () => {
    const w = structuredClone(versionWorkflow);
    mutate(w);
    assert.throws(() => assertVersionPullRequests(w));
  });
}
function assertRelease(w) {
  assert.deepEqual(
    Object.keys(w.on),
    ["push", "workflow_dispatch"],
    "Only reviewed main pushes and explicit validation enter releases",
  );
  assert.deepEqual(w.permissions, { contents: "read" }, "No publishing identity is granted");
  assert.equal(
    w.jobs.plan.if,
    "github.repository == 'bhaveshchow20/kind-ui' && github.ref == 'refs/heads/main'",
  );
  assert.deepEqual(w.on.push.branches, ["main"]);
  assert.deepEqual(w.on.push.paths, [
    "packages/charts/package.json",
    ".changeset/release-version.json",
  ]);
  assert.equal(w.jobs.validate.needs, "plan");
  assert.equal(w.jobs.validate.if, "needs.plan.outputs.validate == 'true'");
  assert.equal(
    w.jobs.plan.steps.find((s) => s.id === "intent").run,
    "node scripts/release-intent.mjs",
  );
  assert.equal(w.jobs.validate.strategy, undefined);
  for (const job of Object.values(w.jobs)) {
    assert.equal(
      job.steps.find((s) => s.uses?.startsWith("actions/setup-node@"))?.with["node-version"],
      22,
    );
  }
  assert.deepEqual(
    w.jobs.verify.needs,
    ["plan", "validate"],
    "Full validation must pass before handoff",
  );
  assert.deepEqual(w.jobs.publish.needs, ["plan", "verify"]);
  assert.equal(
    w.jobs.publish.if,
    "github.repository == 'bhaveshchow20/kind-ui' && " +
      "github.ref == 'refs/heads/main' && " +
      "needs.plan.outputs.publish == 'true' && " +
      "needs.verify.outputs.publishable == 'true'",
  );
  assert.deepEqual(w.jobs.publish.permissions, { contents: "read", "id-token": "write" });
  assert.equal(w.jobs.publish.environment, "npm-release");
  assert.equal(
    w.jobs.publish.steps.find((s) => s.uses?.startsWith("actions/setup-node@"))?.with[
      "registry-url"
    ],
    "https://registry.npmjs.org",
  );
  for (const [name, job] of Object.entries(w.jobs)) {
    if (name !== "publish") {
      assert.equal(job.permissions, undefined, "Only publisher gains OIDC");
      assert.equal(job.environment, undefined, "Only publisher uses npm-release");
    }
    for (const step of job.steps) {
      if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/, "Pin official actions");
    }
  }
  const publish = w.jobs.publish.steps.find((s) => s.name?.startsWith("Publish"));
  assert.match(
    publish.run,
    /npm publish "\.\/artifacts\/release-candidate\/package\/\$CANDIDATE_FILENAME"/,
  );
  assert.match(publish.run, /--ignore-scripts/);
  assert.ok(w.jobs.publish.steps.some((s) => s.run?.includes("--require-public")));
  assert.ok(!JSON.stringify(w).includes("secrets."), "No credential setup in this workflow");
}
test("reviewed main pipeline grants only the publisher its approved OIDC identity", () =>
  assertRelease(workflow));
for (const [name, mutate] of [
  [
    "untrusted merge trigger",
    (w) => {
      w.on.push.branches = ["feature"];
    },
  ],
  [
    "unguarded publication",
    (w) => {
      w.jobs.publish.if = "github.ref == 'refs/heads/main'";
    },
  ],
  [
    "OIDC grant",
    (w) => {
      w.jobs.validate.permissions = { "id-token": "write" };
    },
  ],
  [
    "wrong environment",
    (w) => {
      w.jobs.publish.environment = "preview";
    },
  ],
  [
    "write access beyond publisher identity",
    (w) => {
      w.jobs.publish.permissions.contents = "write";
    },
  ],
  [
    "unreviewed release intent",
    (w) => {
      w.jobs.publish.if = w.jobs.publish.if.replace("needs.plan.outputs.publish == 'true'", "true");
    },
  ],
  [
    "non-public candidate",
    (w) => {
      w.jobs.publish.if = w.jobs.publish.if.replace(
        "needs.verify.outputs.publishable == 'true'",
        "true",
      );
    },
  ],
  [
    "ungated handoff",
    (w) => {
      w.jobs.verify.needs = undefined;
    },
  ],
])
  test(`release workflow rejects ${name}`, () => {
    const w = structuredClone(workflow);
    mutate(w);
    assert.throws(() => assertRelease(w));
  });

test("manual validation defaults to the reviewed package candidate version", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../packages/charts/package.json", import.meta.url), "utf8"),
  );
  assert.equal(workflow.on.workflow_dispatch.inputs.version.default, "");
  const policy = JSON.parse(
    await readFile(new URL("../.changeset/release-version.json", import.meta.url), "utf8"),
  );
  assert.equal(policy.version, manifest.version);
  assert.equal(manifest.private, undefined);
});
