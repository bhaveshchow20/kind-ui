/** @typedef {{id: string, family?: string | undefined, version: string, minimumCoreVersion?: string | undefined, packageStatus?: string | undefined, registryItemName?: string | undefined, files: Record<string, string>}} InstallationBundle */
/** @typedef {{title: string, description: string, code: string, language: "sh" | "css" | "tsx", filename: string}} InstallationStep */

/** @param {InstallationBundle} bundle */
export function installationFor(bundle) {
  const itemName = bundle.registryItemName;
  if (!itemName) throw new Error(`No registry installation for example ${bundle.id}`);
  const source = bundle.files[`src/examples/${bundle.id}/example.tsx`];
  if (source === undefined) throw new Error(`Missing installation source: ${bundle.id}`);
  const componentName = source.match(/export function (\w+)/)?.[1];
  if (!componentName) throw new Error(`Missing composition export: ${bundle.id}`);
  /** @type {InstallationStep[]} */
  const steps = [
    {
      title: "Install Core",
      description: "Add the package and its peers to your React 19.3 project.",
      code: `npm install @kind-ui/charts${bundle.minimumCoreVersion ? `@^${bundle.minimumCoreVersion}` : ""} motion recharts`,
      language: "sh",
      filename: "Terminal",
    },
    {
      title: "Configure Tailwind CSS v4",
      description:
        "Add this directive to your existing CSS entry. The path is relative to the CSS file; use ../../node_modules/@kind-ui/charts/dist from src/app/globals.css.",
      code: '@source "../node_modules/@kind-ui/charts/dist";',
      language: "css",
      filename: "src/app.css",
    },
    {
      title: "Create the composition",
      description: "Save this file in your components directory.",
      code: source,
      language: "tsx",
      filename: `components/${itemName}.tsx`,
    },
    {
      title: "Render the chart",
      description:
        "Import the composition using your component alias. Keep its client boundary in Next.js.",
      code: `import { ${componentName} } from "@/components/${itemName}";\n\nexport default function App() {\n  return <${componentName} />;\n}\n`,
      language: "tsx",
      filename: "App.tsx",
    },
  ];
  return {
    available: true,
    itemName,
    command: `npx shadcn@latest add @kind-ui/${itemName}`,
    steps,
  };
}

/** @param {InstallationBundle} bundle */
export function installationMarkdown(bundle) {
  const installation = installationFor(bundle);
  const { command, steps } = installation;
  return (
    "### CLI\n\nRun this command in your initialized shadcn project:\n\n" +
    `\`\`\`sh\n${command}\n\`\`\`\n\n` +
    "### Manual\n\n" +
    steps
      .map(
        (step) =>
          `#### ${step.title}\n\n${step.description}\n\n\`\`\`${step.language} title="${step.filename}"\n${step.code.trimEnd()}\n\`\`\`\n`,
      )
      .join("\n")
  );
}
