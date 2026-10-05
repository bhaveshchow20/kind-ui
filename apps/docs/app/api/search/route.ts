import { createFromSource } from "fumadocs-core/search/server";
import { publicPath } from "@/lib/routing.mjs";
import { source } from "@/lib/source";
export const dynamic = "force-static";
export const { staticGET: GET } = createFromSource(source, {
  language: "english",
  async buildIndex(page) {
    const structuredData = page.data.structuredData;
    return {
      title: page.data.title,
      description: page.data.description,
      id: publicPath(page.url),
      url: page.url,
      structuredData,
    };
  },
});
