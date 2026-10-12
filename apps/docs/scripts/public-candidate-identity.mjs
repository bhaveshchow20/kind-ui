import assert from "node:assert/strict";

const candidateFiles =
  /^(?:markdown\/components\/treemap\.md|examples\/(?:treemap|treemap-portfolio|treemap-events|treemap-storage)\/README\.md)$/;
const candidatePageFiles =
  /^(?:docs\/)?components\/treemap\/(?:index\.html|index\.txt|__next\._full\.txt|__next\.\$c\$slug\.__PAGE__\.txt)$/;

/**
 * The reviewed archive checksum is public identity only in named Treemap assets.
 * Source revisions and arbitrary receipt prose remain private.
 * @param {string} body
 * @param {string} file Relative path within the static export.
 * @param {{sourceCommit: string, sha256: string}} provenance
 */
export function assertPublicCandidateIdentity(body, file, provenance) {
  assert.ok(!body.includes(provenance.sourceCommit), `Internal source receipt exposed in ${file}`);
  const metadataAllowed = candidatePageFiles.test(file);
  const allowed = metadataAllowed || candidateFiles.test(file);
  // Next serializes candidate metadata and README text into escaped RSC payloads.
  // Normalize quote escaping only; the checksum remains literal in either form.
  let remaining = body.replace(/\\+"/g, '"');
  const field = /"candidateSha256"\s*:\s*"([^"\n]*)"/g;
  const instruction =
    /Obtain the reviewed archive matching SHA-256 ([^,\n]+), place it at vendor\/kind-ui-charts-0\.5\.0\.tgz/g;
  /** @param {string} checksum @param {boolean} locationAllowed */
  const permit = (checksum, locationAllowed) => {
    assert.ok(locationAllowed, `Candidate checksum location is not allowed in ${file}`);
    assert.match(checksum, /^[a-f0-9]{64}$/, `Malformed candidate checksum in ${file}`);
    assert.equal(
      checksum,
      provenance.sha256,
      `Candidate checksum differs from trusted archive in ${file}`,
    );
  };
  remaining = remaining.replace(field, (match, checksum) => {
    permit(checksum, metadataAllowed);
    return match.replace(checksum, "[reviewed archive checksum]");
  });
  remaining = remaining.replace(instruction, (match, checksum) => {
    permit(checksum, allowed);
    return match.replace(checksum, "[reviewed archive checksum]");
  });
  assert.ok(!remaining.includes(provenance.sha256), `Internal checksum receipt exposed in ${file}`);
}
