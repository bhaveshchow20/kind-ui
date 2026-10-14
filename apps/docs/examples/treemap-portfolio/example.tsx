"use client";
import {
  normalizeTreemap,
  type TreemapAccessors,
  TreemapChart,
  type TreemapColorEncoding,
} from "@kind-ui/charts";

type PositionNode = {
  id: string;
  label: string;
  grossUsdK?: number;
  signedUsdK?: number;
  pnlUsdK?: number | null;
  children?: readonly PositionNode[];
};
// The adapter supplied positive gross area and separate signed position metadata.
const data: readonly PositionNode[] = [
  {
    id: "equity",
    label: "Equity",
    children: [
      {
        id: "long",
        label: "Long",
        children: [
          { id: "atlas", label: "Atlas", grossUsdK: 120, signedUsdK: 120, pnlUsdK: 3.2 },
          { id: "grove", label: "Grove", grossUsdK: 60, signedUsdK: 60, pnlUsdK: -1.4 },
        ],
      },
      {
        id: "short",
        label: "Short",
        children: [
          { id: "ridge", label: "Ridge", grossUsdK: 100, signedUsdK: -100, pnlUsdK: 2.1 },
          { id: "field", label: "Field", grossUsdK: 20, signedUsdK: -20, pnlUsdK: null },
        ],
      },
    ],
  },
  {
    id: "cash",
    label: "Cash",
    children: [
      { id: "reserve", label: "Reserve", grossUsdK: 40, signedUsdK: 40, pnlUsdK: 0 },
      { id: "closed", label: "Closed position", grossUsdK: 0, signedUsdK: 0, pnlUsdK: null },
    ],
  },
];
const accessors: TreemapAccessors<PositionNode> = {
  id: (datum) => datum.id,
  label: (datum) => datum.label,
  children: (datum) => datum.children,
  value: (datum) => {
    const value = datum.grossUsdK;
    if (value === undefined) {
      throw new Error(
        `Treemap leaf ${datum.id} is missing gross position area in USD thousands; supply a finite nonnegative value.`,
      );
    }
    return value;
  },
};
const dollars = (value: number) => `${value > 0 ? "+" : ""}$${value.toFixed(1)}k`;
const hierarchy = normalizeTreemap(data, accessors);
const encoding: TreemapColorEncoding<PositionNode> = {
  type: "diverging",
  value: (datum) => datum.pnlUsdK,
  domain: [-4, 4],
  label: "One-session P&L (USD thousands)",
  formatValue: dollars,
  unknownLabel: "P&L unavailable",
};
export function GrossExposureTreemap() {
  return (
    <TreemapChart<PositionNode>
      data={data}
      accessors={accessors}
      encoding={encoding}
      config={{}}
      aria-label="Illustrative gross long-short exposure and one-session P&L"
      animate
      height={320}
      padding={3}
      formatValue={(value) => `$${value}k gross`}
    >
      <TreemapChart.Tiles />
      <TreemapChart.Tooltip<PositionNode>>
        {(item) => (
          <>
            {item.path.length > 1 && (
              <strong>
                {item.path
                  .slice(0, -1)
                  .map((id) => hierarchy.byId.get(id)?.label)
                  .join(" / ")}
              </strong>
            )}
            <div>
              {item.label}: ${item.value}k gross
            </div>
            {item.kind === "leaf" && (
              <>
                <div>
                  Signed position:{" "}
                  {item.datum.signedUsdK === undefined
                    ? "Not supplied"
                    : dollars(item.datum.signedUsdK)}
                </div>
                <div>
                  P&L: {item.datum.pnlUsdK == null ? "Unavailable" : dollars(item.datum.pnlUsdK)}
                </div>
              </>
            )}
            <div>
              Gross root share:{" "}
              {item.rootShare === null ? "—" : `${(item.rootShare * 100).toFixed(1)}%`}
            </div>
          </>
        )}
      </TreemapChart.Tooltip>
      <TreemapChart.ColorLegend />
      <TreemapChart.Breadcrumbs rootLabel="All positions" />
      <TreemapChart.Content>
        <p className="mt-2 text-xs text-muted-foreground">
          Illustrative positions · October 9, 2026 · Area: precomputed absolute gross position
          value, USD thousands. Share denominator: $340k gross; these shares are not percentages of
          NAV. Color: one-session P&amp;L.
        </p>
      </TreemapChart.Content>
    </TreemapChart>
  );
}
