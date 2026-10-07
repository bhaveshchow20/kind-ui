import type { MetadataRoute } from "next";
import { robotsPolicy } from "../../indexing.mjs";
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return robotsPolicy();
}
