import { demoEntry } from "@/lib/utils";
import type { DemoOptions } from "./demo-options";
export type Finish = "plain" | "clay" | "glow";
export const advancedRecipes = [
  {
    id: "combo",
    family: "Combo",
    tag: "Revenue & target",
    keys: ["a", "b"],
    labels: ["Revenue", "Target"],
    context:
      "Subscription revenue, Jan–Jun. Monthly revenue reached $62k, ahead of the $58k target.",
  },
  {
    id: "combo-area",
    family: "Combo",
    tag: "Usage & capacity",
    keys: ["a", "b"],
    labels: ["Usage", "Capacity"],
    context:
      "Cloud storage, Jan–Jun. Usage grew to 78 TB while provisioned capacity stayed at 100 TB.",
  },
  {
    id: "pie",
    family: "Pie",
    tag: "Sales by category",
    keys: ["a", "b", "c"],
    labels: ["Coffee", "Food", "Merch"],
    context: "June café sales mix. Hover a slice to focus it; coffee led at 58% of $24k.",
  },
  {
    id: "donut",
    family: "Pie",
    tag: "Support workload",
    keys: ["a", "b", "c"],
    labels: ["Billing", "Product", "Account"],
    context: "Product led this week’s support queue at 45% of tickets. Hover a slice to focus it.",
  },
  {
    id: "radar",
    family: "Radar",
    tag: "Product benchmark",
    keys: ["a", "b"],
    labels: ["Current", "Target"],
    context:
      "Product quality scores on a 0–100 scale. Accessibility and reliability exceed the team’s targets. Select a series to keep it in focus.",
  },
  {
    id: "radar-outline",
    family: "Radar",
    tag: "Team comparison",
    keys: ["a", "b"],
    labels: ["Team A", "Team B"],
    context:
      "Delivery, quality, accessibility, reliability, and support scores. Compare the two teams on the same 0–100 scale.",
  },
  {
    id: "radar-range",
    family: "Radar",
    tag: "Performance range",
    keys: ["a"],
    labels: ["Observed range"],
    context:
      "Weekly service scores. Each band spans the lowest and highest score observed across five runs.",
  },
  {
    id: "radial",
    family: "Radial",
    tag: "Quarterly goals",
    keys: ["a", "b"],
    labels: ["Progress", "Goal"],
    context:
      "Q3 goals: revenue, retention, and activation. Retention is closest to its 90% completion target.",
  },
  {
    id: "radial-stacked",
    family: "Radial",
    tag: "Work completed",
    keys: ["a", "b"],
    labels: ["Design", "Engineering"],
    context:
      "Hours delivered by project this week. Stacked arcs add design and engineering work on a 0–100 hour scale.",
  },
  {
    id: "gauge",
    family: "Radial",
    tag: "Sprint progress",
    keys: ["a"],
    labels: ["Completed"],
    context: "Sprint 24: 36 of 50 planned tasks are complete. The half-ring shows 72% completion.",
  },
  {
    id: "scatter",
    family: "Scatter",
    tag: "Spend & conversions",
    keys: ["a", "b"],
    labels: ["Search", "Social"],
    context:
      "Eight campaign runs per channel. Compare daily ad spend with the conversions each run generated.",
  },
  {
    id: "bubble",
    family: "Scatter",
    tag: "Latency under load",
    keys: ["a"],
    labels: ["API regions"],
    context:
      "Six API regions over the last hour. Position shows traffic and latency; bubble size represents request volume.",
  },
] as const;
export type AdvancedRecipe = (typeof advancedRecipes)[number];
export function advancedData(
  id: string,
  options: DemoOptions = {},
): Record<string, string | number | number[]>[] {
  if (id === "combo")
    return [42000, 47000, 45000, 53000, 58000, 62000].map((a, i) => ({
      month: demoEntry(["Jan", "Feb", "Mar", "Apr", "May", "Jun"], i),
      a,
      b: demoEntry([44000, 46000, 48000, 52000, 55000, 58000], i),
    }));
  if (id === "combo-area")
    return [28, 37, 42, 54, 63, 78].map((a, i) => ({
      month: demoEntry(["Jan", "Feb", "Mar", "Apr", "May", "Jun"], i),
      a,
      b: 100,
    }));
  if (id === "pie" || id === "donut")
    return ["a", "b", "c"].map((key, i) => ({
      id: key,
      value: demoEntry(id === "pie" ? [13920, 7200, 2880] : [144, 216, 120], i),
    }));
  if (id.startsWith("radar"))
    return ["Delivery", "Quality", "Access", "Reliability", "Support"].map((category, i) => ({
      category,
      a: demoEntry(id === "radar-outline" ? [68, 92, 77, 85, 63] : [76, 84, 92, 88, 73], i),
      b: demoEntry(id === "radar-outline" ? [89, 75, 91, 68, 82] : [85, 72, 80, 74, 88], i),
      range: demoEntry(
        [
          [68, 79],
          [76, 88],
          [84, 95],
          [81, 92],
          [65, 80],
        ],
        i,
      ),
    }));
  if (id === "gauge") return [{ category: "Sprint", a: options.progress ?? 72, b: 100 }];
  if (id === "radial-stacked")
    return [
      { category: "Website", a: 24, b: 42 },
      { category: "Onboarding", a: 18, b: 36 },
      { category: "Reporting", a: 12, b: 28 },
    ];
  if (id === "radial")
    return [
      { category: "Revenue", a: 68, b: 90 },
      { category: "Retention", a: 84, b: 90 },
      { category: "Activation", a: 57, b: 90 },
    ];
  if (id === "bubble")
    return [
      { name: "US East", x: 820, y: 94, z: 18400 },
      { name: "US West", x: 670, y: 118, z: 14200 },
      { name: "EU", x: 590, y: 106, z: 12600 },
      { name: "Asia", x: 440, y: 147, z: 9100 },
      { name: "Canada", x: 310, y: 87, z: 6400 },
      { name: "Australia", x: 240, y: 163, z: 4900 },
    ];
  return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
    x: demoEntry([120, 180, 240, 310, 380, 440, 520, 600], i),
    y: demoEntry([18, 29, 41, 49, 62, 74, 85, 99], i),
    social: demoEntry([14, 21, 26, 38, 45, 53, 63, 71], i),
  }));
}
export function advancedBody(r: AdvancedRecipe, material: Finish, options: DemoOptions = {}) {
  if (r.family === "Combo")
    return `<ComboChart config={config} style={{height:240,width:"100%"}} interaction={{kind:"series",mode:"focus",eligibleKeys:Object.keys(config)}} data={data} animate={animate} accessibilityLayer aria-label="${r.tag}" margin={{top:20,right:18,left:0,bottom:0}}>
  ${options.showGrid === false ? "" : `<ComboChart.Grid horizontal={${options.showGrid ?? true}} vertical={false} stroke="var(--chart-grid, #e4e5eb)" strokeDasharray="3 5" />`}
  <ComboChart.XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize:12}} />
  <ComboChart.YAxis tickLine={false} axisLine={false} width="auto" tickFormatter={value => ${r.id === "combo" ? "`$${value/1000}k`" : "`${value} TB`"}} />
  <${r.id === "combo" ? `ComboChart.Bar dataKey="a" radius={${options.radius ?? 4}} maxBarSize={28}` : `ComboChart.Area dataKey="a" type="${options.curve ?? "monotone"}" fillOpacity={0.2}`} material="${material}" />
  <ComboChart.Line dataKey="b" type="monotone" material="${material}" strokeDasharray="4 4" dot={${options.dots ?? false}} strokeWidth={${options.strokeWidth ?? 2.5}} />
  <ComboChart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
  ${options.showLegend === false ? "" : "<ComboChart.Legend />"}
</ComboChart>`;
  if (r.family === "Pie")
    return `<PieChart config={config} style={{height:240,width:"100%"}} interaction={{kind:"category",mode:"focus",eligibleKeys:Object.keys(config)}} animate={animate} accessibilityLayer aria-label="${r.tag}">
  <PieChart.Series categoryKey="id" data={data.map(row => ({...row,fill:config[row.id].color}))} dataKey="value" nameKey="id" innerRadius="${options.innerRadius ?? (r.id === "donut" ? 54 : 0)}%" outerRadius="85%" cornerRadius={${options.radius ?? 5}} startAngle={${options.rotation ?? 90}} endAngle={${(options.rotation ?? 90) + 360}} />
  <PieChart.Tooltip itemKey={entry => String(entry.payload.id)} valueAnimation={animate ? "shuffle" : undefined} />
  ${options.showLegend === false ? "" : "<PieChart.Legend />"}
</PieChart>`;
  if (r.family === "Radar")
    return `<RadarChart config={config} style={{height:240,width:"100%"}} interaction={{kind:"series",mode:"focus",eligibleKeys:Object.keys(config)}} data={data} animate={animate} accessibilityLayer aria-label="${r.tag}" outerRadius="${options.outerRadius ?? 70}%">
  ${options.showGrid === false ? "" : `<RadarChart.Grid gridType="${options.gridType ?? (r.id === "radar-outline" ? "circle" : "polygon")}" stroke="var(--chart-grid, #e4e5eb)" />`}
  <RadarChart.AngleAxis dataKey="category" tick={{fontSize:11}} tickLine={false} />
  <RadarChart.RadiusAxis domain={[0,100]} tickCount={3} tick={{fontSize:10}} axisLine={false} />
  ${r.id === "radar-range" ? '<RadarChart.Series dataKey="range" seriesKey="a" isRange fillOpacity={0.2} />' : `<RadarChart.Series dataKey="a" strokeWidth={${options.strokeWidth ?? 3}} fillOpacity={${options.fillOpacity ?? (r.id === "radar-outline" ? 0 : 0.18)}} dot={{r:3,fill:config.a.color,stroke:"var(--background)",strokeWidth:1.5}} />\n  <RadarChart.Series dataKey="b" strokeWidth={${options.strokeWidth ?? 3}} fill="none" strokeDasharray="4 4" dot={props => <Symbols cx={props.cx} cy={props.cy} type="diamond" size={70} fill={config.b.color} stroke="var(--background)" strokeWidth={1.5} />} />`}
  <RadarChart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
  ${options.showLegend === false ? "" : "<RadarChart.Legend />"}
</RadarChart>`;
  if (r.family === "Radial")
    return `<RadialBarChart config={config} style={{height:240,width:"100%"}} interaction={{kind:"series",mode:"focus",eligibleKeys:Object.keys(config)}} data={data} animate={animate} accessibilityLayer aria-label="${r.tag}" startAngle={${options.rotation ?? (r.id === "gauge" ? 180 : 90)}} endAngle={${(options.rotation ?? (r.id === "gauge" ? 180 : 90)) - (r.id === "gauge" ? 180 : 360)}} innerRadius="${r.id === "gauge" ? 55 : 20}%" outerRadius="${options.outerRadius ?? 90}%" cy="${r.id === "gauge" ? 65 : 50}%" barGap={3}>
  <RadialBarChart.AngleAxis type="number" domain={[0,100]} tick={false} />
  <RadialBarChart.RadiusAxis type="category" dataKey="category" tick={false} axisLine={false} tickLine={false}>${r.id === "gauge" && options.showLabels ? `\n    <Label position="center" value="${options.progress ?? 72}%" fill="currentColor" />\n  ` : ""}</RadialBarChart.RadiusAxis>
  <RadialBarChart.Series dataKey="a" background cornerRadius={${options.radius ?? 4}}${r.id === "radial-stacked" ? ' stackId="work"' : ""}>${r.id !== "gauge" && options.showLabels ? '\n    <LabelList dataKey="category" fill="white" content={<RadialBarLabel fontSize={10} />} />\n  ' : ""}</RadialBarChart.Series>
  ${r.id === "gauge" ? "" : `<RadialBarChart.Series dataKey="b" fillOpacity={0.5} cornerRadius={${options.radius ?? 4}}${r.id === "radial-stacked" ? ' stackId="work"' : ""} />`}
  <RadialBarChart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
  ${options.showLegend === false ? "" : "<RadialBarChart.Legend />"}
</RadialBarChart>`;
  return `<ScatterChart config={config} style={{height:240,width:"100%"}} interaction={{kind:"series",mode:"focus",eligibleKeys:Object.keys(config)}} animate={animate} accessibilityLayer aria-label="${r.tag}" margin={{top:20,right:18,left:0,bottom:10}}>
  ${options.showGrid === false ? "" : `<ScatterChart.Grid horizontal={${options.showGrid ?? true}} vertical={${options.showGrid ?? true}} stroke="var(--chart-grid, #e4e5eb)" strokeDasharray="3 5" />`}
  <ScatterChart.XAxis dataKey="x" type="number" name="${r.id === "bubble" ? "Traffic" : "Ad spend"}" unit="${r.id === "bubble" ? " req/s" : " USD"}" tickLine={false} axisLine={false} tick={{fontSize:11}} />
  <ScatterChart.YAxis width="auto" dataKey="y" type="number" name="${r.id === "bubble" ? "Latency" : "Conversions"}" unit="${r.id === "bubble" ? " ms" : ""}" tickLine={false} axisLine={false} tick={{fontSize:11}} />
  ${r.id === "bubble" ? '<ScatterChart.ZAxis dataKey="z" name="Requests" range={[50,340]} />' : ""}
  <ScatterChart.Series data={data} seriesKey="a" shape={props => <Symbols cx={props.cx} cy={props.cy} type="${options.pointShape ?? "circle"}" size={${r.id === "bubble" ? `Number(props.size ?? 60) * ${(options.width ?? 60) / 60}` : (options.width ?? 60)}} fill={config.a.color} />} />
  ${r.id === "bubble" ? "" : `<ScatterChart.Series data={data.map(row => ({...row,y:row.social}))} seriesKey="b" shape={props => <Symbols cx={props.cx} cy={props.cy} type="${options.pointShape ?? "diamond"}" size={${options.width ?? 60}} fill={config.b.color} />} />`}
  <ScatterChart.Tooltip${r.id === "bubble" ? ' zDimension={{dataKey:"z",name:"Requests"}}' : ""} valueAnimation={animate ? "shuffle" : undefined} />
  ${options.showLegend === false ? "" : "<ScatterChart.Legend />"}
</ScatterChart>`;
}
export function advancedCode(
  r: AdvancedRecipe,
  material: Finish,
  colors: string[],
  animate: boolean,
  options: DemoOptions = {},
) {
  const config = Object.fromEntries(
    r.keys.map((key, i) => [
      key,
      {
        label: r.labels[i],
        color: colors[i],
        ...(r.id === "scatter" || (r.family === "Radar" && r.id !== "radar-range")
          ? {
              legendShape:
                r.id === "scatter"
                  ? (options.pointShape ?? (i === 0 ? "circle" : "diamond"))
                  : i === 0
                    ? "circle"
                    : "diamond",
            }
          : {}),
      },
    ]),
  );
  return `"use client";\n\nimport { ComboChart, Label, LabelList, PieChart, RadarChart, RadialBarChart, RadialBarLabel, ScatterChart, type SeriesConfig, Symbols } from "@kind-ui/charts";\n\n// ${r.context}\nconst data = ${JSON.stringify(advancedData(r.id, options), null, 2)};\nconst config: Record<string, SeriesConfig[string] & { color: string }> = Object.fromEntries(Object.entries(${JSON.stringify(config, null, 2)} satisfies SeriesConfig).map(([key, entry]) => [key, {
  ...entry,
  formatValue: (value: unknown) => {
    if (typeof value !== "number") return String(value);
    const number = value.toLocaleString("en-US");
    return ${r.id === "combo" || r.id === "pie" ? '"$" + number' : r.id === "combo-area" ? 'number + " TB"' : r.id === "radial-stacked" ? 'number + " h"' : r.id === "gauge" ? 'number + "%"' : "number"};
  }
}]));\n\nexport function Example(){\n const animate = ${animate};\n return ${advancedBody(r, material, options)};\n}\n`;
}
