import type * as Chart from "@kind-ui/charts";

export type FunnelModelOutputReference = Chart.FunnelModel;
export type FunnelStageRecordReference = Chart.FunnelStage;
export type FunnelDatumAccessorsReference = Chart.FunnelAccessors<Chart.FunnelDatum>;
export type FunnelStagePartsReference = Chart.FunnelStagesProps;
export type FunnelShapeContextReference = Chart.FunnelShapeProps;
export type FunnelProjectedGeometryReference = Chart.FunnelGeometry;
export type FunnelLabelPartsReference = Pick<Chart.FunnelLabelsProps, "render" | "className">;
export type FunnelReadoutPartsReference = Pick<
  Chart.FunnelTooltipProps,
  "Content" | "valueAnimation" | "className"
>;
export type FunnelReadoutContextReference = Chart.FunnelTooltipContentProps;
export type FunnelTablePartsReference = Pick<
  Chart.FunnelDataTableProps,
  "caption" | "columns" | "className"
>;
export type FunnelTableColumnReference = Chart.FunnelDataColumn;
