import "@fontsource-variable/geist";
import "@kind-ui/charts/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GlassDocsLayout } from "@/components/glass-docs-layout";
import { Provider } from "@/components/provider";
import { source } from "@/lib/source";

export const metadata: Metadata = {
  title: { default: "Kind UI charts · Documentation", template: "%s · Kind UI charts" },
  description: "React chart components with native Recharts composition and complete examples.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
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
              url: "/docs/",
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
