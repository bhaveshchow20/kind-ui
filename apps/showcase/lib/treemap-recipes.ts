import type { SeriesConfig, TreemapDatum } from "@kind-ui/charts";
import type { Finish } from "./advanced-chart-recipes";
import type { DemoOptions } from "./demo-options";

export const treemapRecipes = [
  {
    id: "treemap-market",
    family: "Treemap",
    tag: "Monthly cloud spend",
    context:
      "Compute and data services account for most of this team's September bill. Select a family to inspect its services.",
    areaLabel: "September spend · USD",
    colorLabel: "Service family",
    summary: "$76.3k",
    summaryLabel: "10 services · September 2026",
  },
  {
    id: "treemap-exposure",
    family: "Treemap",
    tag: "Portfolio allocation",
    context:
      "See concentration across sectors and individual holdings. Values are an illustrative allocation, not live market prices.",
    areaLabel: "Position value · USD",
    colorLabel: "Sector",
    summary: "$197k",
    summaryLabel: "9 holdings · illustrative portfolio",
  },
] as const;
export type TreemapRecipe = (typeof treemapRecipes)[number];
const cloud: readonly TreemapDatum[] = [
  {
    id: "compute",
    label: "Compute",
    children: [
      { id: "api", label: "API", value: 18400 },
      { id: "workers", label: "Workers", value: 11800 },
      { id: "functions", label: "Functions", value: 4200 },
    ],
  },
  {
    id: "data",
    label: "Data",
    children: [
      { id: "postgresql", label: "PostgreSQL", value: 14600 },
      { id: "warehouse", label: "Warehouse", value: 8900 },
      { id: "cache", label: "Cache", value: 3100 },
    ],
  },
  {
    id: "storage",
    label: "Storage",
    children: [
      { id: "objects", label: "Objects", value: 5700 },
      { id: "backups", label: "Backups", value: 2200 },
    ],
  },
  {
    id: "network",
    label: "Network",
    children: [
      { id: "egress", label: "Egress", value: 4800 },
      { id: "cdn", label: "CDN", value: 2600 },
    ],
  },
];
const portfolio: readonly TreemapDatum[] = [
  {
    id: "technology",
    label: "Technology",
    children: [
      { id: "aapl", label: "AAPL", value: 42000 },
      { id: "msft", label: "MSFT", value: 36000 },
      { id: "nvda", label: "NVDA", value: 28000 },
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    children: [
      { id: "lly", label: "LLY", value: 22000 },
      { id: "unh", label: "UNH", value: 14000 },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    children: [
      { id: "jpm", label: "JPM", value: 18000 },
      { id: "v", label: "V", value: 15000 },
    ],
  },
  {
    id: "energy",
    label: "Energy",
    children: [
      { id: "xom", label: "XOM", value: 13000 },
      { id: "cvx", label: "CVX", value: 9000 },
    ],
  },
];
export function treemapData(id: string): readonly TreemapDatum[] {
  if (id === "treemap-market") return cloud;
  if (id === "treemap-exposure") return portfolio;
  throw new Error(`Unknown treemap example: ${id}`);
}
export const treemapArea = (_id: string, value: number) =>
  `$${(value / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`;
export function treemapConfig(
  data: readonly TreemapDatum[],
  colors: readonly string[],
): SeriesConfig {
  return Object.fromEntries(
    data.map((node, index) => [
      node.id,
      {
        label: node.label,
        color: colors[index % colors.length] ?? `var(--chart-${index + 1})`,
      },
    ]),
  );
}
export function treemapRows(
  data: readonly TreemapDatum[],
  parent = "",
): { id: string; path: string; value: number }[] {
  return data.flatMap((node) => {
    const path = parent ? `${parent} / ${node.label}` : node.label;
    return node.children
      ? treemapRows(node.children, path)
      : [{ id: node.id, path, value: node.value }];
  });
}
export function treemapCode(
  recipe: TreemapRecipe,
  material: Finish,
  colors: readonly string[],
  animate: boolean,
  options: DemoOptions = {},
): string {
  const finish =
    material === "clay"
      ? ', boxShadow: "inset 0 1px 0 #ffffff60, inset 0 -2px 3px #00000012"'
      : material === "glow"
        ? ', boxShadow: "inset 0 0 0 1px #ffffff40"'
        : "";
  return `"use client";
import { TreemapChart, type TreemapDatum } from "@kind-ui/charts";

// ${recipe.areaLabel}. Synthetic example; areas and shares use supplied positive values.
const data: readonly TreemapDatum[] = ${JSON.stringify(treemapData(recipe.id), null, 2)};
const config = ${JSON.stringify(treemapConfig(treemapData(recipe.id), colors), null, 2)};
const formatValue = (value: number) => "$" + (value / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "k";
export function Example() {
  return <TreemapChart data={data} config={config} aria-label="${recipe.tag}" height={260} padding={${options.gap ?? 3}} groupHeaderHeight={24} animate={${animate}} formatValue={formatValue}
    interaction={{ kind: "category", mode: "focus", eligibleKeys: data.map(node => node.id), markActivation: "matching-legend" }}>
    <TreemapChart.Groups />
    <TreemapChart.Tiles tileProps={() => ({ style: { borderRadius: ${options.radius ?? 4}${finish} } })} />
    ${options.showLabels === false ? "" : `<TreemapChart.Labels minWidth={40} padding={7}>{node => <><span className="block truncate">{node.label}</span>${options.showValues === false ? "" : '<span className="block mt-1 tabular-nums font-normal">{node.height >= 48 ? formatValue(node.value) : null}</span>'}</>}</TreemapChart.Labels>`}
    <TreemapChart.Tooltip valueAnimation="shuffle" />
    ${options.showLegend === false ? "" : "<TreemapChart.Legend />"}
    <TreemapChart.Breadcrumbs rootLabel="All ${recipe.id === "treemap-market" ? "services" : "holdings"}" />
  </TreemapChart>;
}
`;
}
export function treemapPrompt(
  recipe: TreemapRecipe,
  material: Finish,
  colors: readonly string[],
  animate: boolean,
  options: DemoOptions = {},
): string {
  return `Build this ${recipe.tag.toLowerCase()} with the compound TreemapChart API. Keep stable IDs, supplied values and hierarchy. Use shared Legend and Tooltip, direct labels, and explicit group navigation. Legend focus must preserve geometry and values. Provide a screen-reader data table in the host application. Reference: https://kindui.dev/charts/docs/components/treemap/.\n\n${treemapCode(recipe, material, colors, animate, options)}`;
}
