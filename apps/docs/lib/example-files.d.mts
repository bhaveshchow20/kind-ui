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
  minimumCoreVersion?: string | undefined;
  acceptance?: string | undefined;
}
export function filesFor(
  bundle: ExampleBundle,
  settings: unknown,
  variant?: string,
): Record<string, string>;
export function promptFor(bundle: ExampleBundle, settings: unknown, variant?: string): string;
