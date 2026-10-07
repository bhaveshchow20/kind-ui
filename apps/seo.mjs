import { showcaseURL } from "./indexing.mjs";

export const homepageTitle = "Kind UI Charts — Composable React charts";
export const homepageDescription =
  "Explore composable React charts built on Recharts and Motion. Preview line, area, bar and more, customize examples, and use the documented public APIs.";

/** Use the existing square brand image, without depending on a preview hostname. */
export function socialMetadata(title, description, url) {
  const image = {
    url: `${showcaseURL}/cherry-blossom.png`,
    width: 512,
    height: 512,
    alt: "Kind UI Charts cherry blossom",
  };
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
    twitter: { card: "summary", title, description, images: [image] },
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
