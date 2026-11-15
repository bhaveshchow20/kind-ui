interface ExampleBundle {
  id: string;
  family: string;
  title?: string | undefined;
  files: Record<string, string>;
  variants?: Record<string, { label: string; source: string }> | undefined;
  defaultVariant?: string | undefined;
  packageStatus?: string | undefined;
  localPackage?: boolean | undefined;
  version?: string | undefined;
  coreRequirement?: string | undefined;
  acceptance?: string | undefined;
}
interface PromptBundle {
  id: string;
  family: string;
  title: string;
  defaultVariant?: string | undefined;
}
export function filesFor(
  bundle: ExampleBundle,
  settings: unknown,
  variant?: string,
): Record<string, string>;
export function promptFor(bundle: PromptBundle, settings: unknown, variant?: string): string;
