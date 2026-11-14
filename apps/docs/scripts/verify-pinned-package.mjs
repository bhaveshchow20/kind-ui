import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const provenance = JSON.parse(readFileSync(new URL("../vendor/provenance.json", import.meta.url)));
const bytes = readFileSync(new URL("../vendor/kind-ui-charts-0.1.1.tgz", import.meta.url));
const repositoryRoot = resolve(import.meta.dirname, "../../..");
assert.equal(createHash("sha256").update(bytes).digest("hex"), provenance.sha256);
assert.equal(`sha512-${createHash("sha512").update(bytes).digest("base64")}`, provenance.integrity);
assert.equal(provenance.version, "0.1.1");
assert.equal(provenance.guardedArtifact, true);
assert.equal(provenance.publicExportsOnly, true);
assert.match(provenance.sourceCommit, /^[a-f0-9]{40}$/);
execFileSync("git", ["cat-file", "-e", `${provenance.sourceCommit}^{commit}`], {
  cwd: repositoryRoot,
});
execFileSync("git", ["merge-base", "--is-ancestor", provenance.sourceCommit, "HEAD"], {
  cwd: repositoryRoot,
});
const sourceManifest = JSON.parse(
  execFileSync("git", ["show", `${provenance.sourceCommit}:packages/charts/package.json`], {
    cwd: repositoryRoot,
    encoding: "utf8",
  }),
);
assert.equal(sourceManifest.version, provenance.version);
console.log(
  `Verified pinned ${provenance.package}@${provenance.version} from ${provenance.sourceCommit}`,
);
