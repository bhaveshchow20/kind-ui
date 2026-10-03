"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ArrowUpRight, CodeXml, Menu, Moon, Search, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { type ReactNode, useState } from "react";
import { Button } from "./ui/button";
export type NavigationGroup = { title: string; items: { title: string; url: string }[] };
function Wordmark() {
  return (
    <Link href="/docs/" className="kind-wordmark" aria-label="Kind UI charts documentation">
      kind<span>ui</span>
      <small>charts</small>
    </Link>
  );
}
function Navigation({ groups, close }: { groups: NavigationGroup[]; close?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Documentation" className="docs-navigation">
      {groups.map((group) => (
        <section key={group.title}>
          <h2>
            {group.title}
            {group.title === "Components" && <span>13</span>}
          </h2>
          {group.items.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              prefetch={false}
              className={`docs-nav-link${path.replace(/\/$/, "") === item.url.replace(/\/$/, "") ? " is-current" : ""}`}
              aria-current={
                path.replace(/\/$/, "") === item.url.replace(/\/$/, "") ? "page" : undefined
              }
              onClick={close}
            >
              {item.title}
            </Link>
          ))}
        </section>
      ))}
    </nav>
  );
}
export function DocsShell({
  groups,
  children,
}: {
  groups: NavigationGroup[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { setOpenSearch } = useSearchContext();
  return (
    <div className="docs-shell">
      <header className="docs-header">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="sheet-overlay" />
            <Dialog.Content className="docs-sheet">
              <div className="sheet-heading">
                <Wordmark />
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" aria-label="Close navigation">
                    <X size={18} />
                  </Button>
                </Dialog.Close>
              </div>
              <Dialog.Title className="sr-only">Documentation navigation</Dialog.Title>
              <Dialog.Description className="sr-only">
                Browse chart components and guides.
              </Dialog.Description>
              <Navigation groups={groups} close={() => setOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <Wordmark />
        <nav aria-label="Main" className="header-links">
          <Link href="/docs/components/combo/" className="header-active">
            Components
          </Link>
          <Link href="/docs/guides/materials/">Guides</Link>
          <Link href="/docs/agents/consumer/">Agents</Link>
          <a
            href="https://kind-ui-charts.angrypirate20.chatgpt.site"
            target="_blank"
            rel="noreferrer"
          >
            Showcase
            <ArrowUpRight size={12} />
          </a>
        </nav>
        <div className="header-actions">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search documentation"
            onClick={() => setOpenSearch(true)}
          >
            <Search size={17} />
          </Button>
          <span className="header-divider" />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun size={17} className="sun-icon" />
            <Moon size={17} className="moon-icon" />
          </Button>
          <a
            href="https://github.com/bhaveshchow20/kind-ui"
            aria-label="Kind UI on GitHub"
            className="github-icon"
          >
            <CodeXml size={17} />
          </a>
        </div>
      </header>
      <aside className="docs-sidebar">
        <Navigation groups={groups} />
        <div className="sidebar-version">
          <span className="preview-dot" />
          0.0.0<span>Unpublished preview</span>
        </div>
      </aside>
      <div className="docs-main">{children}</div>
    </div>
  );
}
