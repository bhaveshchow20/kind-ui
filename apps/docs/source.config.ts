import { defineConfig, defineDocs } from "fumadocs-mdx/config";
export const docs = defineDocs({ dir: "content/docs" });
export const primitives = defineDocs({ dir: "content/primitives" });
export default defineConfig();
