"use client";
import { type TreemapAccessors, TreemapChart, type TreemapColorEncoding } from "@kind-ui/charts";

type StorageRecord = {
  key: string;
  title: string;
  storedGb?: number;
  monthlyGrowthGb?: number | null;
  members?: readonly StorageRecord[];
};
const data: readonly StorageRecord[] = [
  {
    key: "production",
    title: "Production",
    members: [
      {
        key: "customer",
        title: "Customer services",
        members: [
          { key: "search", title: "Search", storedGb: 180, monthlyGrowthGb: 14 },
          { key: "media", title: "Media", storedGb: 320, monthlyGrowthGb: 32 },
        ],
      },
      {
        key: "internal",
        title: "Internal services",
        members: [
          { key: "logs", title: "Logs", storedGb: 140, monthlyGrowthGb: -8 },
          { key: "audit", title: "Audit", storedGb: 60, monthlyGrowthGb: 0 },
        ],
      },
    ],
  },
  {
    key: "archive",
    title: "Archive",
    members: [
      { key: "backups", title: "Backups", storedGb: 240, monthlyGrowthGb: null },
      { key: "retired", title: "Retired storage", storedGb: 0, monthlyGrowthGb: null },
    ],
  },
  { key: "planned", title: "Planned services", members: [] },
];
const accessors: TreemapAccessors<StorageRecord> = {
  id: (datum) => datum.key,
  label: (datum) => datum.title,
  children: (datum) => datum.members,
  value: (datum) => {
    const value = datum.storedGb;
    if (value === undefined) {
      throw new Error(
        `Treemap leaf ${datum.key} is missing stored area in GB; supply a finite nonnegative value.`,
      );
    }
    return value;
  },
};
const encoding: TreemapColorEncoding<StorageRecord> = {
  type: "diverging",
  value: (datum) => datum.monthlyGrowthGb,
  domain: [-40, 40],
  label: "Monthly change (GB)",
  formatValue: (value) => `${value > 0 ? "+" : ""}${value} GB`,
  unknownLabel: "Change unavailable",
};
export function StorageAllocationTreemap() {
  return (
    <TreemapChart<StorageRecord>
      data={data}
      accessors={accessors}
      encoding={encoding}
      config={{}}
      aria-label="Illustrative storage allocation and monthly change in GB"
      animate
      height={320}
      padding={3}
      formatValue={(value) => `${value} GB`}
    >
      <TreemapChart.Tiles />
      <TreemapChart.Tooltip valueAnimation="shuffle" />
      <TreemapChart.ColorLegend />
      <TreemapChart.Breadcrumbs rootLabel="All storage" />
      <TreemapChart.Content>
        <p className="mt-2 text-xs text-muted-foreground">
          Illustrative inventory · October 9, 2026 · Area: stored GB. Color: September-to-October
          change in GB. Supplied total: 940 GB. Custom record fields stay unchanged; retired storage
          and the empty planned group remain in the plotted values.
        </p>
      </TreemapChart.Content>
    </TreemapChart>
  );
}
