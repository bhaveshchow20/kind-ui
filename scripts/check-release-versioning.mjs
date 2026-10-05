import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const originalManifest = await readFile(join(root, "packages/charts/package.json"), "utf8");
const scratch = await mkdtemp(join(tmpdir(), "kind-release-versioning-"));
const cli = join(root, "node_modules/@changesets/cli/bin.js");
const run = (args) =>
  execFileSync(process.execPath, [cli, ...args], {
    cwd: scratch,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
try {
  await mkdir(join(scratch, ".changeset"));
  await mkdir(join(scratch, "packages/charts"), { recursive: true });
  await cp(join(root, ".changeset/config.json"), join(scratch, ".changeset/config.json"));
  const workspace = {
    name: "versioning-fixture",
    private: true,
    version: "0.0.0",
    workspaces: ["packages/*"],
  };
  const charts = { name: "@kind-ui/charts", private: true, version: "0.0.0" };
  await writeFile(join(scratch, "package.json"), JSON.stringify(workspace));
  await writeFile(join(scratch, "packages/charts/package.json"), JSON.stringify(charts));
  execFileSync(
    "npm",
    ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"],
    { cwd: scratch, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  execFileSync("git", ["init", "-b", "main"], { cwd: scratch, stdio: "ignore" });
  execFileSync("git", ["add", "."], { cwd: scratch });
  execFileSync(
    "git",
    [
      "-c",
      "user.name=Versioning Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "commit",
      "-m",
      "Fixture base",
    ],
    { cwd: scratch, stdio: "ignore" },
  );
  run(["add", "--minor", "@kind-ui/charts", "--message", "Fixture first release"]);
  run(["status", "--output", "status.json"]);
  const status = JSON.parse(await readFile(join(scratch, "status.json")));
  assert.equal(status.releases.length, 1);
  assert.equal(status.releases[0].newVersion, "0.1.0");
  run(["version"]);
  execFileSync(
    "npm",
    ["install", "--package-lock-only", "--ignore-scripts", "--no-audit", "--no-fund"],
    { cwd: scratch, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  const lock = JSON.parse(await readFile(join(scratch, "package-lock.json")));
  assert.equal(lock.packages["packages/charts"].version, "0.1.0");
  assert.equal(
    execFileSync("git", ["tag", "--list"], { cwd: scratch, encoding: "utf8" }).trim(),
    "",
  );
  const versioned = JSON.parse(await readFile(join(scratch, "packages/charts/package.json")));
  assert.equal(versioned.version, "0.1.0");
  assert.equal(versioned.private, true);
  assert.match(await readFile(join(scratch, "packages/charts/CHANGELOG.md"), "utf8"), /0\.1\.0/);
  assert.deepEqual(JSON.parse(await readFile(join(scratch, "package.json"))), workspace);
  assert.equal(
    await readFile(join(root, "packages/charts/package.json"), "utf8"),
    originalManifest,
  );
  console.log(
    "Official Changesets prepared private 0.1.0 + changelog in a disposable fixture; real package unchanged",
  );
} finally {
  await rm(scratch, { recursive: true, force: true });
}
