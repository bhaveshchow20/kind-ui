import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_SHOWCASE_BASE_PATH ?? "";
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
  basePath,
  async redirects() {
    const home = basePath
      ? [{ source: "/", destination: basePath, permanent: false, basePath: false as const }]
      : [];
    return [
      ...home,
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
