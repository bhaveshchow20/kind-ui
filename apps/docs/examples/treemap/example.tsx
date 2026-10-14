"use client";
import { TreemapChart, type TreemapNode } from "@kind-ui/charts";

const data: readonly TreemapNode[] = [
  {
    id: "compute",
    label: "Compute",
    children: [
      { id: "api", label: "API", value: 18400 },
      { id: "workers", label: "Workers", value: 11800 },
      { id: "functions", label: "Functions", value: 4200 },
    ],
  },
  {
    id: "data",
    label: "Data",
    children: [
      { id: "postgresql", label: "PostgreSQL", value: 14600 },
      { id: "warehouse", label: "Warehouse", value: 8900 },
      { id: "cache", label: "Cache", value: 3100 },
    ],
  },
  {
    id: "storage",
    label: "Storage",
    children: [
      { id: "object", label: "Object storage", value: 5700 },
      { id: "backups", label: "Backups", value: 2200 },
    ],
  },
  {
    id: "network",
    label: "Network",
    children: [
      { id: "egress", label: "Egress", value: 4800 },
      { id: "cdn", label: "CDN", value: 2600 },
    ],
  },
];
const config = {
  compute: { label: "Compute", color: "#bed8ff" },
  data: { label: "Data", color: "#c9c5fb" },
  storage: { label: "Storage", color: "#b7e6d2" },
  network: { label: "Network", color: "#f4d4a5" },
};
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
export function CloudSpendTreemap({ state = "ready" }: { state?: "ready" | "loading" }) {
  const loading = state === "loading";
  return (
    <section className="space-y-4">
      {!loading && (
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Cloud infrastructure</p>
            <h3 className="m-0 text-base font-medium">Monthly spend</h3>
          </div>
          <div className="w-36 shrink-0 text-right">
            <p className="m-0 text-xl font-semibold tabular-nums">{currency.format(76300)}</p>
            <p className="m-0 text-xs text-muted-foreground">September 2026 · USD</p>
          </div>
        </div>
      )}
      <TreemapChart
        data={data}
        config={config}
        aria-label="Monthly cloud spend by service"
        height={340}
        animate
        loading={loading}
        loadingLabel="Loading cloud spend"
        padding={6}
        formatValue={(value) => currency.format(value)}
      >
        <TreemapChart.Tiles />
        <TreemapChart.Tooltip valueAnimation="shuffle" />
        <TreemapChart.Legend />
      </TreemapChart>
    </section>
  );
}
