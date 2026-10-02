"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { motion, useReducedMotion } from "motion/react";
import * as Chart from "@kind-ui/charts";
import { RotateCcw, Check, Copy, Moon, Sun, Pencil, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaletteColorInput } from "@/components/palette-color-input";
import { MorphingPopover as Popover, MorphingPopoverContent as PopoverContent, MorphingPopoverTrigger as PopoverTrigger } from "@/components/morphing-popover";
import { KindLogo } from "@/components/kind-logo";
import { CodeBlock } from "@/components/code-block";
import { AdvancedChartCard, advancedRecipes } from "@/components/advanced-chart-card";

import { NewChartCard } from "@/components/new-chart-card";
import { newRecipes } from "@/lib/new-chart-recipes";

type Material = "plain" | "paper" | "clay" | "glow";
type Family = "All" | "Line" | "Area" | "Bar" | "Combo" | "Pie" | "Radar" | "Radial" | "Scatter" | "Heatmap" | "Waterfall" | "Sankey";
const families: Family[] = ["All","Line","Area","Bar","Combo","Pie","Radar","Radial","Scatter","Heatmap","Waterfall","Sankey"];
const repo = "https://github.com/bhaveshchow20/kind-ui";
const palettes = { Pastel: ["#91a8e7", "#dda0b9", "#89bfb0"], Ink: ["#25252b", "#75757f", "#b0b0bb"], Neon: ["#733bff", "#119548", "#f22e79"] };
const darkPalettes = { Pastel: ["#a9b9f3", "#f0b5cf", "#9ad8c4"], Ink: ["#efeff2", "#a6a6b3", "#666675"], Neon: ["#b28aff", "#a3ff57", "#ff65b2"] };
type Palette = keyof typeof palettes | "Custom";
const recipes = [
  { id: "line", family: "Line", title: "A little upward momentum", subtitle: "Weekly active users", stat: "96", note: "+26% this month", tag: "Weekly active users", keys: ["a"], context: "Weekly active users across eight weeks. Engagement grew from 3,200 to 5,120 users." },
  { id: "multi", family: "Line", title: "Better together", subtitle: "Traffic by channel", stat: "201", note: "Three paths. One picture.", tag: "Traffic by channel", keys: ["a", "b", "c"], context: "Website acquisition, Jan–Aug. Direct, organic search, and social traffic all grew through the summer." },
  { id: "area", family: "Area", title: "Room to grow", subtitle: "Monthly recurring revenue", stat: "$96", note: "The shape of steady growth", tag: "Recurring revenue", keys: ["a"], context: "Subscription revenue, Jan–Aug. Monthly recurring revenue increased from $42k to $96k." },
  { id: "bars", family: "Bar", title: "Make every month count", subtitle: "Orders fulfilled", stat: "495", note: "A strong finish to summer", tag: "Orders fulfilled", keys: ["a"], context: "Store orders, Jan–Aug. Fulfilment reached 980 orders in August after a softer March." },
  { id: "stacked", family: "Area", title: "The whole, in parts", subtitle: "Sessions by device", stat: "201", note: "Desktop, mobile & tablet", tag: "Sessions by device", keys: ["a", "b", "c"], context: "Product sessions, Jan–Aug. See how desktop, mobile, and tablet contribute to total usage." },
  { id: "grouped", family: "Bar", title: "Side by side", subtitle: "New vs. returning customers", stat: "159", note: "August customer activity", tag: "New & returning customers", keys: ["a", "b"], context: "New and returning customers, Jan–Aug. 76 of August’s 159 customers are returning." },
  { id: "steps", family: "Line", title: "One step at a time", subtitle: "Capacity added", stat: "96 units", note: "Growth happens in steps", tag: "Team capacity", keys: ["a"], context: "Available team seats, Jan–Aug. Capacity grows in discrete batches as new seats are purchased." },
  { id: "horizontal", family: "Bar", title: "A different perspective", subtitle: "Campaign conversions", stat: "96", note: "August leads the pack", tag: "Campaign leads", keys: ["a"], context: "June campaign leads. Compare six channels; email generated the most qualified leads." },
  { id: "signed", family: "Bar", title: "The ups and the downs", subtitle: "Net subscriber change", stat: "+170", note: "Every change deserves context", tag: "Subscriber growth", keys: ["a"], context: "Net subscriber changes, Jan–Aug. Gains and cancellations add up to 170 net new subscribers." },
] as const;
type Recipe = typeof recipes[number];
function recipeData(id:string){
 const values:Record<string,{a:number[];b?:number[];c?:number[];periods?:string[]}>={
 line:{a:[3200,3450,3380,3920,4160,4380,4760,5120],periods:["W1","W2","W3","W4","W5","W6","W7","W8"]},
 multi:{a:[4200,4800,4550,5600,5900,6200,6800,7400],b:[2800,3200,3150,3650,4100,4600,4900,5300],c:[900,1200,1100,1400,1600,1850,2100,2350]},
 area:{a:[42000,48000,46000,59000,67000,76000,84000,96000]},
 bars:{a:[480,620,550,710,690,820,890,980]},
 stacked:{a:[820,910,880,1050,1120,1210,1300,1420],b:[540,630,590,760,820,900,970,1080],c:[120,140,130,170,190,210,235,260]},
 grouped:{a:[46,52,49,61,65,73,79,83],b:[28,34,31,42,50,59,68,76]},
 steps:{a:[20,20,35,35,50,50,75,96]},
 horizontal:{a:[96,82,61,48,35,29],periods:["Email","Search","Social","Events","Partners","Referral"]},
 signed:{a:[18,32,-12,43,-19,54,-8,62]}
 };
 const v=values[id];return v.a.map((a,i)=>({month:v.periods?.[i]??["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"][i],a,b:v.b?.[i]??0,c:v.c?.[i]??0}));
}
function recipeLabels(id:string):Record<string,string>{return id==="multi"?{a:"Direct",b:"Organic",c:"Social"}:id==="grouped"?{a:"New",b:"Returning",c:"Other"}:{a:"Desktop",b:"Mobile",c:"Tablet"};}


function snippet(r: Recipe, material: Material, colors: string[], animate: boolean) {
 const family = r.family;
 const horizontal = r.id === "horizontal";
 const series = r.keys.map((k,i) => `          <Chart.${family}Series dataKey="${k}" material="${material}"${family === "Line" ? ` type="${r.id === "steps" ? "stepAfter" : "monotone"}" dot={false} strokeWidth={${material === "clay" ? 5 : 3}}` : family === "Area" ? ` type="monotone" fill=${r.id === "area" ? '"url(#area-fill)"' : `"${colors[i]}"`} fillOpacity={${r.id === "area" ? 1 : .5}} strokeWidth={2.5}${r.id === "stacked" ? ' stackId="devices"' : ''}` : ` radius={5} maxBarSize={${horizontal ? 18 : 35}}`} />`).join('\n');
 const chartData = recipeData(r.id);
 const config = Object.fromEntries(r.keys.map((k,i)=>[k,{label:r.keys.length===1 ? r.subtitle : recipeLabels(r.id)[k],color:colors[i]}]));
 return `"use client";

import { useState } from "react";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
${chartData.map(d=>`  ${JSON.stringify(d)},`).join('\n')}
];

const config: Chart.SeriesConfig = Object.fromEntries(\n  Object.entries(${JSON.stringify(config,null,2)}).map(([key, value]) => [key, {\n    ...value, formatValue: (v: unknown) => typeof v === "number" ? v.toLocaleString() : String(v)\n  }])\n);

export function Example() {
  const [visible, setVisible] = useState<string[]>(${JSON.stringify(r.keys)});
  return (
    <Chart.Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}
      style={{ border: 0, padding: 0, background: "transparent" }}>
      <div style={{ height: 240, width: "100%" }}>
        <Chart.ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <Chart.${family}Chart data={data} animate={${animate}} layout="${horizontal ? "vertical" : "horizontal"}"
            accessibilityLayer aria-label="${r.subtitle}"
            margin={{ top: 20, right: 18, left: ${horizontal ? 12 : -20}, bottom: 0 }}>
            <Chart.CartesianGrid vertical={false} stroke="var(--chart-grid, #e4e5eb)" strokeDasharray="3 5" />
            <Chart.XAxis ${horizontal ? 'type="number"' : 'dataKey="month" type="category"'} tickLine={false} axisLine={false}
              tick={{ fontSize: 12, fill: "var(--chart-axis, #767782)" }} tickMargin={10} />
            <Chart.YAxis ${horizontal ? 'dataKey="month" type="category"' : 'type="number"'} tickLine={false} axisLine={false}
              tick={{ fontSize: 12, fill: "var(--chart-axis, #767782)" }} width={${horizontal ? 80 : 55}} />${r.id === "signed" ? '\n            <Chart.ReferenceLine y={0} stroke="var(--chart-axis, #767782)" />' : ''}${r.id === "area" ? `
            <defs>
              <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="${colors[0]}" stopOpacity={0.48} />
                <stop offset="100%" stopColor="${colors[0]}" stopOpacity={0.03} />
              </linearGradient>
            </defs>` : ''}
${series}
            <Chart.Tooltip cursor={${family === "Bar" ? '{ fill: "#a4a8be", fillOpacity: .09 }' : '{ stroke: "#8d8e9b", strokeDasharray: "3 4" }'}} />
          </Chart.${family}Chart>
        </Chart.ResponsiveContainer>
      </div>
      <Chart.Legend aria-label="Visible series for ${r.tag}" />
    </Chart.Root>
  );
}`;
}

function ChartCard({ r, material, colors, animate, replay }: { r: Recipe; material: Material; colors: string[]; animate: boolean; replay: number }) {
 const reduceMotion = useReducedMotion();
 const [visible, setVisible] = useState<string[]>([...r.keys]);
 const [copied, setCopied] = useState(false);
 const chartData = recipeData(r.id);
 const config = Object.fromEntries(r.keys.map((k,i) => [k,{ label: r.keys.length === 1 ? r.subtitle : recipeLabels(r.id)[k], color: colors[i], formatValue: (v: unknown) => typeof v === 'number' ? v.toLocaleString() : String(v) }]));
 const ChartComponent = r.family === "Line" ? Chart.LineChart : r.family === "Area" ? Chart.AreaChart : Chart.BarChart;
 const horizontal = r.id === "horizontal";
 const code = snippet(r,material,colors,animate);
 async function copyCode() { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1800); } catch { setCopied(false); } }
 return <motion.article initial={reduceMotion ? false : {opacity:0,y:14}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.12}} transition={{duration:0.5,ease:"easeOut"}} className={`chart-card ${r.id === 'multi' ? 'tinted' : ''}`}>
   <div className="card-top"><h3 className="chart-tag">{r.tag}</h3><div className="card-code-actions"><Button variant="ghost" size="icon-sm" onClick={copyCode} aria-label={`Copy code for ${r.tag}`} title={copied ? "Copied" : "Copy code"}>{copied ? <Check/> : <Copy/>}</Button><span className="action-divider"/><Dialog><DialogTrigger asChild><Button variant="outline" size="sm" aria-label="View chart code">Code</Button></DialogTrigger><DialogContent className="code-dialog"><DialogTitle className="sr-only">{r.tag} code</DialogTitle><DialogDescription className="sr-only">A complete TSX example using Kind UI with the current finish, palette and motion settings.</DialogDescription><div className="code-block-header"><span className="code-file"><span className="typescript-badge">TS</span>chart-{r.id}.tsx</span><Button variant="ghost" size="icon-sm" onClick={copyCode} aria-label="Copy code" title={copied ? "Copied" : "Copy code"}>{copied ? <Check/> : <Copy/>}</Button></div><CodeBlock code={code}/><div className="code-block-note sr-only">Requires the built @kind-ui/charts workspace package.</div></DialogContent></Dialog></div></div>
   <Chart.Root className="chart-root" config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
    <div className="chart-canvas"><Chart.ResponsiveContainer width="100%" height="100%" minWidth={0}>
    <ChartComponent key={replay} data={chartData} animate={animate} layout={horizontal ? "vertical" : "horizontal"} accessibilityLayer aria-label={r.subtitle} margin={{top:20,right:18,left:horizontal?12:-20,bottom:0}}>
     <Chart.CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5"/>
     <Chart.XAxis dataKey={horizontal?undefined:"month"} type={horizontal?"number":"category"} tickLine={false} axisLine={false} tick={{fontSize:12,fill:"var(--chart-axis)"}} tickMargin={10}/>
     <Chart.YAxis dataKey={horizontal?"month":undefined} type={horizontal?"category":"number"} tickLine={false} axisLine={false} tick={{fontSize:12,fill:"var(--chart-axis)"}} width={horizontal?80:55}/>
     {r.id === "signed" && <Chart.ReferenceLine y={0} stroke="var(--chart-axis)"/>}
     {r.id === "area" && <defs><linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors[0]} stopOpacity={0.48}/><stop offset="100%" stopColor={colors[0]} stopOpacity={0.03}/></linearGradient></defs>}
     {r.keys.map((k,i) => r.family === "Line" ? <Chart.LineSeries key={k} dataKey={k} type={r.id === "steps" ? "stepAfter" : "monotone"} dot={false} strokeWidth={material === "clay" ? 5 : 3} material={material}/> : r.family === "Area" ? <Chart.AreaSeries key={k} dataKey={k} type="monotone" material={material} stackId={r.id === "stacked" ? "devices" : undefined} fill={r.id === "area" ? "url(#area-fill)" : colors[i]} fillOpacity={r.id === "area" ? 1 : .5} strokeWidth={2.5}/> : <Chart.BarSeries key={k} dataKey={k} material={material} radius={5} maxBarSize={horizontal?18:35}/>)}
     <Chart.Tooltip cursor={r.family === "Bar" ? {fill:"#a4a8be",fillOpacity:.09} : {stroke:"#8d8e9b",strokeDasharray:"3 4"}}/>
    </ChartComponent></Chart.ResponsiveContainer></div>
    <Chart.Legend aria-label={`Visible series for ${r.tag}`}/>
   </Chart.Root>
   {!visible.length && <p className="all-hidden" role="status">All series hidden. Select a legend item to show it.</p>}

   <p className="chart-context">{r.context}</p>
 </motion.article>;
}

export default function Page() {
 const { resolvedTheme, setTheme } = useTheme();
 const reduceMotion = useReducedMotion();
 const [mounted, setMounted] = useState(false);
 const [artReady, setArtReady] = useState(false);
 const artRef = useRef<HTMLImageElement>(null);
 useEffect(()=>{ if(artRef.current?.complete && artRef.current.naturalWidth > 0) setArtReady(true); },[]);
 useEffect(()=>setMounted(true),[]);
 const dark = mounted && resolvedTheme === "dark";
 useEffect(()=>{
   const color = resolvedTheme === "dark" ? "#265589" : "#438ee8";
   document.querySelectorAll('meta[name="theme-color"]').forEach(meta=>meta.setAttribute("content",color));
 },[resolvedTheme]);
 const controlMotionId=useId();
 const [family, setFamily] = useState<Family>("All");
 const [material, setMaterial] = useState<Material>("plain");
 const [palette, setPalette] = useState<Palette>("Pastel");
 const [customColors, setCustomColors] = useState<string[]>([...palettes.Pastel]);
 const [hasCustom, setHasCustom] = useState(false);
 const [paletteEditor, setPaletteEditor] = useState(false);
 const [animate, setAnimate] = useState(true);
 const [replay, setReplay] = useState(0);
 const [installCopied, setInstallCopied] = useState(false);
 const [installCopyFailed, setInstallCopyFailed] = useState(false);
 async function copyInstall() {
  try { await navigator.clipboard.writeText("npm install @kind-ui/charts"); setInstallCopied(true); setInstallCopyFailed(false); setTimeout(()=>setInstallCopied(false),1800); }
  catch { setInstallCopyFailed(true); }
 }
 useEffect(() => {
  const ctx = (document as Document & {modelContext?: {registerTool:(tool:unknown,options:unknown)=>void|Promise<void>}}).modelContext;
  if (!ctx?.registerTool) return;
  const lifecycle = new AbortController();
  const tool = {name:"configure_chart_showcase",description:"Change the chart family, finish, palette and motion in the visible Kind UI showcase.",inputSchema:{type:"object",properties:{family:{type:"string",enum:["All","Line","Area","Bar","Combo","Pie","Radar","Radial","Scatter","Heatmap","Waterfall","Sankey"]},material:{type:"string",enum:["plain","paper","clay","glow"]},palette:{type:"string",enum:["Pastel","Ink","Neon"]},animate:{type:"boolean"}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input:unknown)=>{
   if (!input || typeof input!=="object" || Array.isArray(input)) throw new Error("Expected an object");
   const v=input as Record<string,unknown>;
   if (Object.keys(v).some(k=>!["family","material","palette","animate"].includes(k)) || (v.family!==undefined&&!["All","Line","Area","Bar","Combo","Pie","Radar","Radial","Scatter","Heatmap","Waterfall","Sankey"].includes(v.family as string)) || (v.material!==undefined&&!["plain","paper","clay","glow"].includes(v.material as string)) || (v.palette!==undefined&&!["Pastel","Ink","Neon"].includes(v.palette as string)) || (v.animate!==undefined&&typeof v.animate!=="boolean")) throw new Error("Invalid showcase settings");
   if(v.family!==undefined)setFamily(v.family as Family); if(v.material!==undefined)setMaterial(v.material as Material); if(v.palette!==undefined)setPalette(v.palette as Palette); if(v.animate!==undefined)setAnimate(v.animate as boolean);
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   return {applied:v};
  }};
  try { void Promise.resolve(ctx.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{}); } catch {}
  return ()=>lifecycle.abort();
 },[]);
 const colors = palette === "Custom" ? customColors : (dark ? darkPalettes : palettes)[palette];
 const shown=recipes.filter(r=>family==="All"||r.family===family);
 return <><a className="skip-link" href="#showcase">Skip to charts</a>
 <main><section className="hero"><motion.img ref={artRef} className="hero-art" src="/hero-art.webp" alt="" width={2048} height={1365} onLoad={()=>setArtReady(true)} initial={reduceMotion ? false : {opacity:0}} animate={{opacity:artReady ? 1 : 0}} transition={{duration:reduceMotion ? 0 : 0.9,ease:"easeOut"}}/><div className="hero-bloom" aria-hidden="true"/><motion.header className="site-nav" initial={reduceMotion ? false : {opacity:0}} animate={{opacity:1}} transition={{duration:0.55,delay:0.15}}><a className="wordmark" href="#" aria-label="Kind UI Charts home"><KindLogo/><span className="wordmark-package">/charts</span></a><nav aria-label="Main"><a href={`${repo}/blob/main/packages/charts/README.md`} target="_blank" rel="noreferrer">Docs</a><a href={repo} target="_blank" rel="noreferrer">GitHub</a><button className="theme-toggle" onClick={()=>setTheme(dark ? "light" : "dark")} disabled={!mounted} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Switch to light theme" : "Switch to dark theme"}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button></nav></motion.header><div className="hero-content"><motion.h1 initial={reduceMotion ? false : {opacity:0,y:12,filter:"blur(5px)"}} animate={{opacity:1,y:0,filter:"blur(0px)"}} transition={{duration:0.8,delay:0.2,ease:"easeOut"}}><span>Bring your data</span><span>to life</span></motion.h1><motion.p initial={reduceMotion ? false : {opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.4}}>Composable charts for React.</motion.p></div></section>
 <div className="install-section"><div className="install-command"><span aria-hidden="true" className="install-prompt">$</span><code>npm install @kind-ui/charts</code><Button variant="ghost" size="icon-sm" onClick={copyInstall} aria-label={installCopied ? "Install command copied" : "Copy install command"} title={installCopied ? "Copied" : "Copy command"}>{installCopied ? <Check/> : <Copy/>}</Button></div><span className="sr-only" role="status">{installCopied ? "Install command copied" : installCopyFailed ? "Could not copy. Select the command to copy manually." : ""}</span></div>
 <section id="showcase" className="showcase">
 <Tabs value={family} onValueChange={v=>setFamily(v as Family)}><div className="family-row"><TabsList className="family-tabs" aria-label="Chart families">{families.map(f=><TabsTrigger key={f} value={f}>{f === "All" ? "All charts" : f}<span className="count" aria-hidden="true">{f==="All"?recipes.length+advancedRecipes.length+newRecipes.length:recipes.filter(r=>r.family===f).length+advancedRecipes.filter(r=>r.family===f).length+newRecipes.filter(r=>r.family===f).length}</span></TabsTrigger>)}</TabsList></div>
 <div className="toolbar"><div className="control-block"><span className="control-label">Finish</span><RadioGroup disabled={["Pie","Radar","Radial","Scatter","Sankey"].includes(family)} title="Finishes apply to line, area, bar, combo, heatmap, and waterfall" className="finish-options" value={material} onValueChange={v=>setMaterial(v as Material)} aria-label="Chart finish">{(["plain","paper","clay","glow"] as Material[]).map(m=><label key={m} className={`finish-label ${material===m?"selected":""}`}><RadioGroupItem className="sr-only" value={m}/>{material===m && <motion.span aria-hidden="true" className="control-selection" layoutId={reduceMotion?undefined:`finish-${controlMotionId}`} transition={reduceMotion?{duration:0}:{type:"spring",stiffness:430,damping:36}}/>}{m[0].toUpperCase()+m.slice(1)}</label>)}</RadioGroup></div><div className="control-block"><span className="control-label">Palette</span><RadioGroup className="palette-options" value={palette} onValueChange={v=>setPalette(v as Palette)} aria-label="Color palette">{(Object.keys(palettes) as (keyof typeof palettes)[]).map(p=><label className={`palette-label ${palette===p?"selected":""}`} key={p} title={p}><RadioGroupItem className="sr-only" value={p}/>{palette===p && <motion.span aria-hidden="true" className="control-selection" layoutId={reduceMotion?undefined:`palette-${controlMotionId}`} transition={reduceMotion?{duration:0}:{type:"spring",stiffness:430,damping:36}}/>}<span className="sr-only">{p}</span>{palettes[p].map(c=><span aria-hidden="true" key={c} style={{background:dark ? darkPalettes[p][palettes[p].indexOf(c)] : c}}/>)}</label>)}{hasCustom && <label className={`palette-label ${palette==="Custom"?"selected":""}`} title="Custom"><RadioGroupItem className="sr-only" value="Custom"/>{palette==="Custom" && <motion.span aria-hidden="true" className="control-selection" layoutId={reduceMotion?undefined:`palette-${controlMotionId}`} transition={reduceMotion?{duration:0}:{type:"spring",stiffness:430,damping:36}}/>}<span className="sr-only">Custom palette</span>{customColors.map((c,i)=><span aria-hidden="true" key={i} style={{background:c}}/>)}</label>}</RadioGroup><Popover open={paletteEditor} onOpenChange={setPaletteEditor}><PopoverTrigger className="custom-palette-button" aria-label={hasCustom ? "Edit custom palette" : "Create custom palette"}>{hasCustom ? <Pencil/> : <Plus/>}<span className="sr-only">Custom palette</span></PopoverTrigger><PopoverContent className="palette-editor"><h3>Your palette</h3>{customColors.map((c,i)=><PaletteColorInput key={i} color={c} index={i} onChange={value=>setCustomColors(v=>v.map((old,n)=>n===i?value:old))}/>)}<Button onClick={()=>{setHasCustom(true);setPalette("Custom");setPaletteEditor(false);}}>Use palette</Button></PopoverContent></Popover></div><div className="motion-control"><label htmlFor="motion">Motion</label><Switch id="motion" checked={animate} onCheckedChange={setAnimate}/><button className="replay" onClick={()=>setReplay(n=>n+1)} aria-label="Replay chart animations"><RotateCcw size={15}/><span className="sr-only">Replay</span></button></div></div>
 {families.map(f=><TabsContent key={f} value={f}><div className="chart-grid">{shown.map(r=><ChartCard key={r.id} r={r} material={material} colors={colors} animate={animate} replay={replay}/>)}{advancedRecipes.filter(r=>family==="All"||r.family===family).map(r=><AdvancedChartCard key={r.id} recipe={r} material={material} colors={colors} animate={animate} replay={replay}/>)}{newRecipes.filter(r=>family==="All"||r.family===family).map(r=><NewChartCard key={r.id} recipe={r} material={material} colors={colors} animate={animate} replay={replay}/>)}</div></TabsContent>)}
 </Tabs></section></main>
 <footer className="cloud-footer"><img className="footer-art" src="/footer-clouds.webp" alt="" width={2172} height={724} loading="lazy"/><div className="footer-bloom" aria-hidden="true"/><motion.div className="footer-inner" initial={reduceMotion?false:{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.25}} transition={{duration:.6,ease:"easeOut"}}><p className="footer-wordmark" aria-label="kind ui"><KindLogo/></p><div className="footer-bottom"><nav aria-label="Footer"><a href={`${repo}/blob/main/packages/charts/README.md`} target="_blank" rel="noreferrer">Docs</a><a href={repo} target="_blank" rel="noreferrer">GitHub</a><a href={`${repo}/blob/main/LICENSE`} target="_blank" rel="noreferrer">MIT</a></nav><a className="footer-top" href="#">Back to top</a></div></motion.div></footer></>;
}
