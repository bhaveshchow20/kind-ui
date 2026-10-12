import { highlight } from "fumadocs-core/highlight";
import { Callout } from "fumadocs-ui/components/callout";
import { Pre } from "fumadocs-ui/components/codeblock";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/glass/page";
import defaultComponents from "fumadocs-ui/mdx";
import Link from "next/link";
import { notFound } from "next/navigation";
import bundles from "@/generated/all-examples.json";
import { componentBundleFor, componentBundlesSchema } from "@/lib/component-bundles.server.mjs";
import { docRoute, publicPath } from "@/lib/routing.mjs";
import { source } from "@/lib/source";
import { ApiTable } from "./api-table";
import { ChartInstallation } from "./chart-installation";
import { type ComponentId, ComponentPlayground } from "./component-playground";
import { CopyMarkdown } from "./copy-markdown";
import { MobileDocsNavigation } from "./glass-docs-layout";
import { TrackedCodeBlock } from "./tracked-code-block";

const validatedBundles = componentBundlesSchema.parse(bundles);

async function LineExample({
  id,
  variant,
  instance,
}: {
  id: ComponentId;
  variant?: string;
  instance?: string;
}) {
  const bundle = componentBundleFor(validatedBundles, id);
  async function codeBlock(code: string) {
    return highlight(code, {
      lang: "tsx",
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      components: {
        pre: ({ node: _node, ...props }) => (
          <TrackedCodeBlock
            title="example.tsx"
            className="line-code-block"
            viewportProps={{
              className: "line-code-viewport",
              "aria-label": `${bundle.title} code`,
            }}
          >
            <Pre {...props} />
          </TrackedCodeBlock>
        ),
      },
    });
  }
  const example = bundle.files[`src/examples/${id}/example.tsx`];
  if (example === undefined) throw new Error(`Missing example source: ${id}`);
  const sourceCode = await codeBlock(example);
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
      key={`${id}-${variant ?? "ready"}`}
      {...(variant === undefined ? {} : { fixedVariant: variant })}
      {...(instance === undefined ? {} : { instance })}
      bundle={bundle}
      sourceCode={sourceCode}
      {...(variantCode === undefined ? {} : { variantCode })}
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
              ChartInstallation,
              Callout,
              Steps,
              Step,
              Tabs,
              Tab,
            }}
          />
        </DocsBody>
        {!key.startsWith("components/") && (
          <footer className="doc-footer">
            <span>Kind UI charts</span>
            <Link href={docRoute("/docs/installation/")}>Installation</Link>
          </footer>
        )}
      </article>
    </DocsPage>
  );
}
