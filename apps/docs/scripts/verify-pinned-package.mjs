import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const provenance = JSON.parse(readFileSync(new URL("../vendor/provenance.json", import.meta.url)));
const bytes = readFileSync(new URL("../vendor/kind-ui-charts-0.1.0.tgz", import.meta.url));
assert.equal(createHash("sha256").update(bytes).digest("hex"), provenance.sha256);
assert.equal(`sha512-${createHash("sha512").update(bytes).digest("base64")}`, provenance.integrity);
assert.equal(provenance.version, "0.1.0");
assert.equal(provenance.guardedArtifact, true);
assert.equal(provenance.publicExportsOnly, true);
assert.match(provenance.sourceCommit, /^[a-f0-9]{40}$/);
console.log(
  `Verified pinned ${provenance.package}@${provenance.version} from ${provenance.sourceCommit}`,
);
