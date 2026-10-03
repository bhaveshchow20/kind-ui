export function filesFor(
  bundle: { id: string; files: Record<string, string> },
  settings: unknown,
): Record<string, string>;
export function promptFor(
  bundle: {
    id: string;
    title: string;
    files: Record<string, string>;
    packageStatus: string;
    localPackage: boolean;
    version: string;
    acceptance: string;
  },
  settings: unknown,
  origin: string,
): string;
