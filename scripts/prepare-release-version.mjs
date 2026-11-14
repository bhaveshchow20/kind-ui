import { execFileSync } from "node:child_process";
import { appendFile, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertReviewedVersion, chartsVersionPlan } from "./release-plan.mjs";

export async function pendingChangesets(root) {
  return (await readdir(join(root, ".changeset")))
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort();
}

export async function changesetStatus(root, cli) {
  const scratch = await mkdtemp(join(tmpdir(), "kind-version-status-"));
  try {
    const output = join(scratch, "status.json");
    execFileSync(process.execPath, [cli, "status", "--output", output], {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    });
    return JSON.parse(await readFile(output));
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

export async function prepareChartsVersion(root, { cli, npm }) {
  if (!(await pendingChangesets(root)).length) return null;
  const status = await changesetStatus(root, cli);
  if (!status.releases.length) return null;
  const manifest = JSON.parse(await readFile(join(root, "packages/charts/package.json")));
  const policy = JSON.parse(await readFile(join(root, ".changeset/release-version.json")));
  assertReviewedVersion(policy, manifest);
  const next = chartsVersionPlan(status, manifest);
  execFileSync(process.execPath, [cli, "version"], { cwd: root, stdio: "inherit" });
  execFileSync(
    process.execPath,
    [npm, "install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"],
    { cwd: root, stdio: "inherit" },
  );
  await writeFile(
    join(root, ".changeset/release-version.json"),
    `${JSON.stringify(next, null, 2)}\n`,
  );
  return next;
}

const root = fileURLToPath(new URL("../", import.meta.url));
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cli = join(root, "node_modules/@changesets/cli/bin.js");
  if (process.argv.includes("--status")) {
    const status = (await pendingChangesets(root)).length
      ? await changesetStatus(root, cli)
      : { releases: [] };
    if (process.env.GITHUB_OUTPUT)
      await appendFile(process.env.GITHUB_OUTPUT, `has_changesets=${status.releases.length > 0}\n`);
    console.log(JSON.stringify(status));
  } else {
    console.log(
      JSON.stringify(await prepareChartsVersion(root, { cli, npm: process.env.npm_execpath })),
    );
  }
}
