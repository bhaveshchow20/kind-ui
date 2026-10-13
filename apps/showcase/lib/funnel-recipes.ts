import type { FunnelDatum } from "@kind-ui/charts";
import { demoEntry } from "@/lib/utils";
import type { DemoOptions } from "./demo-options";

export const funnelRecipes = [
  {
    id: "funnel-checkout",
    family: "Funnel",
    tag: "Checkout journey",
    context: "Checkout sessions in order. Percentages use the 2,400 sessions that added a basket.",
  },
] as const;
export type FunnelRecipe = (typeof funnelRecipes)[number];
export const checkoutStages = [
  { id: "basket", label: "Basket", value: 2400 },
  { id: "address", label: "Address", value: 1680 },
  { id: "payment", label: "Payment", value: 1200 },
  { id: "order", label: "Order", value: 960 },
] as const satisfies readonly FunnelDatum[];
export function funnelCode(
  recipe: FunnelRecipe,
  material: string,
  colors: string[],
  animate: boolean,
  options: DemoOptions = {},
) {
  void material;
  const palette = checkoutStages.map((_, index) =>
    demoEntry(colors, index % Math.max(1, colors.length)),
  );
  return `"use client";

import { FunnelChart } from "@kind-ui/charts";

const data = ${JSON.stringify(checkoutStages, null, 2)};
const colors = ${JSON.stringify(palette)};
const config = Object.fromEntries(data.map((stage, index) => [stage.id, {label: stage.label, color: colors[index] ?? "#2563eb"}]));
const formatValue = (value: number) => value.toLocaleString("en-US");

export function Example() {
  return <>
    <FunnelChart data={data} config={config} aria-label=${JSON.stringify(recipe.tag)} responsive style={{width:"100%",height:220}} denominator="first" ratioLabel="Share of basket sessions" formatValue={formatValue} animate={${animate}}>
      <FunnelChart.Stages geometry="trapezoid" />
      ${options.showLabels === false ? "" : '<FunnelChart.Labels style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,fontSize:11}} render={(stage) => <span>{stage.label} <strong>{stage.value === null ? "Unknown" : formatValue(stage.value)}</strong></span>} />'}
      <FunnelChart.Tooltip />
      ${options.showLegend === false ? "" : "<FunnelChart.Legend />"}
    </FunnelChart>
    <p>${recipe.context}</p>
    <table><caption>Checkout sessions</caption><thead><tr><th scope="col">Stage</th><th scope="col">Sessions</th><th scope="col">Share of basket sessions</th></tr></thead><tbody>{data.map((stage) => <tr key={stage.id}><th scope="row">{stage.label}</th><td>{formatValue(stage.value)}</td><td>{stage.value / 2400 * 100}%</td></tr>)}</tbody></table>
  </>;
}
`;
}
