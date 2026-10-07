import { notFound } from "next/navigation";
import { renderDoc } from "@/components/doc-page";
import { basePath, canonicalDocSlugs, docSlugs, legacyDocSlugs } from "@/lib/routing.mjs";
import { source } from "@/lib/source";
import { canonicalDocURL } from "../../../indexing.mjs";
export function generateStaticParams() {
  return [...source.generateParams(), ...legacyDocSlugs.map((slug) => ({ slug }))]
    .map(({ slug = [] }) => ({
      slug: basePath ? slug : ["docs", ...slug],
    }))
    .filter(({ slug }) => slug.length > 0);
}
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const slug = canonicalDocSlugs(docSlugs((await params).slug));
  const page = slug ? source.getPage(slug) : undefined;
  return {
    title: page?.data.title,
    alternates: page ? { canonical: canonicalDocURL(slug ?? []) } : undefined,
  };
}
export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const slug = canonicalDocSlugs(docSlugs((await params).slug));
  if (!slug) notFound();
  return renderDoc(slug);
}
