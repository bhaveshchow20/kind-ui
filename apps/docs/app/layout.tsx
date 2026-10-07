import "@fontsource-variable/geist";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GlassDocsLayout } from "@/components/glass-docs-layout";
import { Provider } from "@/components/provider";
import { docRoute, publicPath } from "@/lib/routing.mjs";
import { source } from "@/lib/source";
import { indexingMetadata } from "../../indexing.mjs";

export const metadata: Metadata = {
  title: { default: "Kind UI charts · Documentation", template: "%s · Kind UI charts" },
  description: "React chart components with native Recharts composition and complete examples.",
  icons: { icon: publicPath("/favicon.svg") },
  ...indexingMetadata(),
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#docs-content" className="skip-link">
          Skip to content
        </a>
        <Provider>
          <GlassDocsLayout
            tree={source.getPageTree()}
            nav={{
              title: (
                <span className="kind-wordmark">
                  kind<span>ui</span>
                  <small>charts</small>
                </span>
              ),
              url: docRoute("/docs/"),
            }}
            githubUrl="https://github.com/bhaveshchow20/kind-ui"
          >
            {children}
          </GlassDocsLayout>
        </Provider>
      </body>
    </html>
  );
}
