import {
  binHistogram,
  boxPlotExtent,
  computeWaterfallData,
  createHeatmapModel,
  createHeatmapScale,
  type HeatmapDatum,
  type HistogramBin,
  type HistogramMeasure,
  LineChart,
  prepareSankeyData,
  Root,
  type SankeyFlowData,
  type SeriesConfig,
  WaterfallChart,
  type WaterfallEntry,
} from "@kind-ui/charts";

// Public transforms preserve explicit zero and missing values and accept readonly inputs.
const entries = [
  { id: "zero", label: "Zero", kind: "delta", value: 0 },
  { id: "missing", label: "Missing", kind: "delta", value: null },
  { id: "subtotal", label: "Subtotal", kind: "subtotal" },
] as const satisfies readonly WaterfallEntry[];
const waterfall = computeWaterfallData(entries);
const endpoint: number | null | undefined = waterfall[0]?.end;
const bins = [{ lower: 0, upper: 1, count: 0 }] as const satisfies readonly HistogramBin[];
const histogram = binHistogram([0, null, undefined], [0, 1]);
const heatmapData = [
  { row: "A", column: "X", value: null },
] as const satisfies readonly HeatmapDatum[];
const heatmap = createHeatmapModel({ rows: ["A"], columns: ["X"], data: heatmapData });
const scale = createHeatmapScale({ domain: [0, 0], colors: ["#000000", "#ffffff"] });
void [endpoint, bins, histogram, heatmap, scale];

// @ts-expect-error Extent requires a present summary; missing-value validation is separate.
boxPlotExtent(null);

// @ts-expect-error Subtotals compute their own balance and cannot supply a value.
const valuedSubtotal: WaterfallEntry = { id: "s", label: "S", kind: "subtotal", value: 0 };
// @ts-expect-error Missing measurements must be explicit null, not omitted.
const omittedDelta: WaterfallEntry = { id: "d", label: "D", kind: "delta" };
// @ts-expect-error IDs are stable strings, never coerced numeric identifiers.
computeWaterfallData([{ id: 1, label: "D", kind: "delta", value: 0 }]);
// @ts-expect-error Preformatted numeric strings cannot enter the arithmetic boundary.
computeWaterfallData([{ id: "d", label: "D", kind: "delta", value: "0" }]);
// @ts-expect-error Bounds must be numeric.
const stringBin: HistogramBin = { lower: "0", upper: 1, count: 0 };
// @ts-expect-error Only explicit count and density measures are supported.
const inferredMeasure: HistogramMeasure = "probability";
// @ts-expect-error Histogram samples never coerce numeric strings.
binHistogram(["0"], [0, 1]);
// @ts-expect-error Heatmap absence must be explicit null for supplied records.
const absentValue: HeatmapDatum = { row: "A", column: "X" };
// @ts-expect-error Domain identity remains a string.
createHeatmapModel({ rows: [1], columns: ["X"], data: [] });
// @ts-expect-error Duplicate policy must be selected from the documented operations.
createHeatmapModel({ rows: [], columns: [], data: [], duplicates: "average" });
// @ts-expect-error Quantitative scale requires exactly two domain endpoints.
createHeatmapScale({ domain: [0, 1, 2], colors: ["#000000", "#ffffff"] });
void [valuedSubtotal, omittedDelta, stringBin, inferredMeasure, absentValue];

const flows: SankeyFlowData = {
  nodes: [
    { id: "a", name: "A", custom: "caller-owned" },
    { id: "b", name: "B" },
  ],
  links: [{ id: "ab", source: "a", target: 1, value: 0 }],
};
const prepared = prepareSankeyData(flows);
const sourceIndex: number | undefined = prepared.links[0]?.source;
const nodeId: string | undefined = prepared.nodes[0]?.id;
void [sourceIndex, nodeId];
// @ts-expect-error Preparation resolves endpoints to numeric indices, not string IDs.
const stringEndpoint: string | undefined = prepared.links[0]?.source;
// @ts-expect-error The inferred preparation result must not degrade to any.
const numericNodeId: number | undefined = prepared.nodes[0]?.id;
// @ts-expect-error Arbitrary node metadata remains unknown until the consumer narrows it.
const unvalidatedMetadata: string | undefined = prepared.nodes[0]?.custom;
// @ts-expect-error Endpoint references must be a string identity or numeric index.
prepareSankeyData({ nodes: [], links: [{ id: "ab", source: true, target: 1, value: 0 }] });
// @ts-expect-error A link must carry its own measured flow.
prepareSankeyData({ nodes: [], links: [{ id: "ab", source: 0, target: 1 }] });
void [stringEndpoint, numericNodeId, unvalidatedMetadata];

const config = { value: { color: "red" } } satisfies SeriesConfig;
const rows = [{ label: "A", value: 0 }];
void (<LineChart config={config} data={rows} xDataKey="label" aria-label="Values" />);
void (
  <WaterfallChart config={config} data={waterfall} aria-label="Balances">
    <WaterfallChart.Series seriesKey="value" />
  </WaterfallChart>
);
// @ts-expect-error Configured generated composition requires a name.
void (<LineChart config={config} data={rows} xDataKey="label" />);
// @ts-expect-error Inferred rows constrain generated axis data keys.
void (<LineChart config={config} data={rows} xDataKey="missing" aria-label="Values" />);
void (
  (
    // @ts-expect-error Explicit children cannot also request generated axes.
    <LineChart config={config} data={rows} xDataKey="label" aria-label="Values">
      {null}
    </LineChart>
  )
);
// @ts-expect-error Waterfall owns its range data key; the compound part preserves that exclusion.
void (<WaterfallChart.Series dataKey="value" />);
// @ts-expect-error Visibility has exactly one owner.
void (<Root config={config} visibleSeries={["value"]} defaultVisibleSeries={["value"]} />);
void (
  <Root
    config={config}
    // @ts-expect-error Controlled focus requires its selection callback.
    interaction={{ kind: "series", selected: "value", eligibleKeys: ["value"] }}
  />
);
void (
  <Root
    config={config}
    // @ts-expect-error Node identities have focus semantics only.
    interaction={{ kind: "node", mode: "visibility", eligibleKeys: ["value"] }}
  />
);
// @ts-expect-error Both theme palettes are required.
const incompleteTheme: SeriesConfig = { value: { color: { light: "red" } } };
void incompleteTheme;
