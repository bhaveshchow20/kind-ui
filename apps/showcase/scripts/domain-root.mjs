import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/** @param {string} publicDirectory */
export function domainRootRewrites(publicDirectory) {
  const docsDirectory = path.join(publicDirectory, "charts/docs");
  if (
    !existsSync(path.join(docsDirectory, "index.html")) ||
    !existsSync(path.join(publicDirectory, "r/registry.json"))
  ) {
    throw new Error(
      "Prepare the production Docs export and registry assets before building the domain-root host",
    );
  }
  const pages = readdirSync(docsDirectory, { recursive: true })
    .map(String)
    .filter((file) => file === "index.html" || file.endsWith("/index.html"))
    .sort();
  const docs = pages.flatMap((file) => {
    const route = `/charts/docs/${file.replace(/index\.html$/, "")}`;
    const destination = `/charts/docs/${file}`;
    return [
      { source: route.replace(/\/$/, ""), destination },
      { source: route, destination },
    ];
  });
  const assets = readdirSync(publicDirectory, { recursive: true, withFileTypes: true })
    .filter((file) => file.isFile())
    .map((file) => path.relative(publicDirectory, path.join(file.parentPath, file.name)))
    .filter((file) => !file.startsWith("charts/") && !file.startsWith("r/"))
    .map((file) => ({ source: `/charts/${file}`, destination: `/${file}` }));
  return [
    ...docs,
    ...assets,
    { source: "/charts", destination: "/" },
    { source: "/charts/_next/:path*", destination: "/_next/:path*" },
    ...["robots.txt", "sitemap.xml"].map((file) => ({
      source: `/charts/${file}`,
      destination: `/${file}`,
    })),
  ];
}
