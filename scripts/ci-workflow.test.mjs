import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const ci = parse(await read(".github/workflows/ci.yml"));
const docs = parse(await read(".github/workflows/docs.yml"));
const seo = parse(await read(".github/workflows/seo.yml"));
const release = parse(await read(".github/workflows/release.yml"));
const dependabot = parse(await read(".github/dependabot.yml"));

test("routine CI artifacts expire quickly without shortening release retention", () => {
  for (const workflow of [ci, docs]) {
    for (const job of Object.values(workflow.jobs)) {
      for (const step of job.steps.filter((step) =>
        step.uses?.startsWith("actions/upload-artifact@"),
      )) {
        const retention = step.with.name.endsWith("-browser-fixtures")
          ? 1
          : `\${{ job.status != 'success' && 3 || 1 }}`;
        assert.equal(step.with["retention-days"], retention, step.with.name);
      }
    }
  }
  for (const step of release.jobs.validate.steps.filter((step) =>
    step.uses?.startsWith("actions/upload-artifact@"),
  )) {
    assert.equal(step.with["retention-days"], 14, step.with.name);
  }
});

test("PR checks run without trigger exclusions and preserve required receipts", () => {
  assert.equal(ci.on.pull_request, null);
  assert.deepEqual(ci.on.push.branches, ["main"]);
  for (const [id, name] of [["check", "All checks"]]) {
    const job = ci.jobs[id];
    assert.equal(job.name, name);
    assert.equal(job.if, "always()");
    assert.deepEqual(job.needs, ["changes", "fast", "packed", "playwright"]);
  }
  assert.equal(ci.jobs.fast.needs, undefined);
  assert.equal(ci.jobs.packed.needs, undefined);
  assert.equal(ci.jobs.fast.strategy, undefined);
  for (const workflow of [ci, docs, seo, release]) {
    for (const job of Object.values(workflow.jobs)) {
      assert.equal(job.strategy?.matrix.node, undefined);
      for (const step of job.steps.filter((s) => s.uses?.startsWith("actions/setup-node@"))) {
        assert.equal(step.with["node-version"], 22);
      }
    }
  }
});

test("all workflows keep untrusted code read-only, pinned, and bounded", () => {
  for (const workflow of [ci, docs, seo, release]) {
    assert.deepEqual(workflow.permissions, { contents: "read" });
    assert.equal(workflow.on.pull_request_target, undefined);
    assert.equal(workflow.on.workflow_run, undefined);
    assert.ok(!JSON.stringify(workflow).includes("secrets."));
    for (const [name, job] of Object.entries(workflow.jobs)) {
      if (workflow === release && name === "publish") {
        assert.deepEqual(job.permissions, { contents: "read", "id-token": "write" });
        assert.equal(job.environment, "npm-release");
        assert.equal(workflow.on.pull_request, undefined);
        assert.deepEqual(workflow.on.push.branches, ["main"]);
        assert.ok(job.if.includes("github.ref == 'refs/heads/main'"));
      } else if (workflow === release && name === "github-release") {
        assert.deepEqual(job.permissions, { contents: "write" });
        assert.equal(job.environment, undefined);
        assert.deepEqual(job.needs, ["plan", "verify", "publish"]);
        assert.equal(job.if, "needs.publish.result == 'success'");
      } else {
        assert.equal(job.permissions, undefined);
      }
      assert.ok(Number.isInteger(job["timeout-minutes"]));
      assert.ok(job["timeout-minutes"] > 0 && job["timeout-minutes"] <= 60);
      for (const step of job.steps) {
        if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/);
        if (step.uses?.startsWith("actions/checkout@"))
          assert.equal(step.with["persist-credentials"], false);
      }
    }
  }
});

test("Docs follows shared dependency, build configuration, and package gate changes", () => {
  for (const event of ["pull_request", "push"]) {
    for (const path of [
      "apps/docs/**",
      "registry/**",
      "packages/charts/**",
      "package.json",
      "package-lock.json",
      "tsconfig.base.json",
      "scripts/**",
      ".github/workflows/docs.yml",
    ]) {
      assert.ok(docs.on[event].paths.includes(path), `${event} must cover ${path}`);
    }
  }
});

test("homepage indexing checks build and serve both preview and public mounts", () => {
  const job = seo.jobs.showcase;
  assert.deepEqual(job.strategy.matrix.include, [
    { deployment: "preview", base_path: "" },
    { deployment: "production", base_path: "/charts" },
  ]);
  assert.equal(job.env.KIND_UI_DEPLOYMENT_ENV, "${{ matrix.deployment }}");
  assert.equal(job.env.NEXT_PUBLIC_SHOWCASE_BASE_PATH, "${{ matrix.base_path }}");
  const appSteps = job.steps.filter((step) => step["working-directory"] === "apps/showcase");
  assert.ok(appSteps.some((step) => step.run === "npm run build"));
  assert.ok(
    appSteps.some(
      (step) =>
        step.run === "npm run test:browser -- tests/routes.spec.ts tests/accessibility.spec.ts",
    ),
  );
});

test("both test pipelines retain every aggregate browser suite's available failure output", async () => {
  const directories = await Promise.all(
    [
      "playwright.config.mjs",
      "playwright.composition.config.mjs",
      "playwright.chart-frame.config.mjs",
      "playwright.line-integrations.config.mjs",
    ].map(async (file) => {
      const { default: config } = await import(new URL(`../${file}`, import.meta.url));
      assert.equal(typeof config.outputDir, "string", `Missing browser evidence in ${file}`);
      return config.outputDir;
    }),
  );
  for (const job of [ci.jobs.playwright, release.jobs.validate]) {
    const uploads = job.steps.filter(
      (step) => step.uses?.startsWith("actions/upload-artifact@") && step.if === "always()",
    );
    for (const directory of [...directories, "artifacts/line-integrations/next-build.log"]) {
      assert.ok(
        uploads.some(
          (step) =>
            step.with.path.split("\n").includes(`${directory}/`) ||
            step.with.path.split("\n").includes(directory),
        ),
        `Missing failure evidence: ${directory}`,
      );
    }
  }
});

test("parallel source fixtures isolate Vite caches and retain their CI failure traces", async () => {
  const caches = new Set();
  const uploads = ci.jobs.playwright.steps.filter(
    (step) => step.uses?.startsWith("actions/upload-artifact@") && step.if === "always()",
  );
  for (const name of [
    "primitives",
    "ai-answers",
    "ai-context-research",
    "ai-conversation",
    "ai-agent-work",
  ]) {
    const { default: fixture } = await import(
      new URL(`../tests/fixtures/${name}/vite.config.mjs`, import.meta.url)
    );
    assert.equal(typeof fixture.cacheDir, "string", `${name} needs an explicit cache directory`);
    assert.ok(!caches.has(fixture.cacheDir), `${name} shares another fixture's cache`);
    caches.add(fixture.cacheDir);
    const { default: browser } = await import(
      new URL(`../playwright.${name}.config.mjs`, import.meta.url)
    );
    assert.ok(
      uploads.some((step) => step.with.path.split("\n").includes(`${browser.outputDir}/`)),
      `Missing CI failure traces: ${browser.outputDir}`,
    );
  }
});

test("advisory checks include development tooling and npm updates cover the lockfile", async () => {
  for (const job of [ci.jobs.fast, docs.jobs.docs, release.jobs.validate]) {
    assert.ok(job.steps.some((step) => step.run === "npm audit --audit-level=high --include=dev"));
  }
  assert.ok(
    dependabot.updates.some(
      (update) => update["package-ecosystem"] === "npm" && update.directory === "/",
    ),
  );
});

test("split CI covers all aggregate gates and sends shard args to every browser suite", async () => {
  const { scripts } = JSON.parse(await read("package.json"));
  const fastRuns = ci.jobs.fast.steps.map((s) => s.run).filter(Boolean);
  for (const command of ["npm run check:preflight", "npm run typecheck", "npm run test:unit"])
    assert.ok(fastRuns.includes(command));
  assert.equal(scripts["check:preflight"], "node scripts/run-checks.mjs preflight");
  assert.ok(ci.jobs.packed.steps.some((s) => s.run === "npm run check:packed"));
  for (const gate of [
    "pack:artifact",
    "tsc -p tests/fixtures/browser",
    "check-browser-fixtures.mjs",
    "check:line-integrations",
    "build:registry",
    "check:registry-consumers",
  ])
    assert.ok(scripts["check:packed"].includes(gate), `Missing gate: ${gate}`);
  assert.deepEqual(ci.jobs.playwright.needs, ["changes", "packed"]);
  assert.equal(ci.jobs.playwright.if, "needs.changes.outputs.browsers == 'true'");
  assert.deepEqual(ci.jobs.playwright.strategy.matrix.shard, [1, 2, 3, 4]);
  assert.equal(ci.jobs.playwright.strategy["fail-fast"], false);
  // biome-ignore lint/suspicious/noTemplateCurlyInString: Literal GitHub Actions expression.
  assert.ok(ci.jobs.playwright.steps.some((s) => s.run?.includes("--shard=${{ matrix.shard }}/4")));
  const runner = await read("scripts/run-checks.mjs");
  for (const suite of [
    "test:chart",
    "test:composition",
    "test:chart-frame",
    "test:line-integrations",
    "test:registry",
  ])
    assert.ok(runner.includes(`"${suite}"`));
  assert.match(runner, /process\.argv\.slice\(3\)/);
  const upload = ci.jobs.packed.steps.find((s) => s.with?.name === "charts-browser-fixtures");
  const download = ci.jobs.playwright.steps.find((s) =>
    s.uses?.startsWith("actions/download-artifact@"),
  );
  assert.equal(download.with.name, upload.with.name);
  // All uploaded paths share artifacts/ as their archive root.
  assert.equal(download.with.path, "artifacts");
  for (const path of [
    "artifacts/package/",
    "artifacts/bundle-measurements.json",
    "artifacts/packed-*/",
    "artifacts/line-integrations/",
    "artifacts/browser-fixtures/",
  ])
    assert.ok(upload.with.path.split("\n").includes(path));
});

test("cached browser binaries do not replace OS dependency installation", () => {
  for (const job of [ci.jobs.playwright, docs.jobs.docs]) {
    const steps = job.steps;
    const cache = steps.find((s) => s.uses?.startsWith("actions/cache@"));
    assert.equal(cache.with.path, "~/.cache/ms-playwright");
    assert.ok(cache.with.key.includes("runner.os"));
    assert.ok(cache.with.key.includes("runner.arch"));
    assert.ok(cache.with.key.includes("playwright-version.outputs.version"));
    assert.equal(cache.with["restore-keys"], undefined);
    const deps = steps.find((s) => s.run === "npm exec playwright install-deps -- chromium");
    assert.equal(deps.if, undefined);
    const install = steps.find((s) => s.run === "npm exec playwright install -- chromium");
    assert.equal(install.if, "steps.browsers.outputs.cache-hit != 'true'");
  }
});

test("release installs fresh browser binaries and OS dependencies without caching", () => {
  for (const job of Object.values(release.jobs)) {
    assert.ok(!job.steps.some((s) => s.uses?.startsWith("actions/cache@")));
    const setup = job.steps.find((s) => s.uses?.startsWith("actions/setup-node@"));
    assert.equal(setup.with.cache, undefined);
    assert.equal(setup.with["package-manager-cache"], false);
  }
  const install = release.jobs.validate.steps.find(
    (s) => s.run === "npm exec playwright install -- --with-deps chromium",
  );
  assert.ok(install);
  assert.equal(install.if, undefined);
});

test("Docs builds, tests and opens the site at the root and under the kindui.dev mount", () => {
  const runs = docs.jobs.docs.steps.map((step) => step.run).filter(Boolean);
  for (const command of ["npm run test:docs", "npm run build:docs", "npm run check:docs"])
    assert.ok(runs.includes(command), `Missing ${command}`);
  const mounted = docs.jobs.docs.steps.find((step) => step.env?.NEXT_PUBLIC_DOCS_BASE_PATH);
  assert.equal(mounted.env.NEXT_PUBLIC_DOCS_BASE_PATH, "/docs/charts");
  assert.equal(mounted.run, "npm run build:docs && npm run check:docs");
});

test("pinned compatibility and bundle budgets reuse the packed pipeline and retain evidence", async () => {
  const { scripts } = JSON.parse(await read("package.json"));
  const packed = await read("scripts/check-package.mjs");
  const integrations = await read("scripts/check-line-integrations.mjs");
  assert.match(
    packed,
    /checkBundleContract\(\{ root, consumer, artifactSha256: sha256, buildOutput \}\)/,
  );
  assert.ok(scripts["check:ci"].includes("compatibility-matrix.test.mjs"));
  assert.ok(packed.includes('"scripts/bundle-contract.test.mjs"'));
  assert.doesNotMatch(integrations, /["']pack["']/);
  for (const job of [ci.jobs.packed, release.jobs.validate]) {
    const paths = job.steps
      .filter((step) => step.uses?.startsWith("actions/upload-artifact@"))
      .flatMap((step) => step.with.path.split("\n"));
    assert.ok(paths.includes("artifacts/bundle-measurements.json"));
    assert.ok(
      paths.includes("artifacts/line-integrations/") ||
        paths.includes("artifacts/line-integrations/compatibility-evidence.json"),
    );
  }
});
