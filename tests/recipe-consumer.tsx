// Copied into the isolated tarball consumer alongside the copyable recipe source.
import { ComparisonLine, TargetLine, TrendLine, type TrendPoint } from "./line-recipes.js";

const data: TrendPoint[] = [
  { period: "Mon", value: 0 },
  { period: "Tue", value: null },
];
const formatValue = (value: number) => `${value} tasks`;
void (
  <TrendLine
    data={data}
    label="Tasks"
    formatValue={formatValue}
    reveal={{ durationMs: 300, easing: "easeOut" }}
  />
);
void (
  <TargetLine data={data} label="Tasks" formatValue={formatValue} target={10} targetLabel="Goal" />
);
void (
  <ComparisonLine
    data={[{ period: "Mon", current: 0, previous: null }]}
    config={{
      current: { label: "Now", color: "black" },
      previous: { label: "Before", color: "gray" },
    }}
    visibleSeries={["current"]}
    onVisibleSeriesChange={() => {}}
    label="Comparison"
  />
);
// @ts-expect-error Missing samples are null, not descriptive strings.
const invalidPoint: TrendPoint = { period: "Mon", value: "missing" };
void invalidPoint;
void (
  <ComparisonLine
    data={[]}
    // @ts-expect-error Both known series must have presentation metadata.
    config={{ current: { label: "Now", color: "black" } }}
    visibleSeries={[]}
    onVisibleSeriesChange={() => {}}
    label="Comparison"
  />
);
