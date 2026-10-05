"use client";
import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [{ period: "Storage", used: 72 }];
const config = {
  used: {
    label: "Used storage",
    color: "#008b83",
    formatValue: (value: unknown) => `${value} of 100 GB`,
  },
} satisfies Chart.SeriesConfig;

export function StorageGaugeChart({
  direction = "clockwise",
}: {
  direction?: "clockwise" | "anticlockwise";
}) {
  return (
    <Chart.Root config={config}>
      <Chart.ResponsiveContainer width="100%" height={280}>
        <Chart.RadialBarChart
          key={direction}
          data={data}
          animate={{ revealDurationMs: 1200 }}
          animationDirection={direction}
          startAngle={180}
          endAngle={0}
          cy="72%"
          innerRadius="62%"
          outerRadius="92%"
          barCategoryGap="10%"
          aria-label="Storage capacity: 72 of 100 GB used, 28 GB available"
        >
          <Chart.PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <Chart.PolarRadiusAxis type="category" dataKey="period" tick={false} axisLine={false}>
            <Chart.Label
              value={data[0].used}
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null;
                return (
                  <text x={viewBox.cx} y={viewBox.cy - 28} textAnchor="middle" fill="currentColor">
                    <tspan x={viewBox.cx} fontSize={28} fontWeight={650}>
                      72 GB
                    </tspan>
                    <tspan x={viewBox.cx} dy={24} fontSize={12}>
                      of 100 GB used
                    </tspan>
                  </text>
                );
              }}
            />
          </Chart.PolarRadiusAxis>
          <Chart.RadialBarSeries dataKey="used" background={{ fill: "#dfeeea" }} cornerRadius={6} />
          <Chart.Tooltip />
        </Chart.RadialBarChart>
      </Chart.ResponsiveContainer>
    </Chart.Root>
  );
}
