export interface RegistryComposition {
  exampleId: string;
  name: string;
  title: string;
  description: string;
}
export const registryItems: RegistryComposition[];
export function itemNameFor(exampleId: string): string;
export const coreVersion: string;
export const registryHomepage: string;
export const registryEndpoint: string;
export const sourcePaths: string[];
export const registryCss: Record<string, Record<string, never>>;
