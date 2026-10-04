import { LineChart, type SeriesConfig } from "@kind-ui/charts";
import { TrendingUp } from "lucide-react";
export function IntegrationHost() {
  const config = {
    total: { label: "Total", color: "#4055ee", icon: TrendingUp },
  } satisfies SeriesConfig;
  return (
    <LineChart
      data={[
        { month: "Jan", total: 0 },
        { month: "Feb", total: 12 },
      ]}
      config={config}
      xDataKey="month"
      aria-label="Monthly icon totals"
      className="h-80 text-blue-700"
      rootProps={{ className: "max-w-xl" }}
      legend={{ className: "gap-6 p-4 text-blue-700" }}
      grid={{ className: "stroke-fuchsia-600" }}
      tooltip={{ formatter: (value) => [`${value} units`, "Total"] }}
    />
  );
}
