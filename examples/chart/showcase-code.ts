import type { Finish } from "./showcase-charts";
import type { Example, Family } from "./showcase-data";

const sourceLoaders = {
  area: () => import("./area-recipes.tsx?raw"),
  line: () => import("./line-recipes.tsx?raw"),
  bar: () => import("./bar-recipes.tsx?raw"),
};
const recipeNames: Record<Family, Record<string, string>> = {
  area: {
    smooth: "SmoothArea",
    linear: "LinearArea",
    step: "StepArea",
    stacked: "StackedArea",
    percent: "PercentArea",
    gaps: "LinearArea",
  },
  line: {
    linear: "TrendLine",
    smooth: "SmoothLine",
    step: "StepLine",
    dots: "LabeledLine",
    comparison: "ComparisonLine",
    gaps: "DotsLine",
    target: "TargetLine",
    signed: "TargetLine",
  },
  bar: {
    vertical: "VerticalBars",
    horizontal: "HorizontalBars",
    grouped: "GroupedBars",
    stacked: "StackedBars",
    signed: "SignedBars",
    labels: "LabeledBars",
  },
};
/** Load the maintained recipe module only when requested; no parallel chart implementation. */
export async function exampleCode(
  family: Family,
  example: Example,
  material: Finish,
  animate: boolean,
  color: string,
  secondary: string,
) {
  const source = (await sourceLoaders[family]()).default;
  const data = example.data.map((point) =>
    family === "area" && example.second
      ? { period: point.period, desktop: point.primary, mobile: point.secondary }
      : family === "line" && example.second
        ? { period: point.period, current: point.primary, previous: point.secondary }
        : family === "bar" && example.second
          ? { category: point.period, primary: point.primary, secondary: point.secondary }
          : { [family === "bar" ? "category" : "period"]: point.period, value: point.primary },
  );
  const keys =
    family === "area"
      ? ["desktop", "mobile"]
      : family === "line"
        ? ["current", "previous"]
        : ["primary", "secondary"];
  const config = {
    [keys[0] ?? "primary"]: { label: example.label, color },
    [keys[1] ?? "secondary"]: { label: example.second, color: secondary },
  };
  const options =
    family === "line"
      ? `animate={${animate}}`
      : `motion={${animate ? "{ revealDurationMs: 450 }" : "undefined"}}`;
  return `${source}\n\n// Gallery usage — selected data and controls.\nimport "@kind-ui/charts/styles.css";\n${family === "line" && example.second ? 'import { useState } from "react";\n' : ""}const data = ${JSON.stringify(data, null, 2)};\n${example.second ? `const config = ${JSON.stringify(config, null, 2)};\n` : ""}\nexport function GalleryExample() {\n${family === "line" && example.second ? `  const [visible, setVisible] = useState(${JSON.stringify(keys)});\n` : ""}  return <div style={{ "--chart-1": "${color}", "--chart-2": "${secondary}" } as React.CSSProperties)>\n    <${recipeNames[family][example.id]} data={data} label="${example.label}" material="${material}" ${options} ${example.second ? "config={config}" : `formatValue={(value) => value + " ${example.unit}"}`}${example.target !== undefined ? ` target={${example.target}} targetLabel="${example.target === 0 ? "Zero" : "Target"}"` : ""}${family === "line" && example.second ? " visibleSeries={visible} onVisibleSeriesChange={setVisible}" : ""} />\n  </div>;\n}\n`;
}
