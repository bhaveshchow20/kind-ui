import assert from "node:assert/strict";
import { appendFile } from "node:fs/promises";
import { verifyPublishedRelease } from "./public-release.mjs";
import { publicPackageMetadata } from "./release-intent.mjs";
import { publishedReleaseDecision } from "./release-plan.mjs";

const version = process.env.RELEASE_VERSION;
const integrity = process.env.RELEASE_INTEGRITY;
assert.match(version, /^\d+\.\d+\.\d+$/);
assert.match(integrity, /^sha512-[A-Za-z0-9+/]+={0,2}$/);
if (process.argv.includes("--verify-published")) {
  console.log(JSON.stringify(await verifyPublishedRelease(version, integrity)));
} else {
  const decision = publishedReleaseDecision(await publicPackageMetadata(), version, integrity);
  if (process.env.GITHUB_OUTPUT)
    await appendFile(process.env.GITHUB_OUTPUT, `unpublished=${decision === "publish"}\n`);
  console.log(JSON.stringify({ version, integrity, decision }));
}
