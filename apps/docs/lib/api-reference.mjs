// Display metadata augments types generated from the pinned public declarations.
// Defaults below describe the candidate public implementations.
const presentation = {
  Root: {
    defaults: {
      emphasis: '"auto"',
      interaction: "Series focus; matching-legend marks",
      visibleSeries: "All registered items",
      defaultVisibleSeries: "All registered items",
    },
    descriptions: {
      interaction:
        'Focus dims peers by default and supported marks share legend actions. Set mode to "visibility" for visual hide/show with preserved full-data layout, or markActivation to "none" for passive marks. Explicit bindings require kind and eligibleKeys; selected requires onSelectionChange. Legend actions retain an active item.',
      visibleSeries:
        "Controlled visibility; provide onVisibleSeriesChange for legend hide/show. Hidden data retains its geometry and dimmed legend/tooltip entries.",
      defaultVisibleSeries:
        "Initial uncontrolled visibility; mutually exclusive with visibleSeries. Use explicit visibility interaction for legend hide/show.",
    },
  },
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
    description: display?.descriptions?.[entry.name] ?? (entry.description || "—"),
  }));
}
