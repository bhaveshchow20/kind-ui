import type { NextConfig } from "next";
import { domainRootRewrites } from "./scripts/domain-root.mjs";

const basePath = process.env.NEXT_PUBLIC_SHOWCASE_BASE_PATH ?? "";
const domainRoot = process.env.KIND_UI_DOMAIN_ROOT === "1";
if (domainRoot && basePath !== "/charts") {
  throw new Error("The domain-root host requires NEXT_PUBLIC_SHOWCASE_BASE_PATH=/charts");
}
if (basePath !== "" && basePath !== "/charts") {
  throw new Error("NEXT_PUBLIC_SHOWCASE_BASE_PATH must be empty or /charts");
}
const docsURL = process.env.NEXT_PUBLIC_DOCS_URL;
if (
  docsURL &&
  docsURL !== "/charts/docs" &&
  docsURL !== "/charts/docs/" &&
  !docsURL.startsWith("https://")
) {
  throw new Error("NEXT_PUBLIC_DOCS_URL must be /charts/docs/ or an HTTPS destination");
}
const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: domainRoot ? "" : basePath,
  ...(domainRoot ? { assetPrefix: "/charts", skipTrailingSlashRedirect: true } : {}),
  async rewrites() {
    return domainRoot
      ? { beforeFiles: [], afterFiles: domainRootRewrites(`${process.cwd()}/public`), fallback: [] }
      : [];
  },
  async redirects() {
    const home = basePath
      ? [{ source: "/", destination: basePath, permanent: false, basePath: false as const }]
      : [];
    return [
      ...home,
      ...(domainRoot
        ? [
            { source: "/charts/", destination: "/charts", permanent: true },
            ...["/r", "/r/"].map((source) => ({
              source,
              destination: "/r/registry.json",
              permanent: false,
            })),
          ]
        : []),
      // Keep one generated reference in Docs, discoverable from the domain root.
      ...["llms.txt", "llms-full.txt"].flatMap((file) => [
        {
          source: `/${file}`,
          destination: `https://kindui.dev/charts/docs/${file}`,
          permanent: true,
          basePath: false as const,
        },
        ...(basePath
          ? [
              {
                source: `${basePath}/${file}`,
                destination: `https://kindui.dev/charts/docs/${file}`,
                permanent: true,
                basePath: false as const,
              },
            ]
          : []),
      ]),
    ];
  },
};
export default nextConfig;
