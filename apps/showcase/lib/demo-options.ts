export type DemoOptions = {
  strokeWidth?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  rotation?: number;
  outerRadius?: number;
  exercise?: number;
  stand?: number;
  linkOpacity?: number;
  density?: boolean;
  binBorders?: boolean;
  curve?: "monotone" | "linear" | "stepAfter";
  dots?: boolean;
  fillOpacity?: number;
  radius?: number;
  width?: number;
  stacked?: boolean;
  innerRadius?: number;
  gridType?: "polygon" | "circle";
  progress?: number;
  gap?: number;
  pointShape?: "circle" | "diamond" | "square";
  showValues?: boolean;
  connectors?: boolean;
  nodeWidth?: number;
  nodePadding?: number;
  outlierRadius?: number;
};

export function demoDefaults(id: string): DemoOptions {
  return {
    strokeWidth: 3,
    showGrid: true,
    showLegend: true,
    showLabels: true,
    rotation: id === "gauge" ? 180 : 90,
    outerRadius: id.startsWith("radar") ? 70 : 90,
    exercise: 30,
    stand: 9,
    linkOpacity: 0.45,
    density: id === "histogram-latency",
    binBorders: true,
    curve: "monotone",
    dots: false,
    fillOpacity: id === "stacked" ? 0.55 : id === "radar-outline" ? 0 : 0.3,
    radius: id === "pie" || id === "donut" ? 0 : 5,
    width: id === "horizontal" ? 18 : id === "bubble" ? 60 : id === "scatter" ? 75 : 35,
    stacked: false,
    innerRadius: id === "donut" ? 54 : 0,
    gridType: "polygon",
    progress: id === "activity" ? 350 : 72,
    gap: id === "activity" ? 5 : id.startsWith("heatmap") ? 4 : 12,
    pointShape: "circle",
    showValues: id === "heatmap-retention",
    connectors: true,
    nodeWidth: 12,
    nodePadding: 24,
    outlierRadius: 3,
  };
}
