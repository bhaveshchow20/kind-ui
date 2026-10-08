export function normalizeBasePath(value = "") {
  if (value === "") return "";
  if (!/^\/(?:[A-Za-z0-9_-]+)(?:\/[A-Za-z0-9_-]+)*\/?$/.test(value))
    throw new Error("KIND_DOCS_BASE_PATH must be empty or an absolute path of plain URL segments");
  return value.replace(/\/$/, "");
}
export const basePath = normalizeBasePath(
  process.env.NEXT_PUBLIC_KIND_DOCS_BASE_PATH ?? process.env.KIND_DOCS_BASE_PATH ?? "",
);
export const docsBaseUrl = basePath ? "/" : "/docs";
export const legacyDocSlugs = [
  ...["installation", "quickstart"].map((page) => ["start", page]),
  ["guides", "customization"],
  ["guides", "identity-layout"],
  ["concepts", "composition"],
  ["guides", "release"],
];
export function canonicalDocSlugs(slug) {
  if (slug?.join("/") === "concepts/composition") return ["quickstart"];
  if (slug?.join("/") === "guides/release") return ["installation"];
  if (slug?.join("/") === "guides/customization") return ["components", "line"];
  if (slug?.join("/") === "guides/identity-layout") return ["concepts", "identity"];
  return slug?.length === 2 &&
    slug[0] === "start" &&
    ["installation", "quickstart"].includes(slug[1])
    ? [slug[1]]
    : slug;
}
/** Internal route for Next/Fumadocs links; Next adds its own basePath. */
export function docRoute(path = "/docs/") {
  if (
    basePath &&
    (path === basePath ||
      path.startsWith(`${basePath}/`) ||
      path.startsWith(`${basePath}?`) ||
      path.startsWith(`${basePath}#`))
  )
    path = path.slice(basePath.length) || "/";
  return basePath && /^\/docs(?=\/|$|[?#])/.test(path)
    ? path.replace(/^\/docs/, "").replace(/^([?#])/, "/$1") || "/"
    : path;
}
/** Public URL for fetch, plain anchors and generated agent/setup links. */
export function publicPath(path) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (
    basePath &&
    (path === basePath ||
      path.startsWith(`${basePath}/`) ||
      path.startsWith(`${basePath}?`) ||
      path.startsWith(`${basePath}#`))
  )
    return path;
  return `${basePath}${docRoute(path)}`;
}
export function docSlugs(slug) {
  return basePath ? slug : slug[0] === "docs" ? slug.slice(1) : null;
}
