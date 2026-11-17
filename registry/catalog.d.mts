export interface RegistryItem {
  name: string;
  title: string;
  description: string;
  source: string;
}
export const registryItems: RegistryItem[];
export const coreVersion: string;
export const registryHomepage: string;
export const registryEndpoint: string;
export const sourcePaths: string[];
export const registryCss: Record<string, Record<string, never>>;
