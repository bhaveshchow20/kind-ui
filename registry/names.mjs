/** @param {string} exampleId */
export function chartItemName(exampleId) {
  return exampleId === "radial-activity" ? "activity-rings" : `${exampleId}-chart`;
}
