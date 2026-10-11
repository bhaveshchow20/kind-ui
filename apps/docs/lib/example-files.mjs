import { registryName } from "./registry-catalog.mjs";
import { publicPath } from "./routing.mjs";

export function registryInstallCommand(id) {
  return `npx shadcn@latest add @kind-ui/${id}`;
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
  const install = `Install the reusable ${name} component with npx shadcn@latest add @kind-ui/${name}. Manual installation uses the same component source and dependencies shown on the chart page. Edit components/charts/${name}.tsx. The npm core remains @kind-ui/charts@${bundle.version}. Supply your own data; preserve the selected example variant (${variant ?? "default"}) in the caller composition.`;
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
