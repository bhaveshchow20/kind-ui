/** Deployment intent, rather than NODE_ENV (which also equals production in previews). */
export function isIndexable(env = process.env) {
  const deployment = env.KIND_UI_DEPLOYMENT_ENV ?? env.VERCEL_ENV ?? "preview";
  if (!["production", "preview", "development"].includes(deployment))
    throw new Error("KIND_UI_DEPLOYMENT_ENV must be production, preview or development");
  return deployment === "production" && (!env.VERCEL_ENV || env.VERCEL_ENV === "production");
}
export const siteOrigin = "https://kindui.dev";
export const showcaseURL = `${siteOrigin}/charts/`;
export const docsURL = `${showcaseURL}docs/`;
export function indexingMetadata(env = process.env) {
  const index = isIndexable(env);
  return { metadataBase: new URL(siteOrigin), robots: { index, follow: index } };
}
export function robotsPolicy(env = process.env) {
  return isIndexable(env)
    ? {
        rules: { userAgent: "*", allow: "/" },
        sitemap: [`${showcaseURL}sitemap.xml`, `${docsURL}sitemap.xml`],
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
/** Canonical URLs stay on the public domain even when building an unprefixed preview. */
export function canonicalDocURL(slugs = []) {
  return `${docsURL}${slugs.length ? `${slugs.map(encodeURIComponent).join("/")}/` : ""}`;
}
export function sitemapEntries(urls, env = process.env) {
  return isIndexable(env) ? [...new Set(urls)].map((url) => ({ url })) : [];
}
