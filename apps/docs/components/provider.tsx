"use client";
import { RootProvider } from "fumadocs-ui/provider/next";
import { MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import type { ComponentProps, ReactNode } from "react";

const SearchDialog = dynamic(() => import("fumadocs-ui/components/dialog/search-default"), {
  ssr: false,
});
function StaticSearchDialog(props: ComponentProps<typeof SearchDialog>) {
  return <SearchDialog {...props} type="static" api="/api/search" />;
}
export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
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
