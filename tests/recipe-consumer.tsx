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
    motion={{
      revealDurationMs: 900,
      revealEasing: "easeOut",
      hoverTransition: { type: "spring", stiffness: 180, damping: 26 },
    }}
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

import {
  GroupedBars,
  HorizontalBars,
  type StackedBarPoint,
  StackedBars,
  VerticalBars,
} from "./bar-recipes.js";

const barData = [
  { category: "Mon", value: 0 },
  { category: "Tue", value: null },
];
void (
  <VerticalBars
    data={barData}
    label="Tasks"
    formatValue={formatValue}
    motion={{ revealDurationMs: 800 }}
  />
);
void (<HorizontalBars data={barData} label="Tasks" formatValue={formatValue} />);
const barConfig = {
  primary: { label: "Completed", color: "black" },
  secondary: { label: "Retried", color: "gray" },
};
void (
  <GroupedBars
    data={[{ category: "Mon", primary: null, secondary: 0 }]}
    config={barConfig}
    label="Comparison"
  />
);
void (
  <StackedBars
    data={[{ category: "Mon", primary: 2, secondary: 0 }]}
    config={barConfig}
    label="Outcomes"
  />
);
// @ts-expect-error Unknown segments cannot be silently included in a complete total.
const incompleteStack: StackedBarPoint = { category: "Mon", primary: null, secondary: 1 };
void incompleteStack;
