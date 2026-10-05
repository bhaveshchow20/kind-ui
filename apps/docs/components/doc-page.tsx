import { highlight } from "fumadocs-core/highlight";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/glass/page";
import defaultComponents from "fumadocs-ui/mdx";
import Link from "next/link";
import { notFound } from "next/navigation";
import bundles from "@/generated/all-examples.json";
import { docRoute, publicPath } from "@/lib/routing.mjs";
import { source } from "@/lib/source";
import { ApiTable } from "./api-table";
import {
  type ComponentBundle,
  type ComponentId,
  ComponentPlayground,
} from "./component-playground";
import { CopyMarkdown } from "./copy-markdown";
import { MobileDocsNavigation } from "./glass-docs-layout";

async function LineExample({ id }: { id: ComponentId }) {
  const bundle = (bundles as unknown as Record<ComponentId, ComponentBundle>)[id];
  async function codeBlock(code: string) {
    return highlight(code, {
      lang: "tsx",
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      components: {
        pre: ({ node: _node, ...props }) => (
          <CodeBlock
            title="example.tsx"
            className="line-code-block"
            viewportProps={{
              className: "line-code-viewport",
              "aria-label": `${bundle.title} code`,
            }}
          >
            <Pre {...props} />
          </CodeBlock>
        ),
      },
    });
  }
  const sourceCode = await codeBlock(bundle.files[`src/examples/${id}/example.tsx`]);
  const variantCode = bundle.variants
    ? Object.fromEntries(
        await Promise.all(
          Object.entries(bundle.variants).map(async ([value, variant]) => [
            value,
            await codeBlock(variant.source),
          ]),
        ),
      )
    : undefined;
  return (
    <ComponentPlayground
      key={id}
      bundle={bundle}
      sourceCode={sourceCode}
      variantCode={variantCode}
    />
  );
}
export function renderDoc(slug?: string[]) {
  const page = source.getPage(slug);
  if (!page) notFound();
  const Content = page.data.body;
  const key = slug?.join("/") || "index";
  return (
    <DocsPage
      toc={
        key.startsWith("components/")
          ? page.data.toc.filter((item) => item.depth === 2)
          : page.data.toc
      }
      tableOfContent={{ container: { className: "docs-visible-toc" } }}
    >
      <MobileDocsNavigation />
      <article id="docs-content" className="doc-article" data-doc={key} tabIndex={-1}>
        <header className="doc-heading">
          <div className="doc-title-row">
            <DocsTitle>{page.data.title}</DocsTitle>
            <CopyMarkdown path={publicPath(`/markdown/${key}.md`)} />
          </div>
          <DocsDescription>{page.data.description}</DocsDescription>
        </header>
        <DocsBody className="doc-body">
          <Content
            components={{
              ...defaultComponents,
              a: ({ href = "#", ...props }) => (
                <defaultComponents.a {...props} href={docRoute(href)} />
              ),
              LineExample,
              ChartExample: LineExample,
              AreaExample: LineExample,
              ApiTable,
            }}
          />
        </DocsBody>
        {!key.startsWith("components/") && (
          <footer className="doc-footer">
            <span>Kind UI charts</span>
            <Link href={docRoute("/docs/guides/release/")}>Package integration</Link>
          </footer>
        )}
      </article>
    </DocsPage>
  );
}
