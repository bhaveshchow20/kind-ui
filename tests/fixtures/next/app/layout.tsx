import type { ReactNode } from "react";
import "@kind-ui/charts/styles.css";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
