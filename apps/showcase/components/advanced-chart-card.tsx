"use client";
import * as Chart from "@kind-ui/charts";
import { Check, Copy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  type AdvancedRecipe,
  advancedCode,
  advancedData,
  type Finish,
} from "@/lib/advanced-chart-recipes";

export { advancedRecipes } from "@/lib/advanced-chart-recipes";

function renderChartExample({
  recipe: r,
  material,
  config,
  visible,
  animate,
  replay,
}: {
  recipe: AdvancedRecipe;
  material: Finish;
  config: Chart.SeriesConfig;
  visible: string[];
  animate: boolean;
  replay: number;
}) {
  const data = advancedData(r.id);
  const pieData = data
    .filter((row) => visible.includes(String(row.id)))
    .map((row) => ({
      id: String(row.id),
      value: Number(row.value),
      fill: config[String(row.id)]?.color,
    }));
  if (r.family === "Combo")
    return (
      <Chart.ComboChart
        key={replay}
        data={data}
        animate={animate}
        accessibilityLayer
        aria-label={r.tag}
        margin={{ top: 20, right: 18, left: -15, bottom: 0 }}
      >
        <Chart.CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" />
        <Chart.XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <Chart.YAxis
          tickLine={false}
          axisLine={false}
          width={55}
          tickFormatter={(value) => (r.id === "combo" ? `$${value / 1000}k` : `${value} TB`)}
        />
        {r.id === "combo" ? (
          <Chart.BarSeries dataKey="a" radius={4} maxBarSize={28} material={material} />
        ) : (
          <Chart.AreaSeries dataKey="a" type="monotone" fillOpacity={0.2} material={material} />
        )}
        <Chart.LineSeries
          dataKey="b"
          type="monotone"
          material={material}
          strokeDasharray="4 4"
          dot={false}
          strokeWidth={2.5}
        />
        <Chart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
      </Chart.ComboChart>
    );
  if (r.family === "Pie")
    return (
      <Chart.PieChart key={replay} animate={animate} accessibilityLayer aria-label={r.tag}>
        <Chart.PieSeries
          data={pieData}
          dataKey="value"
          nameKey="id"
          innerRadius={r.id === "donut" ? "54%" : 0}
          outerRadius="85%"
          paddingAngle={0}
        />
        <Chart.Tooltip
          itemKey={(entry) => String(entry.payload.id)}
          valueAnimation={animate ? "shuffle" : undefined}
        />
      </Chart.PieChart>
    );
  if (r.family === "Radar")
    return (
      <Chart.RadarChart
        key={replay}
        data={data}
        animate={animate}
        accessibilityLayer
        aria-label={r.tag}
        outerRadius="70%"
      >
        <Chart.PolarGrid
          gridType={r.id === "radar-outline" ? "circle" : "polygon"}
          stroke="var(--chart-grid)"
        />
        <Chart.PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} />
        <Chart.PolarRadiusAxis
          domain={[0, 100]}
          tickCount={3}
          tick={{ fontSize: 10 }}
          axisLine={false}
        />
        {r.id === "radar-range" ? (
          <Chart.RadarSeries dataKey="range" seriesKey="a" isRange fillOpacity={0.2} />
        ) : (
          <>
            <Chart.RadarSeries
              dataKey="a"
              fillOpacity={r.id === "radar-outline" ? 0 : 0.18}
              dot={r.id === "radar-outline"}
            />
            <Chart.RadarSeries
              dataKey="b"
              fill="none"
              strokeDasharray="4 4"
              dot={r.id === "radar-outline"}
            />
          </>
        )}
        <Chart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
      </Chart.RadarChart>
    );
  if (r.family === "Radial")
    return (
      <Chart.RadialBarChart
        key={replay}
        data={data}
        animate={animate}
        accessibilityLayer
        aria-label={r.tag}
        startAngle={r.id === "gauge" ? 180 : 90}
        endAngle={r.id === "gauge" ? 0 : -270}
        innerRadius={r.id === "gauge" ? "55%" : "20%"}
        outerRadius="90%"
        cy={r.id === "gauge" ? "65%" : "50%"}
        barGap={3}
      >
        <Chart.PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <Chart.PolarRadiusAxis
          type="category"
          dataKey="category"
          tick={false}
          axisLine={false}
          tickLine={false}
        >
          {r.id === "gauge" && <Chart.Label position="center" value="72%" fill="currentColor" />}
        </Chart.PolarRadiusAxis>
        <Chart.RadialBarSeries
          dataKey="a"
          background
          cornerRadius={4}
          stackId={r.id === "radial-stacked" ? "work" : undefined}
        >
          {r.id !== "gauge" && (
            <Chart.LabelList
              dataKey="category"
              fill="white"
              content={<Chart.RadialBarLabel fontSize={10} />}
            />
          )}
        </Chart.RadialBarSeries>
        {r.id !== "gauge" && (
          <Chart.RadialBarSeries
            dataKey="b"
            fillOpacity={0.5}
            cornerRadius={4}
            stackId={r.id === "radial-stacked" ? "work" : undefined}
          />
        )}
        <Chart.Tooltip valueAnimation={animate ? "shuffle" : undefined} />
      </Chart.RadialBarChart>
    );
  return (
    <Chart.ScatterChart
      key={replay}
      animate={animate}
      accessibilityLayer
      aria-label={r.tag}
      margin={{ top: 20, right: 18, left: -10, bottom: 10 }}
    >
      <Chart.CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 5" />
      <Chart.XAxis
        dataKey="x"
        type="number"
        name={r.id === "bubble" ? "Traffic" : "Ad spend"}
        unit={r.id === "bubble" ? " req/s" : " USD"}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11 }}
      />
      <Chart.YAxis
        dataKey="y"
        type="number"
        name={r.id === "bubble" ? "Latency" : "Conversions"}
        unit={r.id === "bubble" ? " ms" : ""}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 11 }}
      />
      {r.id === "bubble" && <Chart.ZAxis dataKey="z" name="Requests" range={[50, 340]} />}
      <Chart.ScatterSeries data={data} seriesKey="a" shape="circle" />
      {r.id !== "bubble" && (
        <Chart.ScatterSeries
          data={data.map((row) => ({ ...row, y: row.social }))}
          seriesKey="b"
          shape="diamond"
        />
      )}
      <Chart.ScatterTooltip
        zDimension={r.id === "bubble" ? { dataKey: "z", name: "Requests" } : undefined}
        valueAnimation={animate ? "shuffle" : undefined}
      />
    </Chart.ScatterChart>
  );
}
function ChartExample(props: Parameters<typeof renderChartExample>[0]) {
  return (
    <Chart.ResponsiveContainer width="100%" height="100%" minWidth={0}>
      {renderChartExample(props)}
    </Chart.ResponsiveContainer>
  );
}
export function AdvancedChartCard({
  recipe,
  material,
  colors,
  animate,
  replay,
}: {
  recipe: AdvancedRecipe;
  material: Finish;
  colors: string[];
  animate: boolean;
  replay: number;
}) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState<string[]>([...recipe.keys]);
  const [copied, setCopied] = useState(false);
  const config: Chart.SeriesConfig = Object.fromEntries(
    recipe.keys.map((k, i) => [
      k,
      {
        label: recipe.labels[i],
        color: colors[i],
        ...(recipe.id === "scatter" ? { legendShape: i === 0 ? "circle" : "diamond" } : {}),
      },
    ]),
  );
  const code = advancedCode(recipe, material, colors, animate);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return (
    <motion.article
      className="chart-card"
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="card-top">
        <h3 className="chart-tag">{recipe.tag}</h3>
        <div className="card-code-actions">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={copy}
            aria-label={`Copy code for ${recipe.tag}`}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
          <span className="action-divider" />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" aria-label="View chart code">
                Code
              </Button>
            </DialogTrigger>
            <DialogContent className="code-dialog">
              <DialogTitle className="sr-only">{recipe.tag} code</DialogTitle>
              <DialogDescription className="sr-only">
                A complete Kind UI chart example with the current palette and animation settings.
              </DialogDescription>
              <div className="code-block-header">
                <span className="code-file">
                  <span className="typescript-badge">TS</span>chart-{recipe.id}.tsx
                </span>
                <Button variant="ghost" size="icon-sm" onClick={copy} aria-label="Copy code">
                  {copied ? <Check /> : <Copy />}
                </Button>
              </div>
              <CodeBlock code={code} />
              <div className="code-block-note sr-only">
                Requires the built @kind-ui/charts workspace package.
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Chart.Root
        className="chart-root"
        emphasis="auto"
        config={config}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <div className="chart-canvas">
          <ChartExample
            recipe={recipe}
            material={material}
            config={config}
            visible={visible}
            animate={animate}
            replay={replay}
          />
        </div>
        <Chart.Legend aria-label={`Visible series for ${recipe.tag}`} />
      </Chart.Root>
      {visible.length === 0 && (
        <p className="all-hidden" role="status">
          All series hidden. Select a legend item to show it.
        </p>
      )}
      <p className="chart-context">{recipe.context}</p>
    </motion.article>
  );
}
