/** @typedef {{id: string, version: string, coreRequirement?: string | undefined, registryItemName?: string | undefined, files: Record<string, string>}} InstallationBundle */
/** @typedef {{title: string, description: string, code: string, language: "sh" | "css" | "tsx", filename: string}} InstallationStep */
/** @typedef {"npm" | "pnpm" | "yarn" | "bun"} PackageManager */
/** @typedef {{manager: PackageManager, command: string}} PackageInstallCommand */

const coreInstallCommand = "npm install @kind-ui/charts motion recharts";
/** @type {readonly PackageInstallCommand[]} */
export const coreInstallCommands = [
  { manager: "npm", command: coreInstallCommand },
  { manager: "pnpm", command: "pnpm add @kind-ui/charts motion recharts" },
  { manager: "yarn", command: "yarn add @kind-ui/charts motion recharts" },
  { manager: "bun", command: "bun add @kind-ui/charts motion recharts" },
];

/** @param {InstallationBundle} bundle */
export function installationFor(bundle) {
  const itemName = bundle.registryItemName;
  if (!itemName) throw new Error(`No registry installation for example ${bundle.id}`);
  const source = bundle.files[`src/examples/${bundle.id}/example.tsx`];
  if (source === undefined) throw new Error(`Missing installation source: ${bundle.id}`);
  const componentName = source.match(/export function (\w+)/)?.[1];
  if (!componentName) throw new Error(`Missing composition export: ${bundle.id}`);
  const installCommands = bundle.coreRequirement
    ? coreInstallCommands.map(({ manager, command }) => ({
        manager,
        command: command.replace("@kind-ui/charts", `@kind-ui/charts@${bundle.coreRequirement}`),
      }))
    : coreInstallCommands;
  /** @type {InstallationStep[]} */
  const steps = [
    {
      title: "Install Core",
      description: "Add the package and its peers to your React 19.3 project.",
      code: installCommands[0]?.command ?? coreInstallCommand,
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
  const command = `npx shadcn@latest add @kind-ui/${itemName}`;
  /** @type {readonly PackageInstallCommand[]} */
  const cliCommands = [
    { manager: "npm", command },
    { manager: "pnpm", command: `pnpm dlx shadcn@latest add @kind-ui/${itemName}` },
    { manager: "yarn", command: `yarn dlx shadcn@latest add @kind-ui/${itemName}` },
    { manager: "bun", command: `bunx shadcn@latest add @kind-ui/${itemName}` },
  ];
  return { itemName, command, cliCommands, coreInstallCommands: installCommands, steps };
}

/** @param {readonly PackageInstallCommand[]} commands @param {number} level */
function commandMarkdown(commands, level) {
  return commands
    .map(
      ({ manager, command }) =>
        `${"#".repeat(level)} ${manager}\n\n\`\`\`sh title="Terminal"\n${command}\n\`\`\`\n`,
    )
    .join("\n");
}

/** @param {InstallationBundle} bundle */
export function installationMarkdown(bundle) {
  const { cliCommands, coreInstallCommands, steps } = installationFor(bundle);
  return (
    "### CLI\n\nRun this command in your initialized shadcn project:\n\n" +
    commandMarkdown(cliCommands, 4) +
    "\n" +
    "### Manual\n\n" +
    steps
      .map(
        (step, index) =>
          `#### ${step.title}\n\n${step.description}\n\n` +
          (index === 0
            ? commandMarkdown(coreInstallCommands, 5)
            : `\`\`\`${step.language} title="${step.filename}"\n${step.code.trimEnd()}\n\`\`\`\n`),
      )
      .join("\n")
  );
}
