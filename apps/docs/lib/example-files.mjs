const deployedDocsUrl = "https://kindui.dev/charts/docs/";
export function filesFor(bundle, _settings, variant = bundle.defaultVariant) {
  const files = { ...bundle.files };
  if (variant && bundle.variants?.[variant])
    files[`src/examples/${bundle.id}/example.tsx`] = bundle.variants[variant].source;
  return files;
}
export function promptFor(bundle, _settings, variant = bundle.defaultVariant) {
  const base = new URL(`components/${bundle.family}/`, deployedDocsUrl).href;
  const markdown = new URL(`markdown/components/${bundle.family}.md`, deployedDocsUrl).href;
  const source = new URL(
    variant
      ? `examples/${bundle.id}/variants/${variant}/example.tsx`
      : `examples/${bundle.id}/src/examples/${bundle.id}/example.tsx`,
    deployedDocsUrl,
  ).href;
  const candidate = bundle.family === "treemap";
  return [
    `Build or adapt the Kind UI ${bundle.title} example from ${base}.`,
    candidate
      ? `Reference artifact: reviewed Treemap candidate, source version ${bundle.version}; checksum (SHA-256) ${bundle.candidateSha256}. Published @kind-ui/charts@0.5.0 does not contain Treemap. Obtain the matching reviewed archive or await a Charts release containing this API. Selected example: ${bundle.id}${variant ? ` (${variant})` : ""}.`
      : `Reference package: @kind-ui/charts@${bundle.version}. Check the app's installed version before using these APIs. Selected example: ${bundle.id}${variant ? ` (${variant})` : ""}.`,
    `Retrieve the standalone source: ${source}.`,
    `Read the family contract: ${markdown}. Setup: ${new URL("markdown/installation.md", deployedDocsUrl).href}. Example manifest: ${new URL(`examples/${bundle.id}/package.json`, deployedDocsUrl).href}.`,
    `${candidate ? "For this candidate, place the matching archive at vendor/kind-ui-charts-0.5.0.tgz before npm install; the setup manifest intentionally uses that file. Public registry installation is awaiting the feature release." : "Install @kind-ui/charts and its documented React, React DOM, Recharts and Motion peers."} Build Tailwind v4 CSS with an @source path to node_modules/@kind-ui/charts/dist relative to your CSS file. Use public exports and the example's composition owner.`,
    `Adapt the data to my task. Keep units, domains, stable identities and missing-value rules explicit; ask if they are unspecified. Include a meaningful chart name. Keep the example graph-only; do not add hidden alternative tables.`,
    `Run strict TypeScript and a production build. Check mobile containment, keyboard access, loading and reduced motion; report the results.`,
  ].join("\n\n");
}
