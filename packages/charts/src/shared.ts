import type { ChartModel, Point } from "@kind-ui/charts-core";

/** Controlled, or entirely read-only. There is no hidden selection store. */
export type SelectionProps =
  | { readonly selectedId: string | null; readonly onSelectionChange: (id: string | null) => void }
  | { readonly selectedId?: never; readonly onSelectionChange?: never };

export function formatX(model: ChartModel, value: number, exact = false): string {
  if (model.x.kind === "number") return `${value}${model.x.unit ? ` ${model.x.unit}` : ""}`;
  if (exact) return new Date(value).toISOString();
  return new Intl.DateTimeFormat("en-US", {
    timeZone: model.x.timeZone,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
export function formatY(model: ChartModel, value: number): string {
  return `${value}${model.y.unit ? ` ${model.y.unit}` : ""}`;
}
export function describePoint(model: ChartModel, point: Point): string {
  const value =
    point.rawY === null
      ? point.imputed
        ? "Missing (shown as 0)"
        : "Missing"
      : formatY(model, point.rawY);
  return `${point.label}: ${formatX(model, point.x, true)}, ${value}`;
}
