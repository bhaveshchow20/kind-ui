import type { Metadata } from "next";
import { canonicalDocURL, docsURL } from "../../indexing.mjs";
import { socialMetadata } from "../../seo.mjs";
import { source } from "./source";

export function docMetadata(slugs: string[] = []): Metadata {
  const page = source.getPage(slugs);
  if (!page) return {};
  const { title, description } = page.data;
  const fullTitle = `${title} · Kind UI charts`;
  const canonical = canonicalDocURL(slugs);
  return {
    title: { absolute: fullTitle },
    description,
    alternates: {
      canonical,
      types: {
        "text/markdown": `${docsURL}markdown/${slugs.length ? slugs.map(encodeURIComponent).join("/") : "index"}.md`,
      },
    },
    ...socialMetadata(fullTitle, description, canonical),
  };
}
