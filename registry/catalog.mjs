import { allExamples, examples } from "../apps/docs/examples/catalog.mjs";
import { chartItemName } from "./names.mjs";

export const coreVersion = "0.5.0";

// The docs catalog owns chart choices and compositions; this catalog owns install addresses.
export const registryItems = [
  ...examples,
  allExamples.find(({ id }) => id === "radial-activity"),
].map((example) => {
  if (!example) throw new Error("Missing canonical activity rings composition");
  return {
    exampleId: example.id,
    name: chartItemName(example.id),
    title: example.title,
    description: example.notes,
    coreRequirement: coreRequirementFor(example.id),
  };
});

export function itemNameFor(exampleId) {
  const item = registryItems.find((item) => item.exampleId === exampleId);
  if (!item) throw new Error(`No registry installation for example ${exampleId}`);
  return item.name;
}

/** @param {string} exampleId */
export function coreRequirementFor(exampleId) {
  const example = allExamples.find(({ id }) => id === exampleId);
  if (!example) throw new Error(`No Core requirement for example ${exampleId}`);
  return example.family === "funnel" ? "^0.6.0" : coreVersion;
}
export const registryHomepage = "https://kindui.dev/charts/";
export const registryEndpoint = "https://kindui.dev/r/";
export const sourcePaths = [
  "../node_modules/@kind-ui/charts/dist",
  "../../node_modules/@kind-ui/charts/dist",
  "../../../node_modules/@kind-ui/charts/dist",
];
export const registryCss = Object.fromEntries(sourcePaths.map((path) => [`@source "${path}"`, {}]));
