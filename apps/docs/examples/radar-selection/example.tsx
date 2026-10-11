"use client";
import { RadarChart, type SeriesConfig } from "@kind-ui/charts";
import { useState } from "react";

const data = [
  { period: "Speed", studio: 88, field: 62 },
  { period: "Quality", studio: 76, field: 91 },
  { period: "Value", studio: 63, field: 84 },
  { period: "Support", studio: 92, field: 68 },
  { period: "Reach", studio: 58, field: 89 },
  { period: "Trust", studio: 81, field: 74 },
];
const config = {
  studio: { label: "Studio", color: "#733bff" },
  field: { label: "Field", color: "#008b82" },
} satisfies SeriesConfig;

export function SelectableRadarChart() {
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  return (
    <>
      <>
        <RadarChart
          legendPosition="top"
          config={config}
          interaction={{
            kind: "series",
            mode: "focus",
            eligibleKeys: Object.keys(config),
            selected: selectedSeries,
            onSelectionChange: setSelectedSeries,
          }}
          width="100%"
          height={280}
          data={data}
          animate
          outerRadius="68%"
          margin={{ top: 24, right: 36, bottom: 24, left: 36 }}
          aria-label="Product research scores out of 100: Studio and Field"
        >
          <RadarChart.Grid radialLines={false} />
          <RadarChart.AngleAxis dataKey="period" tick={{ fontSize: 12 }} />
          <RadarChart.RadiusAxis
            domain={[0, 100]}
            ticks={[25, 50, 75, 100]}
            angle={60}
            axisLine={false}
            tick={{ fontSize: 10 }}
          />
          <RadarChart.Series dataKey="studio" strokeWidth={2} fillOpacity={0.18} />
          <RadarChart.Series dataKey="field" strokeWidth={2} fillOpacity={0.18} />
          <RadarChart.Tooltip />
          <RadarChart.Legend />
        </RadarChart>
      </>
      <output aria-live="polite" className="sr-only">
        {selectedSeries
          ? `Selected: ${config[selectedSeries as keyof typeof config].label}`
          : "All series"}
      </output>
    </>
  );
}
