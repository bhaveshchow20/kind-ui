import { renderDoc } from "@/components/doc-page";
import { docsURL } from "../../indexing.mjs";
export const metadata = { title: "Introduction", alternates: { canonical: docsURL } };
export default function Page() {
  return renderDoc();
}
