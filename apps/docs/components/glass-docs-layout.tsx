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
import { useEffect, useRef } from "react";

import { DocsThemeSwitch } from "@/components/theme-switch";
import { docRoute } from "@/lib/routing.mjs";

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
      ? [node.url.replace(/\/$/, "")]
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
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      document
        .querySelector<HTMLButtonElement>('#nd-sidebar-mobile button[aria-label="Close Sidebar"]')
        ?.focus();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [open]);
  return (
    <SidebarDrawer
      contentProps={{
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
  const urls = pageUrls(tree.children);
  return (
    <GlassLayout
      {...props}
      tree={tree}
      sidebar={{ collapsible: false }}
      tabs={[
        {
          title: "Components",
          url: docRoute("/docs/components/line/"),
          urls: new Set(
            urls.filter(
              (url) =>
                !url.startsWith(docRoute("/docs/guides/")) &&
                !url.startsWith(docRoute("/docs/agents/")),
            ),
          ),
        },
        {
          title: "Guides",
          url: docRoute("/docs/guides/materials/"),
          urls: new Set(urls.filter((url) => url.startsWith(docRoute("/docs/guides/")))),
        },
        {
          title: "Agents",
          url: docRoute("/docs/agents/consumer/"),
          urls: new Set(urls.filter((url) => url.startsWith(docRoute("/docs/agents/")))),
        },
      ]}
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
