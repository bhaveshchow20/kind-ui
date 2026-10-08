import { isIndexable } from "./indexing.mjs";

/** Public site token from Cloudflare Web Analytics; not an API credential. */
export function webAnalytics(env = process.env) {
  const token = env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN ?? "26b67545bef54a4c95fd5085629a19ad";
  if (!isIndexable(env) || !token) return null;
  if (!/^[a-f0-9]{32}$/.test(token)) throw new Error("Invalid Cloudflare Web Analytics token");
  return {
    src: "https://static.cloudflareinsights.com/beacon.min.js",
    beacon: JSON.stringify({ token }),
  };
}
