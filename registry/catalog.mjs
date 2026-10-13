import { allExamples, examples } from "../apps/docs/examples/catalog.mjs";
import { chartItemName } from "./names.mjs";

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
    ...(example.id === "treemap" ? { minimumCoreVersion: "0.6.0" } : {}),
  };
});

export function itemNameFor(exampleId) {
  const item = registryItems.find((item) => item.exampleId === exampleId);
  if (!item) throw new Error(`No registry installation for example ${exampleId}`);
  return item.name;
}

export const coreVersion = "0.5.0";
export const registryHomepage = "https://kindui.dev/charts/";
export const registryEndpoint = "https://kindui.dev/r/";
export const sourcePaths = [
  "../node_modules/@kind-ui/charts/dist",
  "../../node_modules/@kind-ui/charts/dist",
  "../../../node_modules/@kind-ui/charts/dist",
];
export const registryCss = Object.fromEntries(sourcePaths.map((path) => [`@source "${path}"`, {}]));
