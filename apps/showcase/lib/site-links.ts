// Current, source-verified preview destinations. Change this one configuration
// only after a future domain/path-prefix deployment has been verified.
export const showcaseBasePath = process.env.NEXT_PUBLIC_SHOWCASE_BASE_PATH ?? "";
export const showcaseAsset = (path: string) => `${showcaseBasePath}${path}`;
const docsDestination = process.env.NEXT_PUBLIC_DOCS_URL ?? "https://kindui.dev/charts/docs/";

export const siteLinks = {
  home: showcaseBasePath || "/",
  docs: `${docsDestination.replace(/\/$/, "")}/`,
  repository: "https://github.com/bhaveshchow20/kind-ui",
  creator: "https://x.com/BhaveshChow",
};

export const docsAccessNote = "Explore chart examples and API references.";

// Names such as Donut and Gauge share their documented family page.
export const documentationCharts = [
  ["Line", "line"],
  ["Area", "area"],
  ["Bar", "bar"],
  ["Combo", "combo"],
  ["Pie", "pie"],
  ["Donut", "pie"],
  ["Radar", "radar"],
  ["Radial Bar", "radial"],
  ["Gauge", "radial"],
  ["Scatter", "scatter"],
  ["Bubble", "scatter"],
  ["Heatmap", "heatmap"],
  ["Waterfall", "waterfall"],
  ["Sankey", "sankey"],
  ["Histogram", "histogram"],
  ["Box Plot", "box-plot"],
].map(([name, slug]) => ({ name, href: `${siteLinks.docs}components/${slug}/` }));

const chartGuides = documentationCharts
  .filter((chart, index, charts) => charts.findIndex(({ href }) => href === chart.href) === index)
  .map(({ name, href }) => ({ name: `${name} charts`, href }));

export const footerLinkGroups = [
  { title: "Charts", links: chartGuides.slice(0, 7) },
  { title: "More charts", links: chartGuides.slice(7) },
  {
    title: "Guides",
    links: [
      { name: "Docs", href: siteLinks.docs },
      { name: "Installation", href: `${siteLinks.docs}installation/` },
      { name: "Identity and colors", href: `${siteLinks.docs}concepts/identity/` },
      { name: "Materials", href: `${siteLinks.docs}guides/materials/` },
      { name: "Motion", href: `${siteLinks.docs}guides/motion/` },
      { name: "Accessibility", href: `${siteLinks.docs}guides/accessibility/` },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "GitHub", href: siteLinks.repository },
      { name: "npm package", href: "https://www.npmjs.com/package/@kind-ui/charts" },
      { name: "AI agents", href: `${siteLinks.docs}agents/consumer/` },
      { name: "llms.txt", href: `${siteLinks.docs}llms.txt` },
      { name: "MIT license", href: `${siteLinks.repository}/blob/main/LICENSE` },
    ],
  },
];
