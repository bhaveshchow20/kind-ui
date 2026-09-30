import { type ChartConfig, ChartContainer, ChartLegend, ChartTooltipContent } from "kind-ui";
import { createRef } from "react";
import { Line, LineChart, Tooltip } from "recharts";

const config = {
  count: { label: "Tasks", color: "#2563eb", formatValue: (value) => `${value}` },
} satisfies ChartConfig;
const ref = createRef<HTMLDivElement>();
const component = (
  <ChartContainer
    config={config}
    visibleSeries={["count"]}
    onVisibleSeriesChange={() => {}}
    ref={ref}
    aria-label="Chart"
  >
    <ChartLegend ref={createRef<HTMLUListElement>()} />
    <LineChart width={300} height={200} data={[{ count: 0 }]}>
      <Line dataKey="count" stroke="var(--color-count)" />
      <Tooltip
        content={(tooltip) => (
          <ChartTooltipContent tooltip={tooltip} ref={ref} className="custom" />
        )}
      />
    </LineChart>
  </ChartContainer>
);
void component;
// @ts-expect-error A change callback requires consumer-owned visibility.
const invalidControl = <ChartContainer config={config} onVisibleSeriesChange={() => {}} />;
// @ts-expect-error Series colors must be CSS strings.
const invalidConfig: ChartConfig = { count: { label: "Tasks", color: 1 } };
void invalidControl;
void invalidConfig;
