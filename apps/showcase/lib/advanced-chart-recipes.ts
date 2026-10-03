export type Finish = "plain" | "paper" | "clay" | "glow";
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
      "Product quality scores on a 0–100 scale. Accessibility and reliability exceed the team’s targets.",
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
export function advancedData(id: string): Record<string, string | number | number[]>[] {
  if (id === "combo")
    return [42000, 47000, 45000, 53000, 58000, 62000].map((a, i) => ({
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i],
      a,
      b: [44000, 46000, 48000, 52000, 55000, 58000][i],
    }));
  if (id === "combo-area")
    return [28, 37, 42, 54, 63, 78].map((a, i) => ({
      month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i],
      a,
      b: 100,
    }));
  if (id === "pie" || id === "donut")
    return ["a", "b", "c"].map((key, i) => ({
      id: key,
      value: (id === "pie" ? [13920, 7200, 2880] : [144, 216, 120])[i],
    }));
  if (id.startsWith("radar"))
    return ["Delivery", "Quality", "Access", "Reliability", "Support"].map((category, i) => ({
      category,
      a: [76, 84, 92, 88, 73][i],
      b: [80, 85, 85, 85, 80][i],
      range: [
        [68, 79],
        [76, 88],
        [84, 95],
        [81, 92],
        [65, 80],
      ][i],
    }));
  if (id === "gauge") return [{ category: "Sprint", a: 72, b: 100 }];
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
    x: [120, 180, 240, 310, 380, 440, 520, 600][i],
    y: [18, 29, 41, 49, 62, 74, 85, 99][i],
    social: [14, 21, 26, 38, 45, 53, 63, 71][i],
  }));
}
export function advancedBody(r: AdvancedRecipe, material: Finish) {
  if (r.family === "Combo")
    return `<Chart.ComboChart data={data} animate={animate} accessibilityLayer aria-label="${r.tag}" margin={{top:20,right:18,left:12,bottom:0}}>
  <Recharts.CartesianGrid vertical={false} stroke="var(--chart-grid, #e4e5eb)" strokeDasharray="3 5" />
  <Recharts.XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fontSize:12}} />
  <Recharts.YAxis tickLine={false} axisLine={false} width={68} tickFormatter={value => ${r.id === "combo" ? "`$${value/1000}k`" : "`${value} TB`"}} />
  <Chart.${r.id === "combo" ? 'BarSeries dataKey="a" radius={4} maxBarSize={28}' : 'AreaSeries dataKey="a" type="monotone" fillOpacity={0.2}'} material="${material}" />
  <Chart.LineSeries dataKey="b" type="monotone" material="${material}" strokeDasharray="4 4" dot={false} strokeWidth={2.5} />
  <Chart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
</Chart.ComboChart>`;
  if (r.family === "Pie")
    return `<Chart.PieChart animate={animate} accessibilityLayer aria-label="${r.tag}">
  <Chart.PieSeries data={data.filter(row => visible.includes(row.id)).map(row => ({...row,fill:config[row.id].color}))} dataKey="value" nameKey="id" innerRadius={${r.id === "donut" ? '"54%"' : "0"}} outerRadius="85%" paddingAngle={0} />
  <Chart.Tooltip itemKey={entry => String(entry.payload.id)} valueAnimation={animate ? "shuffle" : undefined} />
</Chart.PieChart>`;
  if (r.family === "Radar")
    return `<Chart.RadarChart data={data} animate={animate} accessibilityLayer aria-label="${r.tag}" outerRadius="70%">
  <Recharts.PolarGrid gridType="${r.id === "radar-outline" ? "circle" : "polygon"}" stroke="var(--chart-grid, #e4e5eb)" />
  <Recharts.PolarAngleAxis dataKey="category" tick={{fontSize:11}} tickLine={false} />
  <Recharts.PolarRadiusAxis domain={[0,100]} tickCount={3} tick={{fontSize:10}} axisLine={false} />
  ${r.id === "radar-range" ? '<Chart.RadarSeries dataKey="range" seriesKey="a" isRange fillOpacity={0.2} />' : `<Chart.RadarSeries dataKey="a" fillOpacity={${r.id === "radar-outline" ? 0 : 0.18}} dot={${r.id === "radar-outline"}} />\n  <Chart.RadarSeries dataKey="b" fill="none" strokeDasharray="4 4" dot={${r.id === "radar-outline"}} />`}
  <Chart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
</Chart.RadarChart>`;
  if (r.family === "Radial")
    return `<Chart.RadialBarChart data={data} animate={animate} accessibilityLayer aria-label="${r.tag}" startAngle={${r.id === "gauge" ? 180 : 90}} endAngle={${r.id === "gauge" ? 0 : -270}} innerRadius="${r.id === "gauge" ? 55 : 20}%" outerRadius="90%" cy="${r.id === "gauge" ? 65 : 50}%" barGap={3}>
  <Recharts.PolarAngleAxis type="number" domain={[0,100]} tick={false} />
  <Recharts.PolarRadiusAxis type="category" dataKey="category" tick={false} axisLine={false} tickLine={false}>${r.id === "gauge" ? '\n    <Recharts.Label position="center" value="72%" fill="currentColor" />\n  ' : ""}</Recharts.PolarRadiusAxis>
  <Chart.RadialBarSeries dataKey="a" background cornerRadius={4}${r.id === "radial-stacked" ? ' stackId="work"' : ""}>${r.id !== "gauge" ? '\n    <Recharts.LabelList dataKey="category" fill="white" content={<Chart.RadialBarLabel fontSize={10} />} />\n  ' : ""}</Chart.RadialBarSeries>
  ${r.id === "gauge" ? "" : `<Chart.RadialBarSeries dataKey="b" fillOpacity={0.5} cornerRadius={4}${r.id === "radial-stacked" ? ' stackId="work"' : ""} />`}
  <Chart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
</Chart.RadialBarChart>`;
  return `<Chart.ScatterChart animate={animate} accessibilityLayer aria-label="${r.tag}" margin={{top:20,right:18,left:12,bottom:10}}>
  <Recharts.CartesianGrid stroke="var(--chart-grid, #e4e5eb)" strokeDasharray="3 5" />
  <Recharts.XAxis dataKey="x" type="number" name="${r.id === "bubble" ? "Traffic" : "Ad spend"}" unit="${r.id === "bubble" ? " req/s" : " USD"}" tickLine={false} axisLine={false} tick={{fontSize:11}} />
  <Recharts.YAxis width={72} dataKey="y" type="number" name="${r.id === "bubble" ? "Latency" : "Conversions"}" unit="${r.id === "bubble" ? " ms" : ""}" tickLine={false} axisLine={false} tick={{fontSize:11}} />
  ${r.id === "bubble" ? '<Recharts.ZAxis dataKey="z" name="Requests" range={[50,340]} />' : ""}
  <Chart.ScatterSeries data={data} seriesKey="a" shape="circle" />
  ${r.id === "bubble" ? "" : '<Chart.ScatterSeries data={data.map(row => ({...row,y:row.social}))} seriesKey="b" shape="diamond" />'}
  <Chart.ScatterTooltip${r.id === "bubble" ? ' zDimension={{dataKey:"z",name:"Requests"}}' : ""} valueAnimation={animate ? "shuffle" : undefined} />
</Chart.ScatterChart>`;
}
export function advancedCode(
  r: AdvancedRecipe,
  material: Finish,
  colors: string[],
  animate: boolean,
) {
  const config = Object.fromEntries(
    r.keys.map((key, i) => [
      key,
      {
        label: r.labels[i],
        color: colors[i],
        ...(r.id === "scatter" ? { legendShape: i === 0 ? "circle" : "diamond" } : {}),
      },
    ]),
  );
  return `"use client";\n\nimport { useState } from "react";\nimport * as Chart from "@kind-ui/charts";\nimport * as Recharts from "recharts";\nimport "@kind-ui/charts/styles.css";\n\n// ${r.context}\nconst data = ${JSON.stringify(advancedData(r.id), null, 2)};\nconst config: Chart.SeriesConfig = Object.fromEntries(Object.entries(${JSON.stringify(config, null, 2)}).map(([key, entry]) => [key, {
  ...entry,
  formatValue: (value: unknown) => {
    if (typeof value !== "number") return String(value);
    const number = value.toLocaleString();
    if (${JSON.stringify(r.id)} === "combo" || ${JSON.stringify(r.id)} === "pie") return "$" + number;
    if (${JSON.stringify(r.id)} === "combo-area") return number + " TB";
    if (${JSON.stringify(r.id)} === "radial-stacked") return number + " h";
    if (${JSON.stringify(r.id)} === "gauge") return number + "%";
    return number;
  }
}]));\n\nexport function Example(){\n const [visible,setVisible] = useState<string[]>(${JSON.stringify(r.keys)});\n const animate = ${animate};\n return <Chart.Root emphasis="auto" config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>\n  <div style={{height:240,width:"100%"}}><Recharts.ResponsiveContainer width="100%" height="100%" minWidth={0}>\n${advancedBody(r, material)}\n  </Recharts.ResponsiveContainer></div>\n  <Chart.Legend />\n </Chart.Root>;\n}\n`;
}
