import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Provider } from "@/components/provider";
import { appName, basePath, origin } from "@/lib/shared";
import "./global.css";

export const metadata: Metadata = {
  metadataBase: new URL(`${origin}${basePath}`),
  title: { template: `%s | ${appName}`, default: appName },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
