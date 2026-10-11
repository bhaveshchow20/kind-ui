import { z } from "zod";

const version = z.string();
const commit = z.string().regex(/^[a-f0-9]{40}$/, "Expected an immutable source commit");
const sha256 = z.string().regex(/^[a-f0-9]{64}$/, "Expected a SHA-256 digest");
const integrity = z
  .string()
  .regex(/^sha512-[A-Za-z0-9+/]+={0,2}$/, "Expected npm SHA-512 integrity");
const filename = z
  .string()
  .regex(/^[a-z0-9][a-z0-9._-]*\.tgz$/i, "Expected a plain tarball filename");
const versions = z.record(z.string(), version);

// These describe external shapes. Release policy, approved identity, path and
// checksum comparisons remain explicit in their existing contract functions.
export const packageIdentitySchema = z.looseObject({
  name: z.string(),
  version,
  private: z.boolean().optional(),
});

export const releaseManifestSchema = packageIdentitySchema.extend({
  license: z.string(),
  repository: z.looseObject({ url: z.string(), directory: z.string() }),
});

export const packageManifestSchema = packageIdentitySchema.extend({
  description: z.string().optional(),
  license: z.string(),
  repository: z
    .looseObject({ type: z.string(), url: z.string(), directory: z.string() })
    .optional(),
  bugs: z.looseObject({ url: z.string() }).optional(),
  homepage: z.string().optional(),
  type: z.string(),
  types: z.string(),
  exports: z.record(z.string(), z.looseObject({ import: z.string(), types: z.string() })),
  sideEffects: z.union([z.boolean(), z.array(z.string())]),
  dependencies: versions,
  peerDependencies: z.record(z.string(), z.string().optional()),
  peerDependenciesMeta: z
    .record(z.string(), z.object({ optional: z.boolean().optional() }))
    .optional(),
});

export const workspaceManifestSchema = z.looseObject({
  private: z.boolean(),
  version,
  devDependencies: versions,
});

export const reviewedVersionSchema = z.strictObject({
  package: z.string(),
  version,
  previousVersion: version.optional(),
  changesets: z.array(z.string()).optional(),
});

export const changesetStatusSchema = z.looseObject({
  releases: z.array(
    z.looseObject({
      name: z.string(),
      oldVersion: version,
      newVersion: version,
      type: z.enum(["patch", "minor", "major", "none"]),
      changesets: z.array(z.string()),
    }),
  ),
});

export const artifactReceiptSchema = z.looseObject({
  filename,
  sha256,
  integrity,
  package: packageIdentitySchema,
  source: z.looseObject({
    checkoutCommit: commit,
    pullRequestHeadCommit: commit.nullable(),
    pullRequestBaseCommit: commit.nullable(),
    dirty: z.boolean(),
  }),
  workflow: z.looseObject({
    event: z.string().nullable(),
    runId: z.string().regex(/^\d+$/).nullable(),
    runAttempt: z.string().regex(/^\d+$/).nullable(),
    runUrl: z.string().nullable(),
  }),
  tools: z
    .object({ node: z.string(), npm: z.string(), typescript: z.string(), vite: z.string() })
    .optional(),
  consumerVersions: versions.optional(),
  ordinaryConsumerVersions: versions.optional(),
  validation: z.string().optional(),
});

export const integrationEvidenceSchema = z.looseObject({
  sha256,
  checks: z.array(z.string()),
});

export const docsProvenanceSchema = z.strictObject({
  mode: z.enum(["local", "registry"]),
  version,
  package: z.literal("@kind-ui/charts"),
  integrity,
  sha256,
  sourceCommit: commit,
  publicExportsOnly: z.boolean(),
  guardedArtifact: z.boolean(),
  validation: artifactReceiptSchema.shape.workflow
    .extend({ tools: artifactReceiptSchema.shape.tools })
    .optional(),
});

export const npmPackSchema = z
  .array(
    z.looseObject({
      filename,
      integrity,
      files: z.array(z.looseObject({ path: z.string() })),
    }),
  )
  .length(1);

export const registryMetadataSchema = z.looseObject({
  versions: z.record(
    z.string(),
    z.looseObject({
      dist: z.looseObject({ integrity: z.string(), tarball: z.string().optional() }),
    }),
  ),
  "dist-tags": versions.optional(),
});

/** @param {string} text @returns {unknown} */
export function parseJson(text) {
  return JSON.parse(text);
}
