export function filesFor(bundle, settings) {
  const files = { ...bundle.files };
  files[`src/examples/${bundle.id}/settings.ts`] =
    `import type { ExampleSettings } from "./example";\nexport const defaultSettings: ExampleSettings = ${JSON.stringify(settings, null, 2)};\n`;
  return files;
}
export function promptFor(bundle, settings, origin) {
  const base = new URL(`/docs/components/${bundle.id}/`, origin).href;
  return [
    `Build the Kind UI ${bundle.title} example using its verified consumer example.`,
    `Package: ${bundle.packageStatus}. React 19.3.0, Recharts 3.10.1, Motion 13.4.6.`,
    `Read ${base} and ${new URL(`/markdown/components/${bundle.id}.md`, origin).href}.`,
    `Selected settings: ${JSON.stringify(settings)}.`,
    `Download the complete example from the example page and replace src/examples/${bundle.id}/settings.ts with the settings below before running npm install and npm run build.`,
    bundle.localPackage
      ? "The package is unpublished. Use the included pinned vendor tarball; do not invent an npm registry installation command."
      : `Install the exact published @kind-ui/charts@${bundle.version}.`,
    "Import chart presentation from @kind-ui/charts, engine axes/Cells from recharts, and @kind-ui/charts/styles.css. Keep data, geometry and filtering consumer-owned. Preserve the data alternative and reduced motion behavior.",
    `Acceptance: ${bundle.acceptance}`,
    "Transient pointer/focus emphasis is not an initial setting. Visibility and persistent controls are.",
    "```ts",
    filesFor(bundle, settings)[`src/examples/${bundle.id}/settings.ts`],
    "```",
  ].join("\n\n");
}
