export function filesFor(bundle, _settings, variant = bundle.defaultVariant) {
  const files = { ...bundle.files };
  if (variant && bundle.variants?.[variant])
    files[`src/examples/${bundle.id}/example.tsx`] = bundle.variants[variant].source;
  return files;
}
export function promptFor(bundle, _settings, origin, variant = bundle.defaultVariant) {
  const base = new URL(`/docs/components/${bundle.family}/`, origin).href;
  return [
    `Build the Kind UI ${bundle.title} component from ${base}.`,
    `Package: ${bundle.packageStatus}.`,
    `Retrieve the standalone source: ${new URL(variant ? `/examples/${bundle.id}/variants/${variant}/example.tsx` : `/examples/${bundle.id}/src/examples/${bundle.id}/example.tsx`, origin).href}.`,
    `The package is unpublished; use the pinned artifact at ${new URL("/examples/package/kind-ui-charts-0.0.0.tgz", origin).href}. See ${new URL("/docs/start/installation/", origin).href} for setup.`,
    `Preserve the complete data, chart composition, ${bundle.family === "line" ? "default legend toggles" : "documented visibility behavior"} and reduced-motion behavior. No demo settings or controls modules are needed. Include an accessible data alternative when embedding the chart.`,
  ].join("\n\n");
}
