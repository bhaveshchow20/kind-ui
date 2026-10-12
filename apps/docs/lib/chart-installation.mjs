/** @typedef {{id: string, version: string, registryItemName?: string | undefined, releasePending?: boolean | undefined, minimumCoreVersion?: string | undefined, files: Record<string, string>}} InstallationBundle */
/** @typedef {{title: string, description: string, code: string, language: "sh" | "css" | "tsx", filename: string}} InstallationStep */

/** @param {InstallationBundle} bundle */
export function pendingInstallationMessage(bundle) {
  if (!bundle.releasePending || !bundle.minimumCoreVersion)
    throw new Error(`Missing pending release requirement for example ${bundle.id}`);
  return `This example uses a validated source candidate of Core ${bundle.version}. Published Core ${bundle.version} does not include these APIs. Public npm and registry installation require Core ${bundle.minimumCoreVersion} or later. Verify with the approved candidate artifact, or wait for that release before installing the public example.`;
}

/** @param {InstallationBundle} bundle */
export function installationFor(bundle) {
  if (bundle.releasePending) throw new Error(pendingInstallationMessage(bundle));
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
      code: "npm install @kind-ui/charts motion recharts",
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
  return { itemName, command: `npx shadcn@latest add @kind-ui/${itemName}`, steps };
}

/** @param {InstallationBundle} bundle */
export function installationMarkdown(bundle) {
  if (bundle.releasePending) return `${pendingInstallationMessage(bundle)}\n`;
  const { command, steps } = installationFor(bundle);
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
