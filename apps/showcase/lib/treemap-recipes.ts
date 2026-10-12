import type { TreemapAccessors, TreemapColorEncoding } from "@kind-ui/charts";
import type { Finish } from "./advanced-chart-recipes";
import type { DemoOptions } from "./demo-options";

export const treemapRecipes = [
  {
    id: "treemap-market",
    family: "Treemap",
    tag: "Sector concentration",
    context:
      "Illustrative companies, October 12. Area shows full company value in USD billions; color shows one-day return. Shares refer to this sample.",
    areaLabel: "Company value · USD bn",
    colorLabel: "One-day return",
    summary: "$1.56T",
    summaryLabel: "sample company value",
  },
  {
    id: "treemap-exposure",
    family: "Treemap",
    tag: "Gross position exposure",
    context:
      "Illustrative positions, October 12. Area uses supplied positive gross values; signed long/short positions and one-day P&L remain separate. $320k gross, $60k net; shares are not percentage of NAV.",
    areaLabel: "Gross position value · USD",
    colorLabel: "One-day P&L · USD",
    summary: "$320k",
    summaryLabel: "$60k net · $190k long / $130k short",
  },
] as const;
export type TreemapRecipe = (typeof treemapRecipes)[number];
export type TreemapRecord = {
  id: string;
  label: string;
  area?: number;
  metric?: number | null;
  signedPosition?: number;
  children?: readonly TreemapRecord[];
};

const market: readonly TreemapRecord[] = [
  {
    id: "technology",
    label: "Technology",
    children: [
      { id: "redwood", label: "Redwood", area: 290, metric: 2.1 },
      { id: "orbit", label: "Orbit", area: 235, metric: -1.2 },
      { id: "cedar", label: "Cedar", area: 180, metric: 0.6 },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    children: [
      { id: "harbor", label: "Harbor", area: 210, metric: -0.8 },
      { id: "bridge", label: "Bridge", area: 150, metric: 1.4 },
    ],
  },
  {
    id: "health",
    label: "Health",
    children: [
      { id: "sage", label: "Sage", area: 190, metric: 1.7 },
      { id: "nova", label: "Nova", area: 125, metric: -2.4 },
    ],
  },
  {
    id: "energy",
    label: "Energy",
    children: [
      { id: "summit", label: "Summit", area: 115, metric: -0.3 },
      { id: "current", label: "Current", area: 65, metric: null },
    ],
  },
];
const exposure: readonly TreemapRecord[] = [
  {
    id: "long",
    label: "Long · $190k",
    children: [
      { id: "atlas-long", label: "Atlas", area: 90000, signedPosition: 90000, metric: 1350 },
      { id: "harbor-long", label: "Harbor", area: 65000, signedPosition: 65000, metric: -780 },
      { id: "sage-long", label: "Sage", area: 35000, signedPosition: 35000, metric: 420 },
    ],
  },
  {
    id: "short",
    label: "Short · $130k",
    children: [
      { id: "orbit-short", label: "Orbit", area: 70000, signedPosition: -70000, metric: 1120 },
      { id: "nova-short", label: "Nova", area: 40000, signedPosition: -40000, metric: -920 },
      { id: "summit-short", label: "Summit", area: 20000, signedPosition: -20000, metric: null },
    ],
  },
];
export const treemapAccessors: TreemapAccessors<TreemapRecord> = {
  id: (datum) => datum.id,
  label: (datum) => datum.label,
  children: (datum) => datum.children,
  value: (datum) => {
    if (datum.area === undefined) throw new Error(`Missing supplied area for ${datum.id}`);
    return datum.area;
  },
};
export function treemapData(id: string): readonly TreemapRecord[] {
  if (id === "treemap-market") return market;
  if (id === "treemap-exposure") return exposure;
  throw new Error(`Unknown treemap example: ${id}`);
}
export const treemapCandidateNote =
  "Treemap uses the reviewed candidate API; published @kind-ui/charts 0.5.0 does not include it. Use a validated candidate package until a release includes TreemapChart.";
export function treemapMetric(id: string, value: number | null | undefined): string {
  if (value === null || value === undefined) return "Unknown";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return id === "treemap-market"
    ? `${sign}${Math.abs(value).toFixed(1)}%`
    : `${sign}$${Math.abs(value).toLocaleString("en-US")}`;
}
export function treemapArea(id: string, value: number): string {
  return id === "treemap-market"
    ? `$${value.toLocaleString("en-US")}bn`
    : `$${(value / 1000).toLocaleString("en-US")}k`;
}
export function treemapEncoding(
  recipe: TreemapRecipe,
  colors: readonly string[],
): TreemapColorEncoding<TreemapRecord> {
  return {
    type: "diverging",
    label: recipe.colorLabel,
    value: (datum) => datum.metric,
    domain: recipe.id === "treemap-market" ? [-3, 3] : [-2000, 2000],
    stops: [
      { offset: 0, color: colors[2] ?? "#ee668b" },
      { offset: 0.5, color: "var(--muted, #e5e7eb)" },
      { offset: 1, color: colors[0] ?? "#20b898" },
    ],
    unknownColor: "var(--border, #d1d5db)",
    unknownLabel: "Unknown / unaggregated",
    formatValue: (value) => treemapMetric(recipe.id, value),
  };
}
export function treemapCode(
  recipe: TreemapRecipe,
  material: Finish,
  colors: readonly string[],
  animate: boolean,
  options: DemoOptions = {},
): string {
  const holdings = recipe.id === "treemap-exposure";
  const finish =
    material === "clay"
      ? ',boxShadow:"inset 0 1px 0 #ffffff60, inset 0 -2px 3px #00000012"'
      : material === "glow"
        ? ',boxShadow:"inset 0 0 0 1px #ffffff40"'
        : "";
  return `"use client";

import { TreemapChart, type TreemapAccessors, type TreemapColorEncoding } from "@kind-ui/charts";
import { useState } from "react";

// ${treemapCandidateNote}
// ${recipe.context}
type Row = { id: string; label: string; area?: number; metric?: number | null; signedPosition?: number; children?: readonly Row[] };
const data: readonly Row[] = ${JSON.stringify(treemapData(recipe.id), null, 2)};
const colors = ${JSON.stringify(colors)};
const accessors: TreemapAccessors<Row> = {
  id: row => row.id, label: row => row.label, children: row => row.children,
  value: row => { if (row.area === undefined) throw new Error("Missing supplied area for " + row.id); return row.area; },
};
const metric = (value: number | null | undefined) => {
  if (value == null) return "Unknown";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return ${holdings ? 'sign + "$" + Math.abs(value).toLocaleString("en-US")' : 'sign + Math.abs(value).toFixed(1) + "%"'};
};
const area = (value: number) => ${holdings ? '"$" + (value / 1000).toLocaleString("en-US") + "k"' : '"$" + value.toLocaleString("en-US") + "bn"'};
const encoding: TreemapColorEncoding<Row> = {
  type: "diverging", label: "${recipe.colorLabel}", value: row => row.metric,
  domain: [${holdings ? "-2000, 2000" : "-3, 3"}],
  stops: [{offset:0,color:colors[2] ?? "#ee668b"},{offset:0.5,color:"var(--muted, #e5e7eb)"},{offset:1,color:colors[0] ?? "#20b898"}],
  unknownColor: "var(--border, #d1d5db)", unknownLabel: "Unknown / unaggregated", formatValue: metric,
};
export function Example() {
  const [showData, setShowData] = useState(false);
  return <TreemapChart<Row> data={data} accessors={accessors} encoding={encoding} config={{}} aria-label="${recipe.tag}" height={235} padding={${options.gap ?? 3}} groupHeaderHeight={22} layout="stable" animate={${animate}} formatValue={area}>
    <TreemapChart.Groups<Row> />
    <TreemapChart.Tiles<Row> tileProps={() => ({style:{borderRadius:${options.radius ?? 4},borderColor:"var(--background, #fff)"${finish}}})} />
    ${options.showLabels === false ? "" : `<TreemapChart.Labels<Row> minWidth={45} minHeight={18} padding={6}>{node => <><strong className="block truncate">{node.label}</strong>${options.showValues === false ? "" : '<span className="block tabular-nums">{node.height >= 44 ? metric(node.datum.metric) : null}</span>'}</>}</TreemapChart.Labels>`}
    <TreemapChart.Tooltip<Row>>{node => <><strong>{node.label}</strong><div>{area(node.value)}</div>${holdings ? '<div>{node.kind === "group" ? "Group total" : "Signed position: " + metric(node.datum.signedPosition)}</div>' : ""}<div>{node.kind === "group" ? "Color metric is not aggregated" : metric(node.datum.metric)}</div><div>{node.rootShare == null ? "—" : (node.rootShare * 100).toFixed(1) + "% of supplied ${holdings ? "gross positions" : "sample"}"}</div></>}</TreemapChart.Tooltip>
    <TreemapChart.Breadcrumbs rootLabel="All ${holdings ? "positions" : "sectors"}" />
    ${options.showLegend === false ? "" : "<TreemapChart.ColorLegend />"}
    <TreemapChart.Content><button type="button" aria-expanded={showData} onClick={() => setShowData(current => !current)}>{showData ? "Hide data" : "View data"}</button></TreemapChart.Content>
    {showData && <TreemapChart.DataTable<Row> caption="${recipe.tag} · supplied sample · October 12" scope="root" />}
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
  return `Build this ${recipe.tag.toLowerCase()} example using the compound TreemapChart API. ${treemapCandidateNote}\nKeep area and color independent, preserve the supplied stable IDs and hierarchy, and retain the navigable data table including unknown/zero records. Do not calculate signed-position accounting or group-average return in Core. Use the selected palette and the explicit fit-aware labels, group navigation and tooltip below. Reference: https://kindui.dev/charts/docs/components/treemap/.\n\n${treemapCode(recipe, material, colors, animate, options)}`;
}
