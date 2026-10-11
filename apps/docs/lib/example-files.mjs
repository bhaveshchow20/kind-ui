import { registryName } from "./registry-catalog.mjs";
import { publicPath } from "./routing.mjs";

export function registryInstallCommand(id, origin = "") {
  const path = publicPath(`/r/${id}.json`);
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
export function promptFor(bundle, _settings, origin, variant = bundle.defaultVariant) {
  const base = new URL(publicPath(`/docs/components/${bundle.family}/`), origin).href;
  const markdown = new URL(publicPath(`/markdown/components/${bundle.family}.md`), origin).href;
  const source = new URL(
    publicPath(
      variant
        ? `/registry-examples/${bundle.id}/${variant}.tsx`
        : `/registry-examples/${bundle.id}/example.tsx`,
    ),
    origin,
  ).href;
  const name = registryName(bundle.family, bundle.id);
  const install = `Install the reusable ${name} component: configure @kind-ui in components.json as ${new URL(publicPath("/r/{name}.json"), origin).href.replace("%7Bname%7D", "{name}")}, then run npx shadcn@latest add @kind-ui/${name}. The namespace requires that one-time project mapping until official registration. Manual installation uses the identical source and dependencies at ${new URL(publicPath(`/r/${name}.json`), origin).href}. Edit components/charts/${name}.tsx. The npm core remains @kind-ui/charts@${bundle.version}. Supply your own data; preserve the selected example variant (${variant ?? "default"}) in the caller composition. Do not install an old named demo recipe.`;
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
