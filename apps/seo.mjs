import { docsURL, showcaseURL } from "./indexing.mjs";

export const homepageTitle = "Kind UI Charts — Composable React charts";
export const homepageDescription =
  "Explore composable React charts built on Recharts and Motion. Preview line, area, bar and more, customize examples, and use the documented public APIs.";

export const socialImages = {
  homepage: {
    url: `${showcaseURL}/social/homepage-v1.png`,
    width: 1200,
    height: 630,
    alt: "Kind UI Charts: Interactive React charts, with bar, area and donut chart illustrations over light clouds",
  },
  documentation: {
    url: `${docsURL}social/documentation-v1.png`,
    width: 1200,
    height: 630,
    alt: "Kind UI Charts documentation: A line chart and composable React code example over dark clouds",
  },
};

/** Public static images work for social crawlers without executing JavaScript. */
export function socialMetadata(title, description, url, image = socialImages.homepage) {
  return {
    openGraph: {
      type: "website",
      siteName: "Kind UI Charts",
      locale: "en_US",
      title,
      description,
      url,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** Project facts also exposed by the homepage's install, GitHub and license links. */
export const chartSourceData = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: "@kind-ui/charts",
  description: "Composable React chart components built on Recharts and Motion.",
  url: showcaseURL,
  codeRepository: "https://github.com/bhaveshchow20/kind-ui",
  license: "https://github.com/bhaveshchow20/kind-ui/blob/main/LICENSE",
  programmingLanguage: "TypeScript",
};
