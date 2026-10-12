"use client";
import { type TreemapAccessors, TreemapChart, type TreemapColorEncoding } from "@kind-ui/charts";

type ActivityNode = {
  key: string;
  title: string;
  turnoverUsdK?: number;
  probabilityChangePp?: number | null;
  markets?: readonly ActivityNode[];
};
// Each leaf is one market. Outcomes do not repeat market-level turnover.
const data: readonly ActivityNode[] = [
  {
    key: "transport",
    title: "Transport",
    markets: [
      {
        key: "rail",
        title: "Rail extension",
        markets: [
          {
            key: "rail-approval",
            title: "Approval by December",
            turnoverUsdK: 42,
            probabilityChangePp: 3,
          },
          {
            key: "rail-opening",
            title: "Opening next year",
            turnoverUsdK: 18,
            probabilityChangePp: -1.5,
          },
        ],
      },
      {
        key: "airport",
        title: "Airport expansion",
        markets: [
          {
            key: "airport-permit",
            title: "Permit this quarter",
            turnoverUsdK: 25,
            probabilityChangePp: 0,
          },
        ],
      },
    ],
  },
  {
    key: "energy",
    title: "Energy",
    markets: [
      {
        key: "solar",
        title: "Solar buildout",
        markets: [
          {
            key: "solar-award",
            title: "Contract award this year",
            turnoverUsdK: 35,
            probabilityChangePp: null,
          },
          {
            key: "solar-start",
            title: "Construction next spring",
            turnoverUsdK: 10,
            probabilityChangePp: 4.5,
          },
          {
            key: "solar-paused",
            title: "Paused market",
            turnoverUsdK: 0,
            probabilityChangePp: null,
          },
        ],
      },
    ],
  },
];
const accessors: TreemapAccessors<ActivityNode> = {
  id: (datum) => datum.key,
  label: (datum) => datum.title,
  children: (datum) => datum.markets,
  value: (datum) => {
    const value = datum.turnoverUsdK;
    if (value === undefined) {
      throw new Error(
        `Treemap leaf ${datum.key} is missing 24-hour turnover area in USD thousands; supply a finite nonnegative value.`,
      );
    }
    return value;
  },
};
const encoding: TreemapColorEncoding<ActivityNode> = {
  type: "diverging",
  value: (datum) => datum.probabilityChangePp,
  domain: [-5, 5],
  label: "24-hour probability change (percentage points)",
  formatValue: (value) => `${value > 0 ? "+" : ""}${value} pp`,
  unknownLabel: "Probability change unavailable",
};
export function EventActivityTreemap() {
  return (
    <TreemapChart<ActivityNode>
      data={data}
      accessors={accessors}
      encoding={encoding}
      config={{}}
      aria-label="Illustrative 24-hour market turnover and probability-point change"
      height={320}
      padding={3}
      groupHeaderHeight={22}
      formatValue={(value) => `$${value}k turnover`}
    >
      <TreemapChart.Groups />
      <TreemapChart.Tiles />
      <TreemapChart.Labels minWidth={62} minHeight={24} />
      <TreemapChart.Tooltip<ActivityNode>>
        {(item) => (
          <>
            <strong>{item.label}</strong>
            <div>24-hour turnover: ${item.value}k</div>
            {item.kind === "leaf" && (
              <div>
                Probability change:{" "}
                {item.datum.probabilityChangePp == null
                  ? "Unavailable"
                  : `${item.datum.probabilityChangePp > 0 ? "+" : ""}${item.datum.probabilityChangePp} pp`}
              </div>
            )}
            <div>Path: {item.path.join(" / ")}</div>
          </>
        )}
      </TreemapChart.Tooltip>
      <TreemapChart.ColorLegend />
      <TreemapChart.Breadcrumbs rootLabel="All topics" />
      <TreemapChart.Content>
        <p className="mt-2 text-xs text-muted-foreground">
          Illustrative event/market data · 24 hours ending October 9, 2026 · Area: market-level USD
          turnover, counted once per leaf. Color: probability-point change, not relative return.
          Topic and event totals derive from markets.
        </p>
      </TreemapChart.Content>
    </TreemapChart>
  );
}
