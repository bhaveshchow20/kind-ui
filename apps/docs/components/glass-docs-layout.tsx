"use client";
import type * as PageTree from "fumadocs-core/page-tree";
import { SidebarTrigger, useSidebar as useDrawer } from "fumadocs-ui/components/sidebar/base";
import { SidebarTabsDropdown } from "fumadocs-ui/components/sidebar/tabs/dropdown";
import { GlassLayout, type GlassLayoutProps, useGlassLayout } from "fumadocs-ui/layouts/glass";
import {
  Sidebar,
  SidebarDrawer,
  SidebarProvider,
  useSidebar,
} from "fumadocs-ui/layouts/glass/slots/sidebar";
import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

import { DocsThemeSwitch } from "@/components/theme-switch";
import { docRoute, legacyDocSlugs } from "@/lib/routing.mjs";

function NavigationTitle() {
  const { slots, props } = useGlassLayout();
  const Title = props.nav?.title;
  return (
    <div className="glass-nav-title">
      <Link href={props.nav?.url ?? docRoute("/docs/")} className="font-semibold">
        {typeof Title === "function" ? <Title /> : Title}
      </Link>
      <div className="glass-mobile-tools md:hidden">
        {slots.searchTrigger && <slots.searchTrigger.full />}
        <SidebarTabsDropdown options={props.tabs} />
      </div>
    </div>
  );
}
function pageUrls(nodes: PageTree.Node[]): string[] {
  return nodes.flatMap((node) =>
    node.type === "page"
      ? [node.url.replace(/(.+)\/$/, "$1")]
      : node.type === "folder"
        ? pageUrls(node.children)
        : [],
  );
}
function SidebarWithTools() {
  const { slots } = useGlassLayout();
  return (
    <Sidebar>
      <div className="glass-sidebar-search">
        {slots.searchTrigger && <slots.searchTrigger.full />}
      </div>
      <div className="glass-sidebar-footer">{slots.themeSwitch && <slots.themeSwitch />}</div>
    </Sidebar>
  );
}
function AccessibleDrawer() {
  const { open, setOpen } = useDrawer();
  const focusDrawer = useCallback(
    (node: HTMLDivElement | null) => {
      if (!open || !node) return;
      let frame = 0;
      function focusWhenVisible() {
        if (!node?.isConnected) return;
        const close = node.querySelector<HTMLButtonElement>('button[aria-label="Close Sidebar"]');
        // Presence visibility can settle after its DOM class changes.
        if (
          !close ||
          getComputedStyle(close).visibility !== "visible" ||
          !close.getClientRects().length
        ) {
          frame = window.requestAnimationFrame(focusWhenVisible);
          return;
        }
        close.focus({ preventScroll: true });
      }
      frame = window.requestAnimationFrame(focusWhenVisible);
      return () => window.cancelAnimationFrame(frame);
    },
    [open],
  );
  return (
    <SidebarDrawer
      contentProps={{
        ref: focusDrawer,
        onKeyDown: (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
          }
        },
      }}
    />
  );
}
export function MobileDocsNavigation() {
  const { open } = useDrawer();
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!open && wasOpen.current) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);
  return (
    <SidebarTrigger
      ref={trigger}
      className="glass-mobile-trigger md:hidden"
      aria-label="Open Sidebar"
    >
      <PanelLeft size={18} />
    </SidebarTrigger>
  );
}
export function GlassDocsLayout({ children, tree, ...props }: GlassLayoutProps) {
  const tabs = tree.children.flatMap((section) => {
    if (section.type !== "folder") return [];
    const urls = pageUrls(section.children);
    if (!urls.length) return [];
    const activeUrls = new Set(urls);
    for (const slug of legacyDocSlugs) {
      if (activeUrls.has(docRoute(`/docs/${slug[1]}`)))
        activeUrls.add(docRoute(`/docs/${slug.join("/")}`));
    }
    if (activeUrls.has(docRoute("/docs"))) activeUrls.add("/");
    return [{ title: section.name, url: urls[0] === "/" ? "/" : `${urls[0]}/`, urls: activeUrls }];
  });
  return (
    <GlassLayout
      {...props}
      tree={tree}
      sidebar={{ collapsible: false }}
      tabs={tabs}
      slots={{
        themeSwitch: DocsThemeSwitch,
        header: () => null,
        navTitle: NavigationTitle,
        sidebar: {
          main: SidebarWithTools,
          drawer: AccessibleDrawer,
          provider: SidebarProvider,
          use: useSidebar,
        },
      }}
    >
      {children}
    </GlassLayout>
  );
}
