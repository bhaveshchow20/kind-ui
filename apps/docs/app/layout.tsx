import "@fontsource-variable/geist";
import "@kind-ui/charts/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DocsShell, type NavigationGroup } from "@/components/docs-shell";
import { Provider } from "@/components/provider";
import bundles from "@/generated/examples.json";
import { source } from "@/lib/source";
export const metadata: Metadata = {
  title: { default: "Kind UI charts · Documentation", template: "%s · Kind UI charts" },
  description:
    "React chart components with native Recharts composition, complete examples and public API reference.",
  icons: { icon: "/favicon.svg" },
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: ReactNode }) {
  const pages = source.getPages();
  const groups: NavigationGroup[] = [
    {
      title: "Start",
      items: [
        { title: "Introduction", url: "/docs/" },
        { title: "Installation", url: "/docs/start/installation/" },
      ],
    },
    {
      title: "Components",
      items: Object.values(bundles).map((item) => ({
        title: item.title,
        url: `/docs/components/${item.id}/`,
      })),
    },
    ...["Concepts", "Reference", "Guides", "Agents"].map((title) => ({
      title,
      items: pages
        .filter((page) => page.url.startsWith(`/docs/${title.toLowerCase()}/`))
        .map((page) => ({ title: page.data.title, url: page.url })),
    })),
  ];
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#docs-content" className="skip-link">
          Skip to content
        </a>
        <Provider>
          <DocsShell groups={groups}>{children}</DocsShell>
        </Provider>
      </body>
    </html>
  );
}
