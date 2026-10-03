import type * as Chart from "@kind-ui/charts";
export const newRecipes = [
  {
    id: "heatmap-support",
    family: "Heatmap",
    tag: "Support demand",
    context: "Support tickets by weekday and shift. Afternoon demand peaks midweek.",
  },
  {
    id: "heatmap-retention",
    family: "Heatmap",
    tag: "Cohort retention",
    context:
      "Four signup cohorts over six weeks. Values show the percentage of each cohort still active.",
  },
  {
    id: "waterfall-revenue",
    family: "Waterfall",
    tag: "Revenue movement",
    context:
      "June MRR: $42k opening balance, $12k new business, $6k expansion, and $4k churn. Closing MRR is $56k.",
  },
  {
    id: "waterfall-budget",
    family: "Waterfall",
    tag: "Launch budget",
    context: "A $60k launch budget after design, engineering, and marketing spend. $18k remains.",
  },
  {
    id: "sankey-acquisition",
    family: "Sankey",
    tag: "From visit to signup",
    context:
      "1,200 visits from search and social. 380 became signups; flow widths show the conversion split.",
  },
  {
    id: "sankey-energy",
    family: "Sankey",
    tag: "Where energy goes",
    context:
      "A building’s daily 1,000 kWh supply from grid and solar, distributed across cooling, lighting, and equipment.",
  },
] as const;
export type NewRecipe = (typeof newRecipes)[number];
export function heatmapData(id: string) {
  const retention = id === "heatmap-retention";
  const rows = retention
    ? ["Jun 2", "Jun 9", "Jun 16", "Jun 23"]
    : ["Morning", "Midday", "Afternoon", "Evening"];
  const columns = retention
    ? ["W1", "W2", "W3", "W4", "W5", "W6"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const values = retention
    ? [
        [100, 82, 73, 65, 61, 58],
        [100, 85, 76, 69, 64, 60],
        [100, 80, 71, 63, 59, 55],
        [100, 88, 79, 72, 67, 64],
      ]
    : [
        [12, 15, 18, 14, 11],
        [23, 28, 31, 26, 20],
        [30, 39, 44, 37, 29],
        [9, 12, 14, 11, 8],
      ];
  return {
    rows,
    columns,
    data: rows.flatMap((row, r) =>
      columns.map((column, c) => ({ row, column, value: values[r][c] })),
    ),
    max: retention ? 100 : 45,
  };
}
export function waterfallEntries(id: string): Chart.WaterfallEntry[] {
  return id === "waterfall-revenue"
    ? [
        { id: "opening", label: "Opening", kind: "start", value: 42000 },
        { id: "new", label: "New", kind: "delta", value: 12000 },
        { id: "expand", label: "Expansion", kind: "delta", value: 6000 },
        { id: "churn", label: "Churn", kind: "delta", value: -4000 },
        { id: "closing", label: "Closing", kind: "end", value: 56000 },
      ]
    : [
        { id: "budget", label: "Budget", kind: "start", value: 60000 },
        { id: "design", label: "Design", kind: "delta", value: -8000 },
        { id: "build", label: "Build", kind: "delta", value: -24000 },
        { id: "launch", label: "Launch", kind: "delta", value: -10000 },
        { id: "remaining", label: "Left", kind: "end", value: 18000 },
      ];
}
export function sankeyData(id: string): Chart.SankeyFlowData {
  return id === "sankey-acquisition"
    ? {
        nodes: [
          { id: "search", name: "Search" },
          { id: "social", name: "Social" },
          { id: "signup", name: "Signup" },
          { id: "exit", name: "Exit" },
        ],
        links: [
          { id: "ss", source: "search", target: "signup", value: 260 },
          { id: "se", source: "search", target: "exit", value: 540 },
          { id: "cs", source: "social", target: "signup", value: 120 },
          { id: "ce", source: "social", target: "exit", value: 280 },
        ],
      }
    : {
        nodes: [
          { id: "grid", name: "Grid" },
          { id: "solar", name: "Solar" },
          { id: "cool", name: "Cooling" },
          { id: "light", name: "Lighting" },
          { id: "equip", name: "Equipment" },
        ],
        links: [
          { id: "gc", source: "grid", target: "cool", value: 320 },
          { id: "gl", source: "grid", target: "light", value: 120 },
          { id: "ge", source: "grid", target: "equip", value: 260 },
          { id: "sc", source: "solar", target: "cool", value: 130 },
          { id: "sl", source: "solar", target: "light", value: 80 },
          { id: "se", source: "solar", target: "equip", value: 90 },
        ],
      };
}
export function newCode(r: NewRecipe, material: string, colors: string[], animate: boolean) {
  const intro = `"use client";\n\nimport * as Chart from "@kind-ui/charts";\nimport * as Recharts from "recharts";\nimport "@kind-ui/charts/styles.css";\n\n// ${r.context}\nconst colors = ${JSON.stringify(colors)};\n`;
  if (r.family === "Heatmap") {
    const h = heatmapData(r.id);
    return (
      intro +
      `const rows = ${JSON.stringify(h.rows)};\nconst columns = ${JSON.stringify(h.columns)};\nconst data = ${JSON.stringify(h.data, null, 2)};\nconst scale = Chart.createHeatmapScale({domain:[0,${h.max}],colors});\n\nexport function Example(){\n return <Chart.HeatmapChart rows={rows} columns={columns} data={data} scale={scale} animate={${animate}}${r.id === "heatmap-retention" ? " formatValue={value => `${value}%`}" : ""}>\n  <Chart.HeatmapGrid caption="${r.tag}" material="${material}"${r.id === "heatmap-support" ? " Cell={() => null}" : ""} />\n  <Chart.HeatmapLegend label="${r.id === "heatmap-retention" ? "Active users" : "Tickets"}" />\n  <Chart.HeatmapTooltip valueAnimation={animate ? "shuffle" : undefined} />\n </Chart.HeatmapChart>;\n}\n`
    );
  }
  if (r.family === "Waterfall")
    return (
      intro +
      `const entries: Chart.WaterfallEntry[] = ${JSON.stringify(waterfallEntries(r.id), null, 2)};\nconst data = Chart.computeWaterfallData(entries);\nconst config = {range:{label:"Balance",color:colors[0]}};\n\nexport function Example(){\n return <Chart.Root config={config}>\n  <Recharts.ResponsiveContainer width="100%" height={240}>\n   <Chart.WaterfallChart data={data} animate={${animate}} accessibilityLayer aria-label="${r.tag}" margin={{top:20,right:12,left:0,bottom:0}}>\n    <Recharts.CartesianGrid vertical={false} strokeDasharray="3 5" />\n    <Recharts.XAxis dataKey="id" tickFormatter={id => data.find(row => row.id===id)?.label ?? String(id)} tickLine={false} axisLine={false} tick={{fontSize:11}} />\n    <Recharts.YAxis width="auto" tickFormatter={value => "$" + value/1000 + "k"} tickLine={false} axisLine={false} />\n    <Recharts.ReferenceLine y={0} />\n    <Chart.WaterfallConnectors data={data} />\n    <Chart.WaterfallSeries material="${material}" radius={4}>\n     {data.map(row => <Recharts.Cell key={row.id} fill={colors[row.kind!=="delta"?0:(row.value??0)<0?2:1]} />)}\n    </Chart.WaterfallSeries>\n    <Chart.Tooltip formatter={(_value,_name,item) => {const row=item.payload as Chart.WaterfallDatum;return ["$" + row.value?.toLocaleString(),row.label];}} />\n   </Chart.WaterfallChart>\n  </Recharts.ResponsiveContainer>\n </Chart.Root>;\n}\n`
    );
  return (
    intro +
    `const data: Chart.SankeyFlowData = ${JSON.stringify(sankeyData(r.id), null, 2)};\n\nexport function Example(){\n return <>\n  <Recharts.ResponsiveContainer width="100%" height={240}>\n   <Chart.SankeyChart data={data} animate={${animate}} nodeWidth={12} nodePadding={24} margin={{top:12,bottom:12,left:65,right:85}}\n    node={props => <g><Chart.SankeyNode {...props} color={colors[props.index%colors.length]} /><text x={props.x<100?props.x-8:props.x+props.width+8} y={props.y+props.height/2} textAnchor={props.x<100?"end":"start"} dominantBaseline="middle" fill="currentColor" fontSize={11}>{props.payload.name}</text></g>}\n    link={props => <Chart.SankeyLink {...props} material="gradient" color={colors[data.nodes.findIndex(node => node.id===props.payload.source.id)%colors.length]} targetColor={colors[data.nodes.findIndex(node => node.id===props.payload.target.id)%colors.length]} pathProps={{opacity:0.45}} />} />\n  </Recharts.ResponsiveContainer>\n  <Chart.SankeyTable data={data} caption="${r.tag}" className="sr-only" />\n </>;\n}\n`
  );
}
