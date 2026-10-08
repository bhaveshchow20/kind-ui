// Display metadata augments types generated from the pinned public declarations.
// Defaults below are verified against released 0.3.0 implementations.
const presentation = {
  LoadingReference: {
    title: "Loading",
    defaults: { loading: "false", loadingLabel: '"Loading chart"' },
  },
  LinePresentationReference: {
    title: "Line presentation",
    types: {
      pointStyle: '"default" | "border" | "colored-border"',
      activePointStyle: '"default" | "border" | "colored-border"',
      dashAnimation: "false | LineDashAnimation",
    },
    defaults: { pointStyle: "Omitted", activePointStyle: "Omitted", dashAnimation: "false" },
  },
  AreaPresentationReference: {
    title: "Area presentation",
    types: {
      pointStyle: '"default" | "border" | "colored-border"',
      activePointStyle: '"default" | "border" | "colored-border"',
      pattern: "false | FillPattern",
    },
    defaults: { pointStyle: "Omitted", activePointStyle: "Omitted", pattern: "Config pattern" },
  },
  BackgroundPatternReference: {
    title: "Background pattern",
    types: { pattern: '"crossings" | "pinpoints" | "waves" | ChartBackgroundPatternDefinition' },
    defaults: { color: "Chart grid color", opacity: "0.15", size: "16" },
  },
  FillPatternReference: { title: "Fill pattern" },
  BarProjectionReference: {
    title: "Bar patterns and projection",
    defaults: { pattern: "Config pattern", projection: "Omitted" },
  },
  PercentFormattingReference: { title: "Percentage formatting" },
  SankeyLabelReference: {
    title: "Sankey node labels",
    defaults: {
      position: '"outside"',
      side: "By node position",
      offset: "8",
      iconSize: "16",
      iconGap: "4",
      showValues: "false",
      valueFormatter: "String",
    },
    types: {
      node: 'Pick<Chart.SankeyNodeProps, "x" | "y" | "width" | "height" | "payload">',
      data: "Chart.SankeyFlowData",
      nodeConfig: "Chart.SankeyNodeConfig | undefined",
    },
  },
};
export function referenceTitle(name) {
  return presentation[name]?.title ?? name;
}
/** @param {string} name
 * @param {Array<{name: string, type: string, description: string, required: boolean}>} entries
 */
export function referenceRows(name, entries) {
  const display = presentation[name];
  return entries.map((entry) => ({
    ...entry,
    type: (display?.types?.[entry.name] ?? entry.type)
      .replace(/\bChart\./g, "")
      .replace(/ \| undefined/g, ""),
    default: entry.required ? "Required" : (display?.defaults?.[entry.name] ?? "—"),
    description: entry.description || "—",
  }));
}
