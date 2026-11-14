import { createFromSource } from "fumadocs-core/search/server";
import { basePath, publicPath } from "@/lib/routing.mjs";
import { primitiveSource, source } from "@/lib/source";
export const dynamic = "force-static";
export const { staticGET: GET } = createFromSource(
  {
    ...source,
    getPages: () => [...source.getPages(), ...(!basePath ? primitiveSource.getPages() : [])],
  },
  {
    language: "english",
    async buildIndex(page) {
      const structuredData = page.data.structuredData;
      return {
        title: page.data.title,
        ...(page.data.description === undefined ? {} : { description: page.data.description }),
        id: publicPath(page.url),
        url: page.url,
        structuredData,
      };
    },
  },
);
