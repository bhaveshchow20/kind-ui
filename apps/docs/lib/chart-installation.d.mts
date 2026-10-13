interface InstallationBundle {
  id: string;
  version: string;
  registryItemName?: string | undefined;
  files: Record<string, string>;
}
export interface InstallationStep {
  title: string;
  description: string;
  code: string;
  language: "sh" | "css" | "tsx";
  filename: string;
}
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export interface PackageInstallCommand {
  manager: PackageManager;
  command: string;
}
export const coreInstallCommands: readonly PackageInstallCommand[];
export function installationFor(bundle: InstallationBundle): {
  itemName: string;
  command: string;
  cliCommands: readonly PackageInstallCommand[];
  coreInstallCommands: readonly PackageInstallCommand[];
  steps: InstallationStep[];
};
export function installationMarkdown(bundle: InstallationBundle): string;
