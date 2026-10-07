import { renderDoc } from "@/components/doc-page";
import { docMetadata } from "@/lib/metadata";
export function generateMetadata() {
  return docMetadata();
}
export default function Page() {
  return renderDoc();
}
