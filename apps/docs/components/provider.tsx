"use client";
import { RootProvider } from "fumadocs-ui/provider/next";
import { MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { docRoute, publicPath } from "@/lib/routing.mjs";

const SearchDialog = dynamic(() => import("fumadocs-ui/components/dialog/search-default"), {
  ssr: false,
});
function StaticSearchDialog(props: ComponentProps<typeof SearchDialog>) {
  return <SearchDialog {...props} type="static" api={publicPath("/api/search")} />;
}
function DocsLink({
  href = "#",
  prefetch,
  ...props
}: ComponentProps<"a"> & { prefetch?: boolean }) {
  const route = docRoute(href);
  if (
    /^\/(?:examples|markdown|llms(?:-full)?\.txt|package-provenance\.json|AGENTS\.md)(?:\/|$|[?#])/.test(
      route,
    )
  ) {
    return <a {...props} href={publicPath(route)} />;
  }
  return <Link {...props} prefetch={prefetch} href={route} />;
}
export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      components={{ Link: DocsLink }}
      theme={{ defaultTheme: "system", hotKey: false }}
      search={{
        SearchDialog: StaticSearchDialog,
        preload: false,
      }}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </RootProvider>
  );
}
