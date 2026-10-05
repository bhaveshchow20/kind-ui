// Diagnostic PR103 only. Never merge; installs retained candidate bytes for direct replay.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, copyFileSync, writeFileSync } from "node:fs";
const directory = new URL("../diagnostic-artifacts/", import.meta.url);
const receipt = JSON.parse(readFileSync(new URL("validated-artifact.json", directory)));
const tarball = new URL("kind-ui-charts-0.1.0.tgz", directory);
const bytes = readFileSync(tarball);
assert.equal(receipt.source.checkoutCommit, "d66ad717eaa0220b83b60de9420c94b65d67118c");
assert.equal(receipt.source.dirty, false);
assert.equal(receipt.sha256, "d26d3edb360a274acf306f66e1413316fd4c18596b138c87e97e34db049273b5");
assert.equal(createHash("sha256").update(bytes).digest("hex"), receipt.sha256);
assert.equal(`sha512-${createHash("sha512").update(bytes).digest("base64")}`, receipt.integrity);
copyFileSync(tarball, "apps/docs/vendor/kind-ui-charts-0.0.0.tgz");
writeFileSync("apps/docs/vendor/provenance.json", JSON.stringify({mode: "local", version: receipt.package.version, package: receipt.package.name, integrity: receipt.integrity, sha256: receipt.sha256, sourceCommit: receipt.source.checkoutCommit, publicExportsOnly: true, guardedArtifact: true}, null, 2) + "\n");
console.log(JSON.stringify({diagnosticOnly: true, candidateSource: receipt.source, sha256: receipt.sha256, integrity: receipt.integrity, platform: process.platform, node: process.version}));
