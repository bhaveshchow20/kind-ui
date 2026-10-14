"use client";
import { TreemapChart, type TreemapDatum } from "@kind-ui/charts";

const data: readonly TreemapDatum[] = [
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
const previousValues: Record<string, number> = {
  api: 16200,
  workers: 10900,
  functions: 3800,
  postgresql: 13800,
  warehouse: 7900,
  cache: 2900,
  object: 5200,
  backups: 2100,
  egress: 4400,
  cdn: 2400,
};
function previousPeriod(nodes: readonly TreemapDatum[]): TreemapDatum[] {
  return nodes.map((node) =>
    node.children
      ? { ...node, children: previousPeriod(node.children) }
      : { ...node, value: previousValues[node.id] ?? node.value },
  );
}
const previousData = previousPeriod(data);
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
export function CloudSpendTreemap({
  period = "current",
  loading = false,
}: {
  period?: "current" | "previous";
  loading?: boolean;
}) {
  const current = period === "current";
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Cloud infrastructure</p>
          <h3 className="m-0 text-base font-medium">Monthly spend</h3>
        </div>
        <div className="text-right">
          <p className="m-0 text-xl font-semibold tabular-nums">
            {currency.format(current ? 76300 : 69600)}
          </p>
          <p className="m-0 text-xs text-muted-foreground">
            {current ? "September" : "August"} 2026 · USD
          </p>
        </div>
      </div>
      <TreemapChart
        data={current ? data : previousData}
        config={config}
        aria-label={`Illustrative ${current ? "September" : "August"} cloud spend by service`}
        height={340}
        animate
        loading={loading}
        loadingLabel="Loading cloud spend"
        padding={6}
        formatValue={(value) => currency.format(value)}
      >
        <TreemapChart.Tiles />
        <TreemapChart.Labels
          minWidth={18}
          minHeight={14}
          padding={5}
          labelProps={() => ({ className: "text-[#173047]" })}
        />
        <TreemapChart.Tooltip valueAnimation="shuffle" />
        <TreemapChart.Legend />
      </TreemapChart>
      <p className="m-0 text-xs text-muted-foreground">
        Illustrative monthly billing · Select a category or inspect a service.
      </p>
    </section>
  );
}
