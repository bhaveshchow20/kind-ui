import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { publicPackageMetadata } from "./release-intent.mjs";
import { publishedReleaseDecision } from "./release-plan.mjs";

export async function verifyPublishedRelease(
  version,
  integrity,
  { readMetadata = publicPackageMetadata, fetcher = fetch, wait = setTimeout, attempts = 10 } = {},
) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const metadata = await readMetadata();
    if (publishedReleaseDecision(metadata, version, integrity) === "already-published") {
      assert.equal(metadata["dist-tags"].latest, version, "Published latest differs");
      const tarball = metadata.versions[version].dist.tarball;
      assert.equal(tarball, `https://registry.npmjs.org/@kind-ui/charts/-/charts-${version}.tgz`);
      const response = await fetcher(tarball);
      assert.equal(response.status, 200, "Published archive is unavailable");
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(
        `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
        integrity,
        "Public archive bytes differ",
      );
      return { version, integrity, sha256: createHash("sha256").update(bytes).digest("hex") };
    }
    if (attempt + 1 < attempts) await wait(30_000);
  }
  throw Error("Publication did not become public; inspect the registry before any retry");
}
