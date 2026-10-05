import { readdirSync } from "node:fs";

// One family-owned catalog per component page; generation remains server-side.
const files = readdirSync(new URL(".", import.meta.url))
  .filter((file) => file.endsWith("-catalog.mjs"))
  .sort();
export const families = await Promise.all(
  files.map(async (file) => (await import(new URL(file, import.meta.url).href)).family),
);
const ids = new Set();
for (const family of families) {
  if (!family || !/^[a-z][a-z-]*$/.test(family.id)) throw new Error("Invalid component catalog");
  if (!family.examples?.length || family.examples[0].id !== family.id)
    throw new Error(`${family.id}: first example must be the primary component`);
  for (const example of family.examples) {
    if (ids.has(example.id)) throw new Error(`Duplicate example ${example.id}`);
    if (example.id !== family.id && !example.id.startsWith(`${family.id}-`))
      throw new Error(`${family.id}: example IDs must use the family prefix`);
    if (!family.dataLabels?.[example.id]) throw new Error(`Missing data labels: ${example.id}`);
    ids.add(example.id);
  }
}
export const examples = families.map((family) => family.examples[0]);
export const allExamples = families.flatMap((family) =>
  family.examples.map((example) => ({ ...example, family: family.id })),
);
export const dataLabels = Object.assign({}, ...families.map((family) => family.dataLabels));
export const variantDefinitions = Object.assign({}, ...families.map((family) => family.variants));
