"use client";
import { type TreemapAccessors, TreemapChart, type TreemapColorEncoding } from "@kind-ui/charts";
import { useMemo } from "react";

type MarketNode = {
  id: string;
  label: string;
  capitalizationUsdM?: number;
  turnoverUsdM?: number;
  returnPercent?: number | null;
  children?: readonly MarketNode[];
};
const data: readonly MarketNode[] = [
  {
    id: "technology",
    label: "Technology",
    children: [
      {
        id: "platforms",
        label: "Platforms",
        children: [
          {
            id: "northstar",
            label: "Northstar",
            capitalizationUsdM: 240,
            turnoverUsdM: 42,
            returnPercent: 2.4,
          },
          {
            id: "orbit",
            label: "Orbit",
            capitalizationUsdM: 150,
            turnoverUsdM: 90,
            returnPercent: -1.8,
          },
        ],
      },
      {
        id: "infrastructure",
        label: "Infrastructure",
        children: [
          {
            id: "cedar",
            label: "Cedar",
            capitalizationUsdM: 110,
            turnoverUsdM: 18,
            returnPercent: 0,
          },
          {
            id: "signal",
            label: "Signal",
            capitalizationUsdM: 40,
            turnoverUsdM: 5,
            returnPercent: null,
          },
        ],
      },
    ],
  },
  {
    id: "essentials",
    label: "Essentials",
    children: [
      {
        id: "harbor",
        label: "Harbor",
        capitalizationUsdM: 180,
        turnoverUsdM: 30,
        returnPercent: 0.7,
      },
      {
        id: "meadow",
        label: "Meadow",
        capitalizationUsdM: 80,
        turnoverUsdM: 15,
        returnPercent: -3.1,
      },
      {
        id: "inactive",
        label: "Inactive allocation",
        capitalizationUsdM: 0,
        turnoverUsdM: 0,
        returnPercent: null,
      },
    ],
  },
];
const signedPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

export function MarketTreemap({
  metric = "return",
  areaMetric = "capitalization",
  loading = false,
}: {
  metric?: "return" | "activity";
  areaMetric?: "capitalization" | "turnover";
  loading?: boolean;
}) {
  const accessors = useMemo<TreemapAccessors<MarketNode>>(
    () => ({
      id: (datum) => datum.id,
      label: (datum) => datum.label,
      children: (datum) => datum.children,
      value: (datum) => {
        const value =
          areaMetric === "capitalization" ? datum.capitalizationUsdM : datum.turnoverUsdM;
        if (value === undefined) {
          throw new Error(
            `Treemap leaf ${datum.id} is missing ${areaMetric} area; supply a finite nonnegative value.`,
          );
        }
        return value;
      },
    }),
    [areaMetric],
  );
  const encoding = useMemo<TreemapColorEncoding<MarketNode>>(
    () =>
      metric === "return"
        ? {
            type: "diverging",
            value: (datum) => datum.returnPercent,
            domain: [-4, 4],
            label: "One-session return (%)",
            formatValue: signedPercent,
            unknownLabel: "Return unavailable",
          }
        : {
            type: "sequential",
            value: (datum) => datum.turnoverUsdM,
            domain: [0, 100],
            label: "One-session turnover (USD millions)",
            formatValue: (value) => `$${value}m`,
            unknownLabel: "Activity unavailable",
          },
    [metric],
  );
  return (
    <TreemapChart<MarketNode>
      loading={loading}
      data={data}
      accessors={accessors}
      encoding={encoding}
      config={{}}
      aria-label={`Illustrative market allocation by ${areaMetric}; color by ${metric}`}
      height={320}
      groupHeaderHeight={22}
      padding={3}
      formatValue={(value) => `$${value}m`}
    >
      <TreemapChart.Groups />
      <TreemapChart.Tiles />
      <TreemapChart.Labels minWidth={46} minHeight={24} />
      <TreemapChart.Tooltip<MarketNode>>
        {(item) => (
          <>
            <strong>{item.label}</strong>
            <div>Area: ${item.value}m</div>
            {item.kind === "leaf" && (
              <div>
                Color:{" "}
                {metric === "return"
                  ? item.datum.returnPercent == null
                    ? "Return unavailable"
                    : signedPercent(item.datum.returnPercent)
                  : item.datum.turnoverUsdM == null
                    ? "Activity unavailable"
                    : `$${item.datum.turnoverUsdM}m session turnover`}
              </div>
            )}
            <div>
              Root share: {item.rootShare === null ? "—" : `${(item.rootShare * 100).toFixed(1)}%`}
            </div>
          </>
        )}
      </TreemapChart.Tooltip>
      <TreemapChart.ColorLegend />
      <TreemapChart.Breadcrumbs rootLabel="All categories" />
      <TreemapChart.Content>
        <p className="mt-2 text-xs text-muted-foreground">
          Illustrative data · October 9, 2026 · Area:{" "}
          {areaMetric === "capitalization" ? "full capitalization" : "one-session turnover"}, USD
          millions. Root share uses this supplied universe; zero allocations remain in the plotted
          values.
        </p>
      </TreemapChart.Content>
    </TreemapChart>
  );
}
