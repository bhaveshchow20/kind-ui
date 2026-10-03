import { renderDoc } from "@/components/doc-page";
import { source } from "@/lib/source";
export function generateStaticParams() {
  return source.generateParams();
}
export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return { title: source.getPage(slug)?.data.title };
}
export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  return renderDoc((await params).slug);
}
