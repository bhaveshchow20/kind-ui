import assert from "node:assert/strict";

// Recipe links resolve on the canonical repository branch and name existing files.
export const recipeSourceRef = "main";
export const recipeSourcePrefix = `https://github.com/bhaveshchow20/kind-ui/blob/${recipeSourceRef}/examples/chart/`;

export function assertDocumentationContract(readme, recipeFiles, packedFiles) {
  const recipes = [];
  for (const [, target] of readme.matchAll(/\]\(([^)]+)\)/g)) {
    if (target.startsWith(recipeSourcePrefix)) {
      const file = target.slice(recipeSourcePrefix.length).split("#")[0];
      assert.ok(recipeFiles.includes(file), `Missing recipe source: ${file}`);
      recipes.push(file);
    } else if (target.includes("/examples/chart/") || target.startsWith("../../examples")) {
      assert.fail(`Recipe link must use the canonical repository recipe route: ${target}`);
    } else if (!/^(https?:|#)/.test(target)) {
      assert.ok(packedFiles.includes(target.split("#")[0]), `Link leaves the package: ${target}`);
    }
  }
  assert.deepEqual(recipes.sort(), [
    "BARS.md",
    "COMBOS.md",
    "HEATMAPS.md",
    "POLAR-GALLERY.md",
    "SCATTERS.md",
    "waterfall-recipes.tsx",
    "waterfalls.html",
  ]);
}
