export const githubRepository = "bhaveshchow20/kind-ui";
export const httpBase = `https://raw.githubusercontent.com/${githubRepository}/main/apps/docs/public/r`;
const dependencies = [
  "@kind-ui/charts@^0.1.0",
  "react@^19.3.0",
  "react-dom@^19.3.0",
  "recharts@^3.10.1",
  "motion@^13.4.6",
];
const file = (name, type = "registry:component") => ({
  path: `registry/charts/${name}`,
  type,
  target: `@components/charts/${name}`,
});
export const catalog = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "kindui",
  homepage: `https://github.com/${githubRepository}`,
  items: [
    {
      name: "kind-chart-styles",
      type: "registry:style",
      title: "Kind chart styling",
      description:
        "Editable scoped palettes, typography, framing, responsive layout and table styling for Kind chart recipes.",
      files: [file("kind-chart.css", "registry:file")],
    },
    ...[
      [
        "line",
        "Revenue momentum",
        "Compare two revenue trends with editable line styling, package-owned inspection and series visibility, and a native data table.",
      ],
      [
        "area",
        "Audience growth",
        "Compare audience growth with soft area fills, package-owned inspection and series visibility, and a native data table.",
      ],
      [
        "bar",
        "Orders by channel",
        "Compare direct and partner orders with grouped bars, package-owned inspection and series visibility, and a native data table.",
      ],
    ].map(([family, title, description]) => ({
      name: `${family}-chart`,
      type: "registry:component",
      title,
      description,
      dependencies,
      registryDependencies: ["card", `${githubRepository}/kind-chart-styles`],
      files: [file(`${family}-chart.tsx`)],
    })),
  ],
};
