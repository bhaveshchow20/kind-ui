import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { canonicalDocURL, sitemapEntries } from "../../indexing.mjs";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(source.getPages().map((page) => canonicalDocURL(page.slugs)));
}
