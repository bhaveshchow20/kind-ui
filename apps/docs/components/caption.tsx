import type { ReactNode } from "react";

/** Secondary text in the same muted style as an example's caption. */
export function Caption({ children }: { children: ReactNode }) {
  return <div className="text-fd-muted-foreground text-sm leading-7 [&_p]:my-2">{children}</div>;
}
