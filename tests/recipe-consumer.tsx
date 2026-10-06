// Host recipe typechecks: legacy bars and areas composed from public exports.
const formatValue = (value: number) => `${value} tasks`;

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

import {
  CategoryBars,
  CustomLabelBars,
  HighlightedBars,
  InteractiveBars,
  LabeledBars,
  SignedBars,
} from "./bar-recipes.js";

void (<LabeledBars data={barData} label="Labels" formatValue={formatValue} />);
void (<CustomLabelBars data={barData} label="Labels" formatValue={formatValue} />);
void (
  <CategoryBars
    data={[{ category: "A", value: 1, color: "var(--chart-1)" }]}
    label="Categories"
    formatValue={formatValue}
  />
);
void (
  <HighlightedBars
    data={barData}
    highlightedCategory="Mon"
    label="Highlight"
    formatValue={formatValue}
  />
);
void (
  <SignedBars
    data={[{ category: "A", value: -2 }]}
    label="Change"
    formatValue={formatValue}
    motion={{ revealDurationMs: 1000 }}
  />
);
void (
  <InteractiveBars
    data={[{ category: "2026-04-01", primary: 1, secondary: 2 }]}
    config={barConfig}
    label="History"
    activeSeries="secondary"
    formatCategory={(value) => value}
  />
);
void (
  <InteractiveBars
    data={[]}
    config={barConfig}
    label="History"
    // @ts-expect-error Selection must name one of the two actual series.
    activeSeries="unknown"
    formatCategory={(value) => value}
  />
);

import {
  type AreaPoint,
  type AreaSeriesConfig,
  GradientArea,
  InteractiveArea,
  LinearArea,
  PercentArea,
  SmoothArea,
  StackedArea,
  type StackedAreaPoint,
  StepArea,
  ThresholdArea,
} from "./area-recipes.js";

const areaData: AreaPoint[] = [
  { period: "Jan", value: 0 },
  { period: "Feb", value: null },
];
const completeArea: StackedAreaPoint[] = [{ period: "Jan", desktop: 2, mobile: 1 }];
const areaSeriesConfig: AreaSeriesConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)", pattern: { kind: "dots" } },
  mobile: { label: "Mobile", color: "var(--chart-2)", pattern: { kind: "lines" } },
};
void (<SmoothArea data={areaData} label="Area" formatValue={formatValue} />);
void (<LinearArea data={areaData} label="Area" formatValue={formatValue} />);
void (<StepArea data={areaData} label="Area" formatValue={formatValue} />);
void (<GradientArea data={areaData} label="Area" formatValue={formatValue} />);
void (<ThresholdArea data={areaData} label="Area" formatValue={formatValue} threshold={1} />);
void (<StackedArea data={completeArea} label="Visitors" config={areaSeriesConfig} />);
void (<PercentArea data={completeArea} label="Share" config={areaSeriesConfig} />);
void (
  <InteractiveArea
    data={completeArea}
    label="Visitors by device"
    config={areaSeriesConfig}
    visibleSeries={["desktop"]}
    onVisibleSeriesChange={() => {}}
  />
);
// @ts-expect-error Stacked areas need complete values to preserve totals.
const incompleteArea: StackedAreaPoint = { period: "Jan", desktop: null, mobile: 1 };
void incompleteArea;

import {
  createPercentStack,
  formatPercent,
  type NormalizedValue,
  type PercentStackOptions,
  Tooltip as PercentTooltip,
  TooltipContent as PercentContent,
  XAxis as PercentXAxis,
  YAxis as PercentYAxis,
} from "@kind-ui/charts";
const percentOptions: PercentStackOptions = {
  values: (entry) => (entry.dataKey === "primary" ? [1, 3, null] : undefined),
};
const percentStack = createPercentStack(percentOptions);
const fraction: NormalizedValue = percentStack.normalizedValue;
void (<PercentXAxis type="number" tickFormatter={percentStack.tickFormatter} />);
void (<PercentYAxis yAxisId="share" tickFormatter={formatPercent} />);
void (<PercentTooltip normalizedValue={fraction} formatter={(value) => String(value)} />);
void (
  <PercentContent
    tooltip={{
      active: true,
      payload: [],
      label: "",
      activeIndex: "0",
      coordinate: undefined,
      accessibilityLayer: true,
    }}
    normalizedValue={fraction}
  />
);
// @ts-expect-error Normalized fractions must be numeric, not preformatted percent strings.
const invalidFraction: NormalizedValue = () => "25%";
void invalidFraction;
// @ts-expect-error Native expand stack members must be raw scalar numeric values.
createPercentStack({ values: () => ["2"] });
