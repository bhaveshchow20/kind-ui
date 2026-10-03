import { highlight } from "fumadocs-core/highlight";
import defaultComponents from "fumadocs-ui/mdx";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import bundles from "@/generated/examples.json";
import { source } from "@/lib/source";
import { ApiTable } from "./api-table";
import {
  type ComponentBundle,
  type ComponentId,
  ComponentPlayground,
} from "./component-playground";
import { ComponentSwitcher } from "./component-switcher";
import { CopyMarkdown } from "./copy-markdown";

async function ComponentExample({ id }: { id: ComponentId }) {
  const bundle = (bundles as unknown as Record<ComponentId, ComponentBundle>)[id];
  const sourceCode = await highlight(bundle.files[`src/examples/${id}/example.tsx`], {
    lang: "tsx",
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
  return <ComponentPlayground key={id} bundle={bundle} sourceCode={sourceCode} />;
}
export function renderDoc(slug?: string[]) {
  const page = source.getPage(slug);
  if (!page) notFound();
  const Content = page.data.body;
  const key = slug?.join("/") || "index";
  const component = slug?.[0] === "components" && slug[1];
  const section = slug?.[0] ? slug[0][0].toUpperCase() + slug[0].slice(1) : "Documentation";
  return (
    <div className="page-grid">
      <article id="docs-content" className="doc-article" tabIndex={-1}>
        <nav aria-label="Breadcrumb" className="doc-breadcrumb">
          <Link href={component ? "/docs/components/combo/" : "/docs/"}>{section}</Link>
          <ChevronRight size={13} />
          <span>{page.data.title}</span>
        </nav>
        <header className="doc-heading">
          <div className="doc-title-row">
            <h1>{page.data.title}</h1>
            {component && (
              <ComponentSwitcher
                current={component}
                families={Object.values(bundles).map(({ id, title }) => ({ id, title }))}
              />
            )}
            <CopyMarkdown path={`/markdown/${key}.md`} />
          </div>
          <p>{page.data.description}</p>
        </header>
        <div className="prose doc-body">
          <Content
            components={{ ...defaultComponents, ComponentPlayground: ComponentExample, ApiTable }}
          />
        </div>
        <footer className="doc-footer">
          <span>Unpublished preview · 0.0.0</span>
          <Link href="/docs/guides/release/">
            Package status
            <ChevronRight size={13} />
          </Link>
        </footer>
      </article>
      <aside className="page-toc">
        <p>On this page</p>
        {component && <a href="#component-preview">Preview</a>}
        {page.data.toc.map((item) => (
          <a key={item.url} href={item.url}>
            {item.title}
          </a>
        ))}
        <div className="toc-help">
          <p>Build with an agent</p>
          <Link href="/docs/agents/consumer/">
            Consumer guidance
            <ChevronRight size={13} />
          </Link>
          <a href="/llms.txt">
            llms.txt
            <ChevronRight size={13} />
          </a>
        </div>
      </aside>
    </div>
  );
}
