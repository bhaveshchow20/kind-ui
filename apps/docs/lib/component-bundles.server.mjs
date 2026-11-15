import { z } from "zod";

// Validate generated JSON once in the server module. Client components import only its inferred type.
export const componentBundleSchema = z.looseObject({
  id: z.string(),
  title: z.string(),
  family: z.string(),
  files: z.record(z.string(), z.string()),
  packageStatus: z.string(),
  localPackage: z.boolean(),
  version: z.string(),
  minimumCoreVersion: z.string().optional(),
  registryItemName: z.string().optional(),
  acceptance: z.string(),
  variants: z.record(z.string(), z.object({ label: z.string(), source: z.string() })).optional(),
  variantControl: z.string().optional(),
  defaultVariant: z.string().optional(),
  dataAlternativeInSource: z.boolean().optional(),
  dataAlternative: z
    .object({
      caption: z.string(),
      columns: z.record(z.string(), z.string()),
      rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
    })
    .optional(),
});

/** @typedef {import("zod").infer<typeof componentBundleSchema>} ComponentBundleData */

export const componentBundlesSchema = z
  .record(z.string(), componentBundleSchema)
  .superRefine((bundles, context) => {
    for (const [id, bundle] of Object.entries(bundles)) {
      if (bundle.id !== id)
        context.addIssue({
          code: "custom",
          path: [id, "id"],
          message: `Bundle id must match generated key: ${id}`,
        });
      if (bundle.files[`src/examples/${id}/example.tsx`] === undefined)
        context.addIssue({
          code: "custom",
          path: [id, "files"],
          message: `Missing complete example source: ${id}`,
        });
      if (
        bundle.defaultVariant !== undefined &&
        bundle.variants?.[bundle.defaultVariant] === undefined
      )
        context.addIssue({
          code: "custom",
          path: [id, "defaultVariant"],
          message: `Unknown default variant: ${bundle.defaultVariant}`,
        });
    }
  });

/**
 * @template {string} T
 * @param {Record<string, ComponentBundleData>} bundles
 * @param {T} id
 * @returns {ComponentBundleData & {id: T}}
 */
export function componentBundleFor(bundles, id) {
  const bundle = bundles[id];
  if (!bundle || bundle.id !== id) throw new Error(`Missing matching component bundle: ${id}`);
  return { ...bundle, id };
}
