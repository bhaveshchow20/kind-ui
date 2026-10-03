export function filesFor(bundle, settings, variant = bundle.defaultVariant) {
  const files = { ...bundle.files };
  if (bundle.dataAlternative) {
    if (variant && bundle.variants?.[variant])
      files[`src/examples/${bundle.id}/example.tsx`] = bundle.variants[variant].source;
    return files;
  }
  files[`src/examples/${bundle.id}/settings.ts`] =
    `import type { ExampleSettings } from "./example";\nexport const defaultSettings: ExampleSettings = ${JSON.stringify(settings, null, 2)};\n`;
  return files;
}
export function promptFor(bundle, settings, origin, variant = bundle.defaultVariant) {
  const isLine = bundle.id === "line" || bundle.id.startsWith("line-");
  const docId = isLine ? "line" : bundle.id;
  const base = new URL(`/docs/components/${docId}/`, origin).href;
  if (isLine)
    return [
      `Build the Kind UI ${bundle.title} component from ${base}.`,
      `Package: ${bundle.packageStatus}.`,
      `Retrieve the standalone source: ${new URL(variant ? `/examples/${bundle.id}/variants/${variant}/example.tsx` : `/examples/${bundle.id}/src/examples/${bundle.id}/example.tsx`, origin).href}.`,
      `The package is unpublished; use the pinned artifact at ${new URL("/examples/package/kind-ui-charts-0.0.0.tgz", origin).href}. See ${new URL("/docs/guides/release/", origin).href} for setup.`,
      "Preserve the complete data, chart composition, default legend toggles and reduced-motion behavior. No demo settings or controls modules are needed. Include an accessible data alternative when embedding the chart.",
    ].join("\n\n");
  return [
    `Build the Kind UI ${bundle.title} example using its verified consumer example.`,
    `Package: ${bundle.packageStatus}. React 19.3.0, Recharts 3.10.1, Motion 13.4.6.`,
    `Read ${base} and ${new URL(`/markdown/components/${docId}.md`, origin).href}.`,
    `Selected settings: ${JSON.stringify(settings)}.`,
    `Download the complete example from the example page and replace src/examples/${bundle.id}/settings.ts with the settings below before running npm install and npm run build.`,
    bundle.localPackage
      ? "The package is unpublished. Use the included pinned vendor tarball; do not invent an npm registry installation command."
      : `Install the exact published @kind-ui/charts@${bundle.version}.`,
    "Import chart presentation from @kind-ui/charts, engine axes/Cells from recharts, and @kind-ui/charts/styles.css. Keep data, geometry and filtering consumer-owned. Preserve the data alternative and reduced motion behavior.",
    `Acceptance: ${bundle.acceptance}`,
    "Transient pointer/focus emphasis is not an initial setting. Legend visibility and selected flow identity are reproducible settings.",
    "```ts",
    filesFor(bundle, settings)[`src/examples/${bundle.id}/settings.ts`],
    "```",
  ].join("\n\n");
}
