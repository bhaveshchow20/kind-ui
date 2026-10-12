interface InstallationBundle {
  id: string;
  family?: string | undefined;
  packageStatus?: string | undefined;
  candidateSha256?: string | undefined;
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
  available: boolean;
  message?: string;
  itemName: string;
  command: string;
  steps: InstallationStep[];
};
export function installationMarkdown(bundle: InstallationBundle): string;
