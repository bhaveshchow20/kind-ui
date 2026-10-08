import Script from "next/script";
import { analyticsScript } from "../../analytics.mjs";
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
  icons: {
    icon: { url: publicPath("/cherry-blossom.png"), type: "image/png", sizes: "512x512" },
    shortcut: publicPath("/cherry-blossom.png"),
    apple: publicPath("/cherry-blossom.png"),
  },
  ...indexingMetadata(),
};
export default function Layout({ children }: { children: ReactNode }) {
  const analytics = analyticsScript();
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
        {analytics && (
          <Script id="kind-ui-analytics" strategy="afterInteractive">
            {analytics}
          </Script>
        )}
      </body>
    </html>
  );
}
