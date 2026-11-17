import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_DOCS_BASE_PATH ?? "",
  // Writes `docs/components/line/index.html`, not `docs/components/line.html`, so a plain static host serves each page at
  // the path it was rendered for; otherwise the client's pathname matches no page and hydration fails.
  trailingSlash: true,
  reactStrictMode: true,
};

export default withMDX(config);
