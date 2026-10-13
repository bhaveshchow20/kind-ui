interface InstallationBundle {
  id: string;
  family?: string | undefined;
  packageStatus?: string | undefined;
  version: string;
  minimumCoreVersion?: string | undefined;
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
export function installationFor(bundle: InstallationBundle): {
  available: boolean;
  itemName: string;
  command: string;
  steps: InstallationStep[];
};
export function installationMarkdown(bundle: InstallationBundle): string;
