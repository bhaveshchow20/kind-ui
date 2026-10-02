import * as Chart from "@kind-ui/charts";
import { useId, useState } from "react";
import { createRoot } from "react-dom/client";
import { Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import "@kind-ui/charts/styles.css";
import "./glass.css";

const palette = ["var(--p1)", "var(--p2)", "var(--p3)"] as const;
const data = [36, 24, 18, 8, 1].map((value, i) => ({
  name: ["Build", "Search", "Chat", "Mail", "Tiny"][i],
  value,
}));
const config = { value: { label: "Tasks", color: palette[0] } };
const scale = Chart.createHeatmapScale({ domain: [0, 100], colors: ["#e1ecff", "#275bba"] });

/** Example-owned SVG finish. Never blur or displace SourceGraphic. Final atop preserves
 * source alpha × material factor; native opacity is applied by the host exactly once. */
function GlassFilter({ id, factor = 0.65 }: { id: string; factor?: number }) {
  return (
    <defs>
      <filter id={id} x="-1%" y="-1%" width="102%" height="102%" colorInterpolationFilters="sRGB">
        <feComponentTransfer in="SourceGraphic" result="body">
          <feFuncA type="linear" slope={factor} />
        </feComponentTransfer>
        <feComponentTransfer in="SourceAlpha" result="footprint">
          <feFuncA type="linear" slope={100000} />
        </feComponentTransfer>
        <feMorphology in="footprint" operator="erode" radius={0.7} result="inside" />
        <feComposite in="footprint" in2="inside" operator="out" result="edge" />
        <feFlood floodColor="#12223b" floodOpacity={0.25} />
        <feComposite in2="edge" operator="in" result="boundary" />
        <feComposite in="boundary" in2="body" operator="atop" result="bounded" />
        <feOffset in="footprint" dx={0} dy={1.3} result="lower" />
        <feComposite in="footprint" in2="lower" operator="out" result="upper" />
        <feFlood floodColor="#fff" floodOpacity={0.7} />
        <feComposite in2="upper" operator="in" result="shine" />
        <feComposite in="shine" in2="bounded" operator="atop" />
      </filter>
    </defs>
  );
}
function Bars({ glass, dense = false }: { glass: boolean; dense?: boolean }) {
  const id = `glass-bar-${useId().replace(/:/g, "_")}`;
  const sample = dense
    ? Array.from({ length: 180 }, (_, i) => ({ name: String(i), value: 1 + ((i * 17) % 40) }))
    : data;
  return (
    <Chart.Root config={config}>
      <ResponsiveContainer width="100%" height={210}>
        <Chart.BarChart
          data={sample}
          animate={false}
          accessibilityLayer
          aria-label={`${glass ? "Glass" : "Plain"} task bars`}
          margin={{ top: 12, right: 6, bottom: 0, left: -28 }}
        >
          <GlassFilter id={id} />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--ink)", fontSize: 11 }}
            interval={dense ? 35 : 0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 40]}
            tick={{ fill: "var(--ink)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Chart.BarSeries
            dataKey="value"
            fill={palette[0]}
            radius={[5, 5, 0, 0]}
            {...(glass ? { filter: `url(#${id})` } : {})}
          />
          <Chart.Tooltip
            content={(tooltip) => (
              <Chart.TooltipContent tooltip={tooltip} className={glass ? "frost" : "plain-tip"} />
            )}
          />
        </Chart.BarChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
function Donut({ glass }: { glass: boolean }) {
  const id = `glass-pie-${useId().replace(/:/g, "_")}`;
  return (
    <Chart.Root config={config}>
      <ResponsiveContainer width="100%" height={210}>
        <Chart.PieChart
          animate={false}
          accessibilityLayer
          aria-label={`${glass ? "Glass" : "Plain"} task donut`}
        >
          <GlassFilter id={id} />
          <Chart.PieSeries
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={86}
            paddingAngle={3}
            cornerRadius={4}
            {...(glass ? { filter: `url(#${id})` } : {})}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={palette[i % palette.length] ?? palette[0]} />
            ))}
          </Chart.PieSeries>
          <Chart.Tooltip
            content={(tooltip) => (
              <Chart.TooltipContent
                tooltip={{ ...tooltip, label: tooltip.payload[0]?.name ?? "" }}
                className={glass ? "frost" : "plain-tip"}
              />
            )}
          />
        </Chart.PieChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
function Ramp({ glass }: { glass: boolean }) {
  const columns = ["0", "25", "50", "75", "100"];
  return (
    <Chart.HeatmapChart
      rows={["Score"]}
      columns={columns}
      data={columns.map((c) => ({ row: "Score", column: c, value: +c }))}
      scale={scale}
    >
      <Chart.HeatmapGrid
        caption="Quantitative color · exact centers"
        className={glass ? "glass-ramp" : ""}
      />
      <Chart.HeatmapTooltip className={glass ? "frost" : "plain-tip"} />
    </Chart.HeatmapChart>
  );
}
function AlphaProbe() {
  const id = `alpha-${useId().replace(/:/g, "_")}`;
  return (
    <svg width="240" height="45" aria-label="Alpha probes: none, zero, quarter, half, one">
      <GlassFilter id={id} />
      {["none", "#275bba00", "#275bba40", "#275bba80", "#275bba"].map((fill, i) => (
        <rect
          key={fill}
          data-alpha={fill}
          x={i * 46}
          y={6}
          width={36}
          height={30}
          fill={fill}
          opacity={0.8}
          filter={`url(#${id})`}
        />
      ))}
    </svg>
  );
}
function App() {
  const query = new URLSearchParams(location.search);
  const [dark, setDark] = useState(query.get("theme") === "dark");
  const [fallback, setFallback] = useState(query.has("fallback"));
  const [dense, setDense] = useState(query.has("dense"));
  const mode = query.get("mode");
  return (
    <main data-theme={dark ? "dark" : "light"} data-fallback={fallback}>
      <header>
        <span className="eyebrow">KIND UI / MATERIAL LAB</span>
        <h1>Glass, with honest edges.</h1>
        <p>Experimental fifth finish · identical geometry and palette</p>
        <div className="controls">
          <button type="button" onClick={() => setDark(!dark)}>
            Switch to {dark ? "light" : "dark"}
          </button>
          <button type="button" aria-pressed={fallback} onClick={() => setFallback(!fallback)}>
            Opaque fallback
          </button>
          <button type="button" aria-pressed={dense} onClick={() => setDense(!dense)}>
            Dense sample
          </button>
        </div>
      </header>
      <div className="comparison">
        {[false, true]
          .filter((glass) => (mode ? glass === (mode === "glass") : true))
          .map((glass) => (
            <section key={String(glass)} className="panel" data-finish={glass ? "glass" : "plain"}>
              <div className="panel-heading">
                <h2>{glass ? "Glass" : "Plain"}</h2>
                <span className={glass && !fallback ? "alpha-label" : undefined}>
                  {glass && !fallback ? "Body α × 0.65" : "Native paint"}
                </span>
                {glass && !fallback ? (
                  <span className="preference-label">Native paint fallback</span>
                ) : null}
              </div>
              <h3>Bar / task volume</h3>
              <Bars glass={glass} dense={dense} />
              <h3>Donut / task mix</h3>
              <Donut glass={glass} />
              <div className="legend">
                {data.map((d, i) => (
                  <span key={d.name}>
                    <i style={{ background: palette[i % palette.length] }} />
                    {d.name}
                  </span>
                ))}
              </div>
              <h3>Thin line / 1 px · factor 1</h3>
              <svg
                viewBox="0 0 260 32"
                role="img"
                aria-label="Crisp one pixel line; unchanged paint"
              >
                <title>Thin strokes retain exact paint</title>
                <path
                  d="M5 26 L55 18 L100 21 L160 8 L205 15 L255 4"
                  fill="none"
                  stroke={palette[0]}
                  strokeWidth={1}
                />
              </svg>
              <Ramp glass={glass} />
            </section>
          ))}
      </div>
      <aside className="truth">
        <strong>Two different effects.</strong> SVG marks use translucent paint, a crisp boundary
        and an inset upper highlight. HTML tooltips blur the real backdrop. Flat backgrounds
        naturally show less blur. No refraction or data-path blur.
      </aside>
      <details>
        <summary>Data and alpha contract</summary>
        <p>
          Build 36 · Search 24 · Chat 18 · Mail 8 · Tiny 1. Bar domain 0–40; donut radii 52/86, 3°
          gaps, 4 px corners. Heatmap centers preserve the scale color.
        </p>
        <p>
          Alpha probes: none / zero / quarter / half / one, all at consumer opacity 0.8. Custom
          paints remain consumer-owned.
        </p>
        <table>
          <caption>Bar sample — all values</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Tasks</th>
            </tr>
          </thead>
          <tbody>
            {(dense
              ? Array.from({ length: 180 }, (_, i) => ({
                  name: String(i),
                  value: 1 + ((i * 17) % 40),
                }))
              : data
            ).map((d) => (
              <tr key={d.name}>
                <th scope="row">{d.name}</th>
                <td>{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <AlphaProbe />
      </details>
    </main>
  );
}
createRoot(document.getElementById("root") as HTMLElement).render(<App />);
