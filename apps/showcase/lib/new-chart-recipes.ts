import type {
  BoxPlotSummary,
  CandlestickDatum,
  HistogramBin,
  SankeyFlowData,
  WaterfallEntry,
} from "@kind-ui/charts";
import { demoEntry } from "@/lib/utils";
import type { DemoOptions } from "./demo-options";
export const newRecipes = [
  {
    id: "candlestick-sessions",
    family: "Candlestick",
    tag: "Session price action",
    context:
      "Twenty illustrative sessions from synthetic executions. Prices are USD per share; aligned volume is shares.",
  },
  {
    id: "line-trials",
    family: "Line",
    tag: "Trials & subscriptions",
    context:
      "Six months of trial starts and paid conversions. A chart composed from explicit LineChart axes, Series, Tooltip and Legend parts.",
  },
  {
    id: "histogram-orders",
    family: "Histogram",
    tag: "Order totals",
    context: "Order totals from 240 café purchases. Most baskets fall between $10 and $20.",
  },
  {
    id: "histogram-latency",
    family: "Histogram",
    tag: "Response time distribution",
    context:
      "200 API requests grouped into unequal intervals. Density preserves the comparison: each bar’s area represents its share of requests.",
  },
  {
    id: "box-latency",
    family: "Box Plot",
    tag: "Request times",
    context:
      "Request times by endpoint in milliseconds. Boxes show the middle 50%, center lines the median, and dots the outliers.",
  },
  {
    id: "box-regions",
    family: "Box Plot",
    tag: "Growth across regions",
    context:
      "Weekly revenue growth in percentage points. Compare the spread around each region’s median, including weeks below zero.",
  },
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
    tag: "Visit to signup",
    context:
      "1,200 visits from search and social. 380 became signups; flow widths show the conversion split.",
  },
  {
    id: "sankey-energy",
    family: "Sankey",
    tag: "Energy use",
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
      columns.map((column, c) => ({ row, column, value: demoEntry(demoEntry(values, r), c) })),
    ),
    max: retention ? 100 : 45,
  };
}
export function waterfallEntries(id: string): WaterfallEntry[] {
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
export function sankeyData(id: string): SankeyFlowData {
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
export const conversionData = [
  { month: "Apr", trials: 210, paid: 48 },
  { month: "May", trials: 260, paid: 65 },
  { month: "Jun", trials: 245, paid: 72 },
  { month: "Jul", trials: 320, paid: 98 },
  { month: "Aug", trials: 380, paid: 127 },
  { month: "Sep", trials: 425, paid: 156 },
];
export function histogramBins(id: string): HistogramBin[] {
  return id === "histogram-orders"
    ? [
        { lower: 0, upper: 10, count: 42 },
        { lower: 10, upper: 20, count: 92 },
        { lower: 20, upper: 30, count: 64 },
        { lower: 30, upper: 40, count: 28 },
        { lower: 40, upper: 50, count: 14 },
      ]
    : [
        { lower: 0, upper: 25, count: 48 },
        { lower: 25, upper: 50, count: 82 },
        { lower: 50, upper: 100, count: 50 },
        { lower: 100, upper: 200, count: 20 },
      ];
}
export type BoxRow = { category: string; summary: BoxPlotSummary };
export function boxRows(id: string): BoxRow[] {
  return id === "box-latency"
    ? [
        {
          category: "Search",
          summary: {
            lowerWhisker: 18,
            q1: 32,
            median: 44,
            q3: 61,
            upperWhisker: 84,
            outliers: [112],
          },
        },
        {
          category: "Checkout",
          summary: {
            lowerWhisker: 26,
            q1: 46,
            median: 68,
            q3: 88,
            upperWhisker: 126,
            outliers: [154],
          },
        },
        {
          category: "Profile",
          summary: {
            lowerWhisker: 12,
            q1: 22,
            median: 31,
            q3: 46,
            upperWhisker: 72,
          },
        },
      ]
    : [
        {
          category: "North",
          summary: {
            lowerWhisker: -16,
            q1: -8,
            median: -2,
            q3: 5,
            upperWhisker: 14,
            outliers: [-26, 24],
          },
        },
        {
          category: "South",
          summary: {
            lowerWhisker: -7,
            q1: 2,
            median: 8,
            q3: 13,
            upperWhisker: 21,
          },
        },
        {
          category: "West",
          summary: {
            lowerWhisker: -12,
            q1: -5,
            median: 1,
            q3: 8,
            upperWhisker: 18,
          },
        },
      ];
}
export type CandlestickSample = CandlestickDatum & {
  source: "Synthetic executions";
  priceUnit: "USD/share";
  volumeUnit: "shares";
};
const sessionObservations = [
  ["2026-09-14", 184.2, 188.6, 182.4, 187.3, 420000],
  ["2026-09-15", 187.3, 190.1, 185.8, 189.4, 365000],
  ["2026-09-16", 189.4, 191.2, 186.7, 188.1, 298000],
  ["2026-09-17", 188.1, 194.2, 187.2, 192.8, 530000],
  ["2026-09-18", 192.8, 195.3, 190.2, 191.6, 340000],
  ["2026-09-21", 191.6, 196.4, 189.9, 195.2, 480000],
  ["2026-09-22", 195.2, 199.2, 193.4, 197.6, 610000],
  ["2026-09-23", 197.6, 200.8, 195.7, 198.4, 445000],
  ["2026-09-24", 198.4, 200.1, 196.3, 198.4, 280000],
  ["2026-09-25", 198.4, 199.6, 193.8, 195.1, 390000],
  ["2026-09-28", 195.1, 198.9, 194.2, 197.2, 350000],
  ["2026-09-29", 197.2, 202.3, 196.6, 201.4, 560000],
  ["2026-09-30", 201.4, 204.6, 199.8, 203.7, 625000],
  ["2026-10-01", 203.7, 205.9, 200.6, 202.1, 410000],
  ["2026-10-02", 202.1, 203.8, 198.4, 200.2, 455000],
  ["2026-10-05", 200.2, 205.1, 199.7, 204.6, 540000],
  ["2026-10-06", 204.6, 208.2, 203.5, 207.3, 670000],
  ["2026-10-07", 207.3, 209.8, 205.9, 208.4, 590000],
  ["2026-10-08", 208.4, 210.1, 204.8, 205.7, 465000],
  ["2026-10-09", 205.7, 208.8, 204.6, 206.4, 510000],
] as const;
export const candlestickRows: CandlestickSample[] = sessionObservations.map(
  ([time, open, high, low, close, volume]) => ({
    time,
    open,
    high,
    low,
    close,
    volume,
    source: "Synthetic executions",
    priceUnit: "USD/share",
    volumeUnit: "shares",
  }),
);

export function newCode(
  r: NewRecipe,
  material: string,
  colors: string[],
  animate: boolean,
  options: DemoOptions = {},
) {
  const imports = {
    Line: "LineChart",
    Candlestick: "CandlestickChart, type CandlestickDatum",
    Histogram: "HistogramChart, type HistogramBin",
    "Box Plot": "BoxPlotChart, type BoxPlotSummary, ReferenceLine",
    Heatmap: "HeatmapChart, createHeatmapScale",
    Waterfall:
      "WaterfallChart, type WaterfallEntry, type WaterfallDatum, Cell, ReferenceLine, computeWaterfallData",
    Sankey: "SankeyChart, type SankeyFlowData",
  }[r.family];
  const paletteLookup =
    r.family === "Sankey"
      ? `function paletteColor(index: number): string {\n  const color = colors[index];\n  if (color === undefined) throw new Error("Missing palette color");\n  return color;\n}\n`
      : "";
  const reactImports = r.family === "Candlestick" ? 'import { useState } from "react";\n' : "";
  const intro = `"use client";\n\nimport { ${imports} } from "@kind-ui/charts";\n${reactImports}\n// ${r.context}\nconst colors = ${JSON.stringify(colors)} as const;\nconst animate = ${animate};\n${paletteLookup}`;
  if (r.family === "Candlestick") {
    return (
      intro +
      `type Row = CandlestickDatum & { source: string; priceUnit: string; volumeUnit: string };
const data: Row[] = ${JSON.stringify(candlestickRows, null, 2)};
const config = {price:{label:"Synthetic executions · USD/share",color:colors[0]},volume:{label:"Volume · shares",color:colors[2]}};
export function Example(){
 const [selection, setSelection] = useState<Row["time"] | null>(null);
 return <><CandlestickChart data={data} timeMode="business-date" spacing="ordinal" config={config} selection={selection} onSelectionChange={point => setSelection(point?.time ?? null)} style={{width:"100%",height:240}} animate={animate} aria-label="Synthetic session trade OHLC in USD per share, volume in shares" margin={{top:12,right:12,left:0,bottom:8}} formatTime={time => String(time).slice(5)} formatPrice={value => "$" + value.toFixed(2)} formatVolume={value => value.toLocaleString("en-US") + " shares"}>
  ${options.showGrid === false ? "" : '<CandlestickChart.Grid vertical={false} stroke="var(--chart-grid, #e5e7eb)" strokeDasharray="3 5" />'}
  <CandlestickChart.XAxis tickLine={false} axisLine={false} tickCount={5} tick={${options.showLabels === false ? "false" : "{fontSize:11}"}} />
  <CandlestickChart.YAxis width="auto" tickLine={false} axisLine={false} tick={${options.showLabels === false ? "false" : "{fontSize:11}"}} tickFormatter={value => "$" + Number(value).toFixed(0)} />
  <CandlestickChart.Series seriesKey="price" rising={colors[0]} falling={colors[1]} unchanged={colors[2]} maxBarSize={${options.width ?? 14}} markProps={{strokeWidth:${options.strokeWidth ?? 1.5}}} />
  <CandlestickChart.Volume seriesKey="volume" maxBarSize={${options.width ?? 14}} fillOpacity={1} axisProps={{hide:true}} />
  <CandlestickChart.Crosshair stroke="var(--chart-axis, #64748b)" />
  <CandlestickChart.Tooltip />
  <CandlestickChart.Content className="sr-only" />
 </CandlestickChart>
 <div className="sr-only">
 <table data-kind-ui="candlestick-data-alternative">
  <caption>Synthetic executions: daily OHLC in USD per share and volume in shares</caption>
  <thead><tr>{["Session", "Open", "High", "Low", "Close", "Volume", "Source"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
  <tbody>{data.map(row => <tr key={row.time} data-selected={row.time === selection || undefined}>
   <th scope="row">{String(row.time).slice(5)}</th>
   {(["open", "high", "low", "close"] as const).map(field => <td key={field}>{row[field] === undefined ? "—" : "$" + row[field].toFixed(2)}</td>)}
   <td>{row.volume === undefined ? "—" : row.volume.toLocaleString("en-US") + " shares"}</td><td>{row.source}</td>
  </tr>)}</tbody>
 </table></div></>;
}
`
    );
  }
  if (r.family === "Line") {
    return (
      intro +
      `const data = ${JSON.stringify(conversionData, null, 2)};
const config = {trials:{label:"Trial starts",color:colors[0]},paid:{label:"Paid conversions",color:colors[1]}};
export function Example(){
 return <LineChart data={data} config={config} responsive style={{width:"100%",height:280}} animate={animate} aria-label="${r.tag}">
  ${options.showGrid === false ? "" : '<LineChart.Grid stroke="var(--chart-grid)" vertical={false} strokeDasharray="3 5" />'}
  <LineChart.XAxis dataKey="month" tick={{fontSize:11}} />
  <LineChart.YAxis width="auto" tick={{fontSize:11}} />
  <LineChart.Series dataKey="trials" seriesKey="trials" material="${material}" type="${options.curve ?? "monotone"}" dot={${options.dots ?? false}} strokeWidth={${options.strokeWidth ?? 3}} />
  <LineChart.Series dataKey="paid" seriesKey="paid" material="${material}" type="${options.curve ?? "monotone"}" dot={${options.dots ?? false}} strokeWidth={${options.strokeWidth ?? 3}} />
  <LineChart.Tooltip {...(animate ? { valueAnimation: "shuffle" as const } : {})} />
  ${options.showLegend === false ? "" : "<LineChart.Legend />"}
 </LineChart>;
}
`
    );
  }
  if (r.family === "Histogram") {
    const latency = r.id === "histogram-latency";
    const density = options.density ?? latency;
    return (
      intro +
      `const bins: HistogramBin[] = ${JSON.stringify(histogramBins(r.id), null, 2)};
const config = {count:{label:"${density ? "Density" : latency ? "Requests" : "Orders"}",color:colors[0]}};
export function Example(){
 return <HistogramChart config={config} bins={bins} measure="${density ? "density" : "count"}" style={{width:"100%",height:240}} animate={animate} aria-label="${r.tag}" margin={{top:16,right:12,left:0,bottom:8}}>
  <HistogramChart.XAxis tickLine={false} axisLine={false} tick={{fontSize:11}} tickFormatter={value => ${latency ? "`${value} ms`" : "`$${value}`"}} />
  <HistogramChart.YAxis width="auto" tickLine={false} axisLine={false} tick={{fontSize:11}}${density ? " tickFormatter={value => Number(value).toFixed(3)}" : ""} />
  ${options.showGrid === false ? "" : '<HistogramChart.Grid horizontal vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />'}
  <HistogramChart.Series material="${material}" stroke="${options.binBorders === false ? "none" : "var(--background)"}" strokeWidth={1.5} />
  <HistogramChart.Tooltip {...(animate ? { valueAnimation: "shuffle" as const } : {})} labelFormatter={(_label,entries) => {const bin=entries[0]?.payload as HistogramBin | undefined;return bin ? bin.lower + "–" + bin.upper + "${latency ? " ms" : " USD"}" : "";}} formatter={value => [${density ? "Number(value).toFixed(4)" : "String(value)"},"${density ? (latency ? "Density per ms" : "Density per dollar") : latency ? "Requests" : "Orders"}"]} />
  ${options.showLegend === false ? "" : "<HistogramChart.Legend />"}
 </HistogramChart>;
}
`
    );
  }
  if (r.family === "Box Plot") {
    const horizontal = r.id === "box-regions";
    return (
      intro +
      `type Row = {category:string;summary:BoxPlotSummary};
const data: Row[] = ${JSON.stringify(boxRows(r.id), null, 2)};
const config = {spread:{label:"${horizontal ? "Weekly growth" : "Request time"}",color:colors[0]}};
export function Example(){
 return <BoxPlotChart config={config} data={data} layout="${horizontal ? "vertical" : "horizontal"}" style={{width:"100%",height:240}} animate={animate} aria-label="${r.tag}" margin={{top:16,right:12,left:0,bottom:8}}>
  ${options.showGrid === false ? "" : `<BoxPlotChart.Grid vertical={${horizontal}} horizontal={${!horizontal}} stroke="var(--chart-grid)" strokeDasharray="3 5" />`}
  <BoxPlotChart.XAxis type="${horizontal ? "number" : "category"}" ${horizontal ? 'domain={["dataMin","dataMax"]} tickFormatter={value => `${value} pp`}' : 'dataKey="category"'} tickLine={false} axisLine={false} tick={{fontSize:11}} />
  <BoxPlotChart.YAxis width="auto" type="${horizontal ? "category" : "number"}" ${horizontal ? 'dataKey="category"' : 'domain={[0,"dataMax"]} tickFormatter={value => `${value} ms`}'} tickLine={false} axisLine={false} tick={{fontSize:11}} />
  <ReferenceLine ${horizontal ? "x" : "y"}={0} />
  <BoxPlotChart.Series<Row> strokeWidth={${options.strokeWidth ?? 3}} dataKey="summary" seriesKey="spread" barSize={${options.width ?? 32}} outlierRadius={${options.outlierRadius ?? 3}} material="${material}" fillOpacity={0.65} />
  <BoxPlotChart.Tooltip {...(animate ? { valueAnimation: "shuffle" as const } : {})} formatter={(_value,_name,item) => [String((item.payload as Row).summary.median) + " ${horizontal ? "pp" : "ms"}","Median"]} />
  ${options.showLegend === false ? "" : "<BoxPlotChart.Legend />"}
 </BoxPlotChart>;
}
`
    );
  }
  if (r.family === "Heatmap") {
    const h = heatmapData(r.id);
    return (
      intro +
      `const rows = ${JSON.stringify(h.rows)};
const columns = ${JSON.stringify(h.columns)};
const data = ${JSON.stringify(h.data, null, 2)};
const scale = createHeatmapScale({domain:[0,${h.max}],colors});
export function Example(){
 return <HeatmapChart config={{}} aria-label="${r.tag}" rows={rows} columns={columns} data={data} scale={scale} animate={animate}${r.id === "heatmap-retention" ? " formatValue={value => `${value}%`}" : ""}>
  <HeatmapChart.Grid caption="${r.tag}" material="${material}" layout={{gap:${options.gap ?? 4},rowLabels:"${options.showLabels === false ? "hidden" : "visible"}",columnLabels:"${options.showLabels === false ? "hidden" : "visible"}"}} cellProps={() => ({style:{borderRadius:${options.radius ?? 5}}})}${(options.showValues ?? r.id === "heatmap-retention") ? "" : " Cell={() => null}"} />
  ${options.showLegend === false ? "" : `<HeatmapChart.Legend label="${r.id === "heatmap-retention" ? "Active users" : "Tickets"}" />`}
  <HeatmapChart.Tooltip {...(animate ? { valueAnimation: "shuffle" as const } : {})} />
 </HeatmapChart>;
}
`
    );
  }
  if (r.family === "Waterfall") {
    return (
      intro +
      `const entries: WaterfallEntry[] = ${JSON.stringify(waterfallEntries(r.id), null, 2)};
const data = computeWaterfallData(entries);
const config = {range:{label:"Balance",color:colors[0]}};
export function Example(){
 return <WaterfallChart config={config} data={data} style={{width:"100%",height:240}} animate={animate} accessibilityLayer aria-label="${r.tag}" margin={{top:20,right:12,left:0,bottom:0}}>
  ${options.showGrid === false ? "" : '<WaterfallChart.Grid horizontal vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />'}
  <WaterfallChart.XAxis dataKey="id" tickFormatter={id => data.find(row => row.id===id)?.label ?? String(id)} tickLine={false} axisLine={false} tick={{fontSize:11}} />
  <WaterfallChart.YAxis width="auto" tickFormatter={value => "$" + value/1000 + "k"} tickLine={false} axisLine={false} />
  <ReferenceLine y={0} />
  ${options.connectors === false ? "" : "<WaterfallChart.Connectors data={data} />"}
  <WaterfallChart.Series material="${material}" radius={${options.radius ?? 4}} maxBarSize={${options.width ?? 35}}>
   {data.map(row => <Cell key={row.id} fill={colors[row.kind!=="delta"?0:(row.value??0)<0?2:1]} />)}
  </WaterfallChart.Series>
  <WaterfallChart.Tooltip formatter={(_value,_name,item) => {const row=item.payload as WaterfallDatum;return ["$" + row.value?.toLocaleString("en-US"),row.label];}} />
 </WaterfallChart>;
}
`
    );
  }
  return (
    intro +
    `const data: SankeyFlowData = ${JSON.stringify(sankeyData(r.id), null, 2)};
const config = Object.fromEntries(data.nodes.map((node,index) => [node.id,{label:node.name,color:paletteColor(index%colors.length)}]));
export function Example(){
 return <SankeyChart config={config} aria-label="${r.tag}" data={data} style={{width:"100%",height:240}} animate={animate} nodeWidth={${options.nodeWidth ?? 12}} nodePadding={${options.nodePadding ?? 24}} margin={{top:12,bottom:12,left:65,right:85}}>
  <SankeyChart.Nodes render={props => <g><SankeyChart.Node {...props} color={paletteColor(props.index%colors.length)} />${(options.showLabels ?? true) ? '<text x={props.x<100?props.x-8:props.x+props.width+8} y={props.y+props.height/2} textAnchor={props.x<100?"end":"start"} dominantBaseline="middle" fill="currentColor" fontSize={11}>{props.payload.name}</text>' : ""}</g>} />
  <SankeyChart.Links render={props => <SankeyChart.Link {...props} material="gradient" color={paletteColor(data.nodes.findIndex(node => node.id===props.payload.source.id)%colors.length)} targetColor={paletteColor(data.nodes.findIndex(node => node.id===props.payload.target.id)%colors.length)} pathProps={{opacity:${options.linkOpacity ?? 0.45}}} />} />
 </SankeyChart>;
}
`
  );
}
