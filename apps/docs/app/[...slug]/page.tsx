import { notFound } from "next/navigation";
import { renderDoc } from "@/components/doc-page";
import { LegacyDocRedirect } from "@/components/legacy-doc-redirect";
import { renderPrimitive } from "@/components/primitive-page";
import { docMetadata } from "@/lib/metadata";
import { isPrimitiveId, primitivePages } from "@/lib/primitives/catalog";
import { basePath, canonicalDocSlugs, docSlugs, legacyDocSlugs } from "@/lib/routing.mjs";
import { primitiveSource, source } from "@/lib/source";
export function generateStaticParams() {
  const chartParams = [...source.generateParams(), ...legacyDocSlugs.map((slug) => ({ slug }))]
    .map(({ slug = [] }) => ({
      slug: basePath ? slug : ["docs", ...slug],
    }))
    .filter(({ slug }) => slug.length > 0);
  // The existing /charts/docs export remains a chart-only mount. Primitives
  // belong to the root-mounted app at /components, never that chart prefix.
  return [
    ...chartParams,
    ...(!basePath ? primitivePages.map(({ id }) => ({ slug: ["components", id] })) : []),
  ];
}
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const requested = (await params).slug;
  if (
    !basePath &&
    requested.length === 2 &&
    requested[0] === "components" &&
    requested[1] &&
    isPrimitiveId(requested[1])
  ) {
    const page = primitiveSource.getPage([requested[1]]);
    return {
      title: { absolute: `${page?.data.title} · Kind UI` },
      description: page?.data.description,
    };
  }
  const slug = canonicalDocSlugs(docSlugs((await params).slug));
  return slug ? docMetadata(slug) : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const route = (await params).slug;
  if (!basePath && route.length === 2 && route[0] === "components" && route[1])
    return renderPrimitive(route[1]);
  const slug = canonicalDocSlugs(docSlugs((await params).slug));
  if (!slug) notFound();
  const requested = docSlugs((await params).slug);
  if (
    requested &&
    [
      "quickstart",
      "start/quickstart",
      "guides/customization",
      "guides/identity-layout",
      "concepts/composition",
      "guides/release",
    ].includes(requested.join("/"))
  )
    return (
      <>
        <LegacyDocRedirect guide={requested.at(-1) ?? requested.join("/")} />
        {renderDoc(slug)}
      </>
    );
  return renderDoc(slug);
}
