import { readFile } from "node:fs/promises";
import path from "node:path";
import { highlight } from "fumadocs-core/highlight";
import { Pre } from "fumadocs-ui/components/codeblock";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/glass/page";
import defaultComponents from "fumadocs-ui/mdx";
import { notFound } from "next/navigation";
import { isPrimitiveId, type PrimitiveId, primitivePages } from "@/lib/primitives/catalog";
import { primitiveSource } from "@/lib/source";
import { ApiTable } from "./api-table";
import { MobileDocsNavigation } from "./glass-docs-layout";
import { PrimitivePlayground } from "./previews/primitives";
import { TrackedCodeBlock } from "./tracked-code-block";

async function PrimitiveExample({ id }: { id: PrimitiveId }) {
  if (!isPrimitiveId(id)) throw new Error(`Unknown primitive example: ${id}`);
  const title = primitivePages.find((page) => page.id === id)?.title ?? id;
  // Read the same standalone module dynamically imported by the live preview.
  const source = await readFile(
    path.join(process.cwd(), "examples/primitives", `${id}.tsx`),
    "utf8",
  );
  const code = await highlight(source, {
    lang: "tsx",
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
    components: {
      pre: ({ node: _node, ...props }) => (
        <TrackedCodeBlock
          title="example.tsx"
          className="line-code-block"
          viewportProps={{ className: "line-code-viewport", "aria-label": `${title} code` }}
        >
          <Pre {...props} />
        </TrackedCodeBlock>
      ),
    },
  });
  return <PrimitivePlayground id={id} title={title} code={code} />;
}

export function renderPrimitive(id: string) {
  if (!isPrimitiveId(id)) notFound();
  const page = primitiveSource.getPage([id]);
  if (!page) notFound();
  const Content = page.data.body;
  return (
    <DocsPage toc={page.data.toc} tableOfContent={{ container: { className: "docs-visible-toc" } }}>
      <MobileDocsNavigation />
      <article
        id="docs-content"
        className="doc-article"
        data-doc={`primitives/${id}`}
        tabIndex={-1}
      >
        <header className="doc-heading">
          <DocsTitle>{page.data.title}</DocsTitle>
          <DocsDescription>{page.data.description}</DocsDescription>
        </header>
        <DocsBody className="doc-body">
          <Content components={{ ...defaultComponents, PrimitiveExample, ApiTable }} />
        </DocsBody>
      </article>
    </DocsPage>
  );
}
