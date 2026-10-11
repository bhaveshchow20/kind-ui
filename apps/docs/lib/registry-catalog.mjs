export function registryName(family, id = "") {
  return id === "radial-activity"
    ? "activity-rings"
    : family === "radial"
      ? "radial-bar-chart"
      : `${family}-chart`;
}
export function localExample(source, family, id) {
  return source.replace(
    'from "@kind-ui/charts"',
    `from "@/components/charts/${registryName(family, id)}"`,
  );
}
