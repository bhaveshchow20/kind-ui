import { highlight } from "fumadocs-core/highlight";
import { Callout } from "fumadocs-ui/components/callout";
import { Pre } from "fumadocs-ui/components/codeblock";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/glass/page";
import defaultComponents from "fumadocs-ui/mdx";
import Link from "next/link";
import { notFound } from "next/navigation";
import bundles from "@/generated/all-examples.json";
import usage from "@/generated/charts/usage.json";
import installations from "@/generated/registry-installations.json";
import { localExample } from "@/lib/registry-catalog.mjs";
import { docRoute, publicPath } from "@/lib/routing.mjs";
import { source } from "@/lib/source";
import { ApiTable } from "./api-table";
import {
  type ComponentBundle,
  type ComponentId,
  ComponentPlayground,
} from "./component-playground";
import { CopyMarkdown } from "./copy-markdown";
import { ChartInstallation } from "./distribution";
import { MobileDocsNavigation } from "./glass-docs-layout";
import { TrackedCodeBlock } from "./tracked-code-block";

async function LineExample({
  id,
  variant,
  instance,
}: {
  id: ComponentId;
  variant?: string;
  instance?: string;
}) {
  const bundle = (bundles as unknown as Record<ComponentId, ComponentBundle>)[id];
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
  const sourceCode = await codeBlock(
    localExample(bundle.files[`src/examples/${id}/example.tsx`], bundle.family, id),
  );
  const variantCode = bundle.variants
    ? Object.fromEntries(
        await Promise.all(
          Object.entries(bundle.variants).map(async ([value, variant]) => [
            value,
            await codeBlock(localExample(variant.source, bundle.family, id)),
          ]),
        ),
      )
    : undefined;
  return (
    <ComponentPlayground
      key={`${id}-${variant ?? "ready"}`}
      fixedVariant={variant}
      instance={instance}
      bundle={bundle}
      sourceCode={sourceCode}
      variantCode={variantCode}
    />
  );
}
async function Installation({ name }: { name: keyof typeof installations }) {
  const item = installations[name];
  const options = {
    lang: "tsx",
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false as const,
  };
  const sourceFiles = await Promise.all(
    item.files
      .filter((file) => /\.tsx?$/.test(file.target))
      .map(async (file) => (
        <ServerCodeBlock
          key={file.target}
          code={file.content}
          {...options}
          codeblock={{ title: file.target }}
        />
      )),
  );
  const example = (
    <ServerCodeBlock
      code={usage[item.meta.family as keyof typeof usage]}
      {...options}
      codeblock={{ title: "Dashboard.tsx" }}
    />
  );
  return <ChartInstallation item={item} sourceFiles={sourceFiles} example={example} />;
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
              ChartInstallation: Installation,
              LineExample,
              ChartExample: LineExample,
              AreaExample: LineExample,
              ApiTable,
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
            <Link href={docRoute("/docs/installation/#upgrading")}>Installation and upgrades</Link>
          </footer>
        )}
      </article>
    </DocsPage>
  );
}
