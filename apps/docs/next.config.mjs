import { createMDX } from "fumadocs-mdx/next";

import { basePath } from "./lib/routing.mjs";

const withMDX = createMDX();
export default withMDX({
  basePath,
  env: { NEXT_PUBLIC_KIND_DOCS_BASE_PATH: basePath },
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
});
