import { gte, valid } from "semver";
import { allExamples, examples } from "../apps/docs/examples/catalog.mjs";
import { chartItemName } from "./names.mjs";

export const coreVersion = "0.5.0";

/** @param {string | undefined} minimumCoreVersion @param {string} version */
export function isCoreVersionAvailable(minimumCoreVersion, version = coreVersion) {
  if (minimumCoreVersion === undefined) return true;
  if (!valid(minimumCoreVersion) || !valid(version))
    throw new Error("Registry Core versions must be valid semantic versions");
  return gte(version, minimumCoreVersion);
}

// The docs catalog owns chart choices and compositions; this catalog owns install addresses.
export const registryItems = [...examples, allExamples.find(({ id }) => id === "radial-activity")]
  .filter((example) => {
    if (!example) throw new Error("Missing canonical activity rings composition");
    return isCoreVersionAvailable(example.minimumCoreVersion);
  })
  .map((example) => {
    if (!example) throw new Error("Missing canonical activity rings composition");
    return {
      exampleId: example.id,
      name: chartItemName(example.id),
      title: example.title,
      description: example.notes,
    };
  });

export function itemNameFor(exampleId) {
  const item = registryItems.find((item) => item.exampleId === exampleId);
  if (!item) throw new Error(`No registry installation for example ${exampleId}`);
  return item.name;
}

export const registryHomepage = "https://kindui.dev/charts/";
export const registryEndpoint = "https://kindui.dev/r/";
export const sourcePaths = [
  "../node_modules/@kind-ui/charts/dist",
  "../../node_modules/@kind-ui/charts/dist",
  "../../../node_modules/@kind-ui/charts/dist",
];
export const registryCss = Object.fromEntries(sourcePaths.map((path) => [`@source "${path}"`, {}]));
