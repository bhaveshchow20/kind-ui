interface ExampleBundle {
  id: string;
  title?: string;
  files: Record<string, string>;
  variants?: Record<string, { label: string; source: string }>;
  defaultVariant?: string;
  dataAlternative?: unknown;
  packageStatus?: string;
  localPackage?: boolean;
  version?: string;
  acceptance?: string;
}
export function filesFor(
  bundle: ExampleBundle,
  settings: unknown,
  variant?: string,
): Record<string, string>;
export function promptFor(
  bundle: ExampleBundle,
  settings: unknown,
  origin: string,
  variant?: string,
): string;
