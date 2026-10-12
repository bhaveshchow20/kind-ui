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
export function installationFor(bundle: InstallationBundle): {
  itemName: string;
  command: string;
  steps: InstallationStep[];
};
export function installationMarkdown(bundle: InstallationBundle): string;
