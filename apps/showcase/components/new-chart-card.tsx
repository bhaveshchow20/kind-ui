"use client";
import {
  BoxPlotChart,
  CandlestickChart,
  Cell,
  computeWaterfallData,
  createHeatmapScale,
  HeatmapChart,
  type HistogramBin,
  HistogramChart,
  LineChart,
  ReferenceLine,
  SankeyChart,
  WaterfallChart,
  type WaterfallDatum,
} from "@kind-ui/charts";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import type { Finish } from "@/lib/advanced-chart-recipes";
import type { DemoOptions } from "@/lib/demo-options";
import {
  type BoxRow,
  boxRows,
  type CandlestickSample,
  candlestickRows,
  conversionData,
  heatmapData,
  histogramBins,
  type NewRecipe,
  sankeyData,
  waterfallEntries,
} from "@/lib/new-chart-recipes";
import { demoEntry } from "@/lib/utils";

function NewChart({
  recipe: r,
  material,
  colors,
  animate,
  entranceKey,
  options = {},
}: {
  recipe: NewRecipe;
  material: Finish;
  colors: string[];
  animate: boolean;
  entranceKey: string;
  options?: DemoOptions;
}) {
  const [candleSelection, setCandleSelection] = useState<CandlestickSample["time"] | null>(null);
  const bins = useMemo(() => histogramBins(r.id), [r.id]);
  const rows = useMemo(() => boxRows(r.id), [r.id]);
  const heat = useMemo(() => heatmapData(r.id), [r.id]);
  const water = useMemo(() => computeWaterfallData(waterfallEntries(r.id)), [r.id]);
  const flow = useMemo(() => sankeyData(r.id), [r.id]);
  const scale = useMemo(
    () => (r.family === "Heatmap" ? createHeatmapScale({ domain: [0, heat.max], colors }) : null),
    [r.family, heat.max, colors],
  );
  if (r.family === "Candlestick") {
    return (
      <>
        <CandlestickChart
          key={entranceKey}
          data={candlestickRows}
          selection={candleSelection}
          onSelectionChange={(point) => setCandleSelection(point?.time ?? null)}
          timeMode="business-date"
          spacing="ordinal"
          config={{
            price: { label: "Synthetic executions · USD/share", color: demoEntry(colors, 0) },
            volume: { label: "Volume · shares", color: demoEntry(colors, 2) },
          }}
          frameProps={{ className: "chart-root" }}
          style={{ width: "100%", height: 240 }}
          animate={animate}
          aria-label="Synthetic session trade OHLC in USD per share, volume in shares"
          margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
          formatTime={(time) => String(time).slice(5)}
          formatPrice={(value) => `$${value.toFixed(2)}`}
          formatVolume={(value) => `${value.toLocaleString("en-US")} shares`}
        >
          {options.showGrid !== false && (
            <CandlestickChart.Grid
              vertical={false}
              stroke="var(--chart-grid, #e5e7eb)"
              strokeDasharray="3 5"
            />
          )}
          <CandlestickChart.XAxis
            tickLine={false}
            axisLine={false}
            tickCount={5}
            tick={options.showLabels === false ? false : { fontSize: 11 }}
          />
          <CandlestickChart.YAxis
            width="auto"
            tickLine={false}
            axisLine={false}
            tick={options.showLabels === false ? false : { fontSize: 11 }}
            tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
          />
          <CandlestickChart.Series
            seriesKey="price"
            rising={demoEntry(colors, 0)}
            falling={demoEntry(colors, 1)}
            unchanged={demoEntry(colors, 2)}
            maxBarSize={options.width ?? 14}
            markProps={{ strokeWidth: options.strokeWidth ?? 1.5 }}
          />
          <CandlestickChart.Volume
            seriesKey="volume"
            maxBarSize={options.width ?? 14}
            fillOpacity={1}
            axisProps={{ hide: true }}
          />
          <CandlestickChart.Crosshair stroke="var(--chart-axis, #64748b)" />
          <CandlestickChart.Tooltip />
          <CandlestickChart.Content className="sr-only" />
        </CandlestickChart>
        <div className="sr-only">
          <table data-kind-ui="candlestick-data-alternative">
            <caption>
              Synthetic executions: daily OHLC in USD per share and volume in shares
            </caption>
            <thead>
              <tr>
                {["Session", "Open", "High", "Low", "Close", "Volume", "Source"].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candlestickRows.map((row) => (
                <tr key={row.time} data-selected={row.time === candleSelection || undefined}>
                  <th scope="row">{String(row.time).slice(5)}</th>
                  {(["open", "high", "low", "close"] as const).map((field) => (
                    <td key={field}>
                      {row[field] === undefined ? "—" : `$${row[field].toFixed(2)}`}
                    </td>
                  ))}
                  <td>
                    {row.volume === undefined
                      ? "—"
                      : `${row.volume.toLocaleString("en-US")} shares`}
                  </td>
                  <td>{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  if (r.family === "Line") {
    return (
      <LineChart
        key={entranceKey}
        data={conversionData}
        config={{
          trials: { label: "Trial starts", color: demoEntry(colors, 0) },
          paid: { label: "Paid conversions", color: demoEntry(colors, 1) },
        }}
        frameProps={{ className: "chart-root" }}
        responsive
        style={{ width: "100%", height: 280 }}
        animate={animate}
        aria-label={r.tag}
      >
        {options.showGrid !== false && (
          <LineChart.Grid stroke="var(--chart-grid)" vertical={false} strokeDasharray="3 5" />
        )}
        <LineChart.XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <LineChart.YAxis width="auto" tick={{ fontSize: 11 }} />
        <LineChart.Series
          seriesKey="trials"
          dataKey="trials"
          material={material}
          type={options.curve ?? "monotone"}
          dot={options.dots ?? false}
          strokeWidth={options.strokeWidth ?? 3}
        />
        <LineChart.Series
          seriesKey="paid"
          dataKey="paid"
          material={material}
          type={options.curve ?? "monotone"}
          dot={options.dots ?? false}
          strokeWidth={options.strokeWidth ?? 3}
        />
        <LineChart.Tooltip {...(animate ? { valueAnimation: "shuffle" as const } : {})} />
        {options.showLegend !== false && <LineChart.Legend />}
      </LineChart>
    );
  }
  if (r.family === "Histogram") {
    const latency = r.id === "histogram-latency";
    const density = options.density ?? latency;
    return (
      <HistogramChart
        key={entranceKey}
        config={{
          count: {
            label: density ? "Density" : latency ? "Requests" : "Orders",
            color: demoEntry(colors, 0),
          },
        }}
        frameProps={{ className: "chart-root" }}
        className="chart-canvas"
        interaction={{ kind: "series", mode: "focus", eligibleKeys: ["count"] }}
        bins={bins}
        measure={density ? "density" : "count"}
        animate={animate}
        aria-label={r.tag}
        margin={{ top: 16, right: 12, left: 0, bottom: 8 }}
      >
        <HistogramChart.XAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => (latency ? `${value} ms` : `$${value}`)}
        />
        <HistogramChart.YAxis
          width="auto"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          {...(density ? { tickFormatter: (value: number) => value.toFixed(3) } : {})}
        />
        {options.showGrid !== false && (
          <HistogramChart.Grid
            horizontal={options.showGrid ?? true}
            vertical={false}
            stroke="var(--chart-grid)"
            strokeDasharray="3 5"
          />
        )}
        <HistogramChart.Series
          material={material}
          stroke={options.binBorders === false ? "none" : "var(--background)"}
          strokeWidth={1.5}
        />
        <HistogramChart.Tooltip
          {...(animate ? { valueAnimation: "shuffle" as const } : {})}
          labelFormatter={(_label, entries) => {
            const bin = entries[0]?.payload as HistogramBin | undefined;
            return bin ? `${bin.lower}–${bin.upper} ${latency ? "ms" : "USD"}` : "";
          }}
          formatter={(value) => [
            density ? Number(value).toFixed(4) : String(value),
            density
              ? latency
                ? "Density per ms"
                : "Density per dollar"
              : latency
                ? "Requests"
                : "Orders",
          ]}
        />
        {options.showLegend !== false && <HistogramChart.Legend />}
      </HistogramChart>
    );
  }
  if (r.family === "Box Plot") {
    const horizontal = r.id === "box-regions";
    return (
      <BoxPlotChart
        key={entranceKey}
        config={{
          spread: {
            label: horizontal ? "Weekly growth" : "Request time",
            color: demoEntry(colors, 0),
          },
        }}
        frameProps={{ className: "chart-root" }}
        className="chart-canvas"
        interaction={{
          kind: "series",
          mode: "focus",
          eligibleKeys: ["spread"],
        }}
        data={rows}
        layout={horizontal ? "vertical" : "horizontal"}
        animate={animate}
        aria-label={r.tag}
        margin={{ top: 16, right: 12, left: 0, bottom: 8 }}
      >
        {options.showGrid !== false && (
          <BoxPlotChart.Grid
            vertical={horizontal && (options.showGrid ?? true)}
            horizontal={!horizontal && (options.showGrid ?? true)}
            stroke="var(--chart-grid)"
            strokeDasharray="3 5"
          />
        )}
        <BoxPlotChart.XAxis
          type={horizontal ? "number" : "category"}
          {...(horizontal
            ? {
                domain: ["dataMin", "dataMax"],
                tickFormatter: (value: number) => `${value} pp`,
              }
            : { dataKey: "category" })}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <BoxPlotChart.YAxis
          width="auto"
          type={horizontal ? "category" : "number"}
          {...(horizontal
            ? { dataKey: "category" }
            : {
                domain: [0, "dataMax"],
                tickFormatter: (value: number) => `${value} ms`,
              })}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <ReferenceLine {...(horizontal ? { x: 0 } : { y: 0 })} stroke="var(--chart-axis)" />
        <BoxPlotChart.Series<BoxRow>
          strokeWidth={options.strokeWidth ?? 3}
          dataKey="summary"
          seriesKey="spread"
          barSize={options.width ?? 32}
          outlierRadius={options.outlierRadius ?? 3}
          material={material}
          fillOpacity={0.65}
        />
        <BoxPlotChart.Tooltip
          {...(animate ? { valueAnimation: "shuffle" as const } : {})}
          formatter={(_value, _name, item) => [
            String((item.payload as BoxRow).summary.median) + (horizontal ? " pp" : " ms"),
            "Median",
          ]}
        />
        {options.showLegend !== false && <BoxPlotChart.Legend />}
      </BoxPlotChart>
    );
  }
  if (r.family === "Heatmap" && scale)
    return (
      <HeatmapChart
        key={entranceKey}
        config={{}}
        aria-label={r.tag}
        className="showcase-heatmap"
        rows={heat.rows}
        columns={heat.columns}
        data={heat.data}
        scale={scale}
        animate={animate}
        formatValue={(value) => (r.id === "heatmap-retention" ? `${value}%` : String(value))}
      >
        <HeatmapChart.Grid
          caption={r.tag}
          material={material}
          layout={{
            gap: options.gap ?? 4,
            rowLabels: options.showLabels === false ? "hidden" : "visible",
            columnLabels: options.showLabels === false ? "hidden" : "visible",
          }}
          cellProps={() => ({ style: { borderRadius: options.radius ?? 5 } })}
          {...(!(options.showValues ?? r.id === "heatmap-retention") ? { Cell: () => null } : {})}
        />
        {options.showLegend !== false && (
          <HeatmapChart.Legend label={r.id === "heatmap-retention" ? "Active users" : "Tickets"} />
        )}
        <HeatmapChart.Tooltip {...(animate ? { valueAnimation: "shuffle" as const } : {})} />
      </HeatmapChart>
    );
  if (r.family === "Waterfall")
    return (
      <WaterfallChart
        key={entranceKey}
        config={{ range: { label: "Balance", color: demoEntry(colors, 0) } }}
        frameProps={{ className: "chart-root" }}
        className="chart-canvas"
        data={water}
        animate={animate}
        accessibilityLayer
        aria-label={r.tag}
        margin={{ top: 20, right: 12, left: 0, bottom: 0 }}
      >
        {options.showGrid !== false && (
          <WaterfallChart.Grid
            horizontal={options.showGrid ?? true}
            vertical={false}
            stroke="var(--chart-grid)"
            strokeDasharray="3 5"
          />
        )}
        <WaterfallChart.XAxis
          dataKey="id"
          tickFormatter={(id) => water.find((row) => row.id === id)?.label ?? String(id)}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <WaterfallChart.YAxis
          width="auto"
          tickFormatter={(value) => `$${value / 1000}k`}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <ReferenceLine y={0} stroke="var(--chart-axis)" />
        {(options.connectors ?? true) && (
          <WaterfallChart.Connectors data={water} stroke="var(--chart-axis)" />
        )}
        <WaterfallChart.Series
          material={material}
          radius={options.radius ?? 4}
          maxBarSize={options.width ?? 35}
        >
          {water.map((row) => (
            <Cell
              key={row.id}
              fill={demoEntry(colors, row.kind !== "delta" ? 0 : (row.value ?? 0) < 0 ? 2 : 1)}
            />
          ))}
        </WaterfallChart.Series>
        <WaterfallChart.Tooltip
          formatter={(_value, _name, item) => {
            const row = item.payload as WaterfallDatum;
            return [`$${row.value?.toLocaleString("en-US")}`, row.label];
          }}
        />
      </WaterfallChart>
    );

  return (
    <SankeyChart
      key={entranceKey}
      frameProps={{ className: "showcase-sankey" }}
      className="chart-canvas"
      config={Object.fromEntries(
        flow.nodes.map((node, index) => [
          node.id,
          { label: node.name, color: demoEntry(colors, index % colors.length) },
        ]),
      )}
      aria-label={r.tag}
      data={flow}
      animate={animate}
      nodeWidth={options.nodeWidth ?? 12}
      nodePadding={options.nodePadding ?? 24}
      margin={{ top: 12, bottom: 12, left: 65, right: 85 }}
    >
      <SankeyChart.Nodes
        render={(props) => (
          <g>
            <SankeyChart.Node {...props} color={demoEntry(colors, props.index % colors.length)} />
            {options.showLabels !== false && (
              <text
                x={props.x < 100 ? props.x - 8 : props.x + props.width + 8}
                y={props.y + props.height / 2}
                textAnchor={props.x < 100 ? "end" : "start"}
                dominantBaseline="middle"
                fill="currentColor"
                fontSize={11}
              >
                {props.payload.name}
              </text>
            )}
          </g>
        )}
      />
      <SankeyChart.Links
        render={(props) => (
          <SankeyChart.Link
            {...props}
            material="gradient"
            color={demoEntry(
              colors,
              flow.nodes.findIndex((node) => node.id === props.payload.source.id) % colors.length,
            )}
            targetColor={demoEntry(
              colors,
              flow.nodes.findIndex((node) => node.id === props.payload.target.id) % colors.length,
            )}
            pathProps={{ opacity: options.linkOpacity ?? 0.45 }}
          />
        )}
      />
      <SankeyChart.Table caption={r.tag} className="sr-only" />
    </SankeyChart>
  );
}
export function NewChartCard({
  recipe,
  material,
  colors,
  animate,
  replay,
  options = {},
}: {
  recipe: NewRecipe;
  material: Finish;
  colors: string[];
  animate: boolean;
  replay: number;
  options?: DemoOptions;
}) {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const entered = useInView(cardRef, { once: true, amount: 0.3 });
  const chartAnimate = animate && entered && !reduced;
  return (
    <motion.article
      ref={cardRef}
      className="chart-card"
      initial={reduced ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="card-top">
        <h3 className="chart-tag">{recipe.tag}</h3>
      </div>
      {recipe.family === "Candlestick" && (
        <div className="chart-summary">
          <strong>$206.40</strong>
          <span>USD/share · synthetic executions</span>
        </div>
      )}
      <NewChart
        entranceKey={`${replay}-${chartAnimate}`}
        recipe={recipe}
        material={material}
        colors={colors}
        animate={chartAnimate}
        options={options}
      />
      <p className="chart-context">{recipe.context}</p>
    </motion.article>
  );
}
