import { appendFile } from "node:fs/promises";
import { verifyReleaseArtifact } from "./release-artifact.mjs";

const result = await verifyReleaseArtifact(
  process.argv[2],
  {
    commit: process.env.RELEASE_COMMIT,
    repository: process.env.GITHUB_REPOSITORY,
    version: process.env.RELEASE_VERSION,
    tag: process.env.RELEASE_TAG,
    runId: process.env.GITHUB_RUN_ID,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT,
    sha256: process.env.RELEASE_SHA256,
  },
  { requirePublic: process.argv.includes("--require-public") },
);
console.log(JSON.stringify(result, null, 2));
if (process.env.GITHUB_OUTPUT) {
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `filename=${result.filename}\nsha256=${result.sha256}\npublishable=${result.publishable}\n`,
  );
}
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(
    process.env.GITHUB_STEP_SUMMARY,
    `Candidate ${result.version} / ${result.tag}\n\nCheckout: ${process.env.RELEASE_COMMIT}\n\nSHA-256: ${result.sha256}\n\nPublishable manifest: ${result.publishable}\n\nReceipt validation proves identity/integrity. Full Node 22/24 checks are required by job dependencies. Publishing remains disabled until the reviewed activation/setup.\n`,
  );
}
