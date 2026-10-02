import * as Chart from "@kind-ui/charts";
import { memo, type ReactNode, useMemo, useState } from "react";
import * as Area from "./area-recipes";
import * as Bar from "./bar-recipes";
import * as Line from "./line-recipes";
import { Allocation } from "./pie-recipes";
import { PolarGalleryCard } from "./polar-gallery";
import { type PolarRecipe, PolarRecipeCard } from "./polar-recipes";
import type { Example, Family } from "./showcase-data";

export type Finish = "plain" | "paper" | "clay" | "glow";
const entrance = { revealDurationMs: 450 };
const format = (unit: string) => (value: number) => `${value.toLocaleString()} ${unit}`;
// This adapter only supplies data and controls to maintained recipe compositions.
// Geometry, native overrides, interaction, and recipe corrections have one source.
export const FeatureChart = memo(function FeatureChart({
  family,
  example,
  material,
  animate,
}: {
  family: Family;
  example: Example;
  material: Finish;
  animate: boolean;
}) {
  const data = useMemo(
    () => example.data.map((point) => ({ period: point.period, value: point.primary })),
    [example],
  );
  const bars = useMemo(
    () => example.data.map((point) => ({ category: point.period, value: point.primary })),
    [example],
  );
  const pairs = useMemo(
    () =>
      example.data.map((point) => ({
        category: point.period,
        primary: point.primary,
        secondary: point.secondary,
      })),
    [example],
  );
  const complete = useMemo(
    () =>
      example.data.map((point) => ({
        category: point.period,
        primary: point.primary ?? 0,
        secondary: point.secondary ?? 0,
      })),
    [example],
  );
  const areas = useMemo(
    () =>
      example.data.map((point) => ({
        period: point.period,
        desktop: point.primary ?? 0,
        mobile: point.secondary ?? 0,
      })),
    [example],
  );
  const comparison = useMemo(
    () =>
      example.data.map((point) => ({
        period: point.period,
        current: point.primary,
        previous: point.secondary,
      })),
    [example],
  );
  const [visible, setVisible] = useState<string[]>(["current", "previous"]);
  const common = {
    label: `${example.title} ${family} chart`,
    formatValue: format(example.unit),
    material,
  };
  const motion = animate ? entrance : undefined;
  const config = {
    primary: {
      label: example.label,
      color: "var(--chart-1)",
      formatValue: (value: unknown) =>
        typeof value === "number" ? format(example.unit)(value) : "No data",
    },
    secondary: {
      label: example.second ?? "Comparison",
      color: "var(--chart-2)",
      formatValue: (value: unknown) =>
        typeof value === "number" ? format(example.unit)(value) : "No data",
    },
  };
  const [labels, setLabels] = useState(true);
  const [tooltips, setTooltips] = useState(true);
  const polar = useMemo(
    () =>
      example.data.map((point, index) => ({
        category: ["Design", "Speed", "Access", "Quality", "Coverage", "Support"][index] ?? "Score",
        actual: point.primary ?? 0,
        target: point.secondary ?? 80,
        range: [
          Math.max(0, (point.primary ?? 0) - 12),
          point.secondary ?? Math.min(100, (point.primary ?? 0) + 15),
        ] as [number, number],
      })),
    [example],
  );
  if (family === "pie") {
    const categories = ["research", "delivery", "support", "planning"];
    const colors = [
      "var(--chart-1)",
      "var(--chart-2)",
      "color-mix(in oklch, var(--chart-1) 65%, var(--card))",
      "color-mix(in oklch, var(--chart-2) 65%, var(--card))",
    ];
    const config: Chart.SeriesConfig = Object.fromEntries(
      categories.map((key, i) => [
        key,
        {
          label: ["Research", "Delivery", "Support", "Planning"][i] ?? key,
          color: colors[i] ?? "var(--chart-1)",
          formatValue: (value: unknown) => `${value} hours`,
        },
      ]),
    );
    const rows = example.data.map((point, i) => ({
      id: categories[i] ?? String(i),
      hours: point.primary ?? 0,
    }));
    return (
      <div className="gallery-chart">
        <Allocation config={config} rows={rows} donut={example.id === "donut"} animate={animate} />
      </div>
    );
  }
  if (family === "radar" || family === "radial") {
    const recipe = example.title as PolarRecipe;
    return (
      <div className="gallery-chart polar-example">
        <div className="polar-options">
          <label>
            <input
              type="checkbox"
              checked={labels}
              onChange={(event) => setLabels(event.target.checked)}
            />{" "}
            Labels
          </label>
          <label>
            <input
              type="checkbox"
              checked={tooltips}
              onChange={(event) => setTooltips(event.target.checked)}
            />{" "}
            Tooltips
          </label>
        </div>
        {example.id === "gallery" ? (
          <PolarGalleryCard
            kind={family}
            categoryColors={["var(--chart-1)"]}
            data={polar}
            animate={animate ? entrance : false}
            showText={labels}
            tooltips={tooltips}
          />
        ) : (
          <PolarRecipeCard
            recipe={recipe}
            data={polar}
            animate={animate ? entrance : false}
            showText={labels}
            tooltips={tooltips}
          />
        )}
      </div>
    );
  }
  let content: ReactNode;
  if (family === "area") {
    const props = { ...common, data, motion };
    if (example.stack) {
      const stack = {
        label: common.label,
        data: areas,
        material,
        motion,
        config: { desktop: config.primary, mobile: config.secondary },
      };
      content =
        example.stack === "percent" ? (
          <Area.PercentArea {...stack} />
        ) : (
          <Area.StackedArea {...stack} />
        );
    } else if (example.type === "monotone") content = <Area.SmoothArea {...props} />;
    else if (example.type === "stepAfter") content = <Area.StepArea {...props} />;
    else content = <Area.LinearArea {...props} />;
  } else if (family === "line") {
    const props = {
      ...common,
      data,
      seriesLabel: example.label,
      animate: animate ? entrance : false,
    };
    if (example.second)
      content = (
        <Line.ComparisonLine
          label={common.label}
          data={comparison}
          config={{ current: config.primary, previous: config.secondary }}
          visibleSeries={visible}
          onVisibleSeriesChange={setVisible}
          material={material}
          animate={animate ? entrance : false}
        />
      );
    else if (example.target !== undefined)
      content = (
        <Line.TargetLine
          {...props}
          target={example.target}
          targetLabel={example.target === 0 ? "Zero" : "Target"}
        />
      );
    else if (example.labels) content = <Line.LabeledLine {...props} />;
    else if (example.dots) content = <Line.DotsLine {...props} />;
    else if (example.type === "monotone") content = <Line.SmoothLine {...props} />;
    else if (example.type === "stepAfter") content = <Line.StepLine {...props} />;
    else content = <Line.TrendLine {...props} />;
  } else {
    const props = { ...common, data: bars, motion };
    if (example.stack)
      content = (
        <Bar.StackedBars
          label={common.label}
          data={complete}
          config={config}
          material={material}
          motion={motion}
        />
      );
    else if (example.second)
      content = (
        <Bar.GroupedBars
          label={common.label}
          data={pairs}
          config={config}
          material={material}
          motion={motion}
        />
      );
    else if (example.horizontal) content = <Bar.HorizontalBars {...props} />;
    else if (example.target === 0) content = <Bar.SignedBars {...props} />;
    else if (example.labels) content = <Bar.LabeledBars {...props} />;
    else content = <Bar.VerticalBars {...props} />;
  }
  const singleLegend: Chart.SeriesConfig =
    family === "bar" && example.target === 0
      ? {
          increase: { label: "Positive", color: "var(--chart-1)" },
          decrease: { label: "Negative", color: "var(--chart-2)" },
        }
      : { value: { label: example.label, color: "var(--chart-1)" } };
  return (
    <div className="gallery-chart">
      {content}
      {!example.second && (
        <Chart.Root config={singleLegend}>
          <Chart.Legend aria-label={`${example.title} series`} />
        </Chart.Root>
      )}
    </div>
  );
});
