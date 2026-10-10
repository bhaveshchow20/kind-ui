import { publicPath } from "./routing.mjs";

export function registryInstallCommand(id, origin = "") {
  const path = publicPath(`/r/kind-${id}.json`);
  // biome-ignore lint/suspicious/noTemplateCurlyInString: the consumer shell expands this value.
  const configuredOrigin = "${KIND_DOCS_ORIGIN:?Set KIND_DOCS_ORIGIN to the docs site origin}";
  const url = origin ? `${origin}${path}` : `"${configuredOrigin}${path}"`;
  return `npx shadcn@latest add ${url}`;
}
export function filesFor(bundle, _settings, variant = bundle.defaultVariant) {
  const files = { ...bundle.files };
  if (variant && bundle.variants?.[variant])
    files[`src/examples/${bundle.id}/example.tsx`] = bundle.variants[variant].source;
  return files;
}
export function promptFor(bundle, settings, origin, variant = bundle.defaultVariant) {
  const base = new URL(publicPath(`/docs/components/${bundle.family}/`), origin).href;
  const markdown = new URL(publicPath(`/markdown/components/${bundle.family}.md`), origin).href;
  const source = new URL(
    publicPath(
      variant
        ? `/examples/${bundle.id}/variants/${variant}/example.tsx`
        : `/examples/${bundle.id}/src/examples/${bundle.id}/example.tsx`,
    ),
    origin,
  ).href;
  const install =
    settings?.distribution === "shadcn"
      ? `Install the editable recipe with npx shadcn@latest add ${new URL(publicPath(`/r/kind-${bundle.id}.json`), origin).href}. It depends on @kind-ui/charts@${bundle.version}; edit components/charts/${bundle.id}/example.tsx. Preserve the selected variant (${variant ?? "default"}) in the component props.`
      : `Install @kind-ui/charts and its documented React, React DOM, Recharts and Motion peers. Import @kind-ui/charts/styles.css once. Use public exports and the example's composition owner.`;
  return [
    `Build or adapt the Kind UI ${bundle.title} example from ${base}.`,
    `Reference package: @kind-ui/charts@${bundle.version}. Check the app's installed version before using these APIs. Selected example: ${bundle.id}${variant ? ` (${variant})` : ""}.`,
    `Retrieve the standalone source: ${source}.`,
    `Read the family contract: ${markdown}. Setup: ${new URL(publicPath("/markdown/installation.md"), origin).href}. Example manifest: ${new URL(publicPath(`/examples/${bundle.id}/package.json`), origin).href}.`,
    install,
    `Adapt the data to my task. Keep units, domains, stable identities and missing-value rules explicit; ask if they are unspecified. Include a chart name and complete data alternative.`,
    `Run strict TypeScript and a production build. Check mobile containment, keyboard access, loading and reduced motion; report the results.`,
  ].join("\n\n");
}
