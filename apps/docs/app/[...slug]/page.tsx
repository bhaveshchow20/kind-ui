import { notFound } from "next/navigation";
import { renderDoc } from "@/components/doc-page";
import { LegacyDocRedirect } from "@/components/legacy-doc-redirect";
import { docMetadata } from "@/lib/metadata";
import { basePath, canonicalDocSlugs, docSlugs, legacyDocSlugs } from "@/lib/routing.mjs";
import { source } from "@/lib/source";
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
  return slug ? docMetadata(slug) : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const slug = canonicalDocSlugs(docSlugs((await params).slug));
  if (!slug) notFound();
  const requested = docSlugs((await params).slug);
  if (
    requested &&
    [
      "guides/customization",
      "guides/identity-layout",
      "concepts/composition",
      "guides/release",
    ].includes(requested.join("/"))
  )
    return (
      <>
        <LegacyDocRedirect guide={requested[1]} />
        {renderDoc(slug)}
      </>
    );
  return renderDoc(slug);
}
