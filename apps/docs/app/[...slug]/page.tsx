import { notFound } from "next/navigation";
import { renderDoc } from "@/components/doc-page";
import { basePath, docSlugs } from "@/lib/routing.mjs";
import { source } from "@/lib/source";
export function generateStaticParams() {
  return source
    .generateParams()
    .map(({ slug = [] }) => ({
      slug: basePath ? slug : ["docs", ...slug],
    }))
    .filter(({ slug }) => slug.length > 0);
}
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const slug = docSlugs((await params).slug);
  return { title: slug ? source.getPage(slug)?.data.title : undefined };
}
export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const slug = docSlugs((await params).slug);
  if (!slug) notFound();
  return renderDoc(slug);
}
