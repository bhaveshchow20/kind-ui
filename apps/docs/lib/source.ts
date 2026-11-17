import { dirname } from "node:path/posix";
import { llms, loader } from "fumadocs-core/source";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";
import { basePath, docsRoute, origin } from "./shared";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [],
});

// Processed Markdown keeps authored links like `../guides/motion.mdx`; point them at that page's Markdown file.
const resolveMarkdownLinks = (markdown: string, page: (typeof source)["$inferPage"]) =>
  markdown.replace(/\]\((\.{1,2}\/[^)\s]+?\.mdx(?:#[^)\s]*)?)\)/g, (link, href: string) => {
    const target = source.getPageByHref(href, { dir: dirname(page.path) });
    if (!target) return link;
    const hash = target.hash ? `#${target.hash}` : "";
    return `](${origin}${basePath}/llms.mdx${target.page.url}.md${hash})`;
  });

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${resolveMarkdownLinks(await page.data.getText("processed"), page)}`,
  // A static build has no `Accept` negotiation, so Markdown lives under `/llms.mdx`.
  renderUrl: (item) =>
    `${origin}${basePath}${/^\/.*\.(md|txt)$/.test(item.url) ? `/llms.mdx${item.url}` : item.url}`,
});
