import type { ChartModel } from "@kind-ui/charts-core";
import { describePoint, formatX, formatY, type SelectionProps } from "./shared.js";

export type DataTableProps = SelectionProps & {
  readonly model: ChartModel;
  readonly caption: string;
};

/** Plain HTML provides exact values and a keyboard-accessible selection alternative. */
export function DataTable({ model, caption, selectedId, onSelectionChange }: DataTableProps) {
  return (
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Observation</th>
          <th scope="col">X{model.x.kind === "time" ? " (UTC instant)" : ""}</th>
          <th scope="col">Value{model.y.unit ? ` (${model.y.unit})` : ""}</th>
          {onSelectionChange && <th scope="col">Selection</th>}
        </tr>
      </thead>
      <tbody>
        {model.points.map((point) => (
          <tr key={point.id} data-selected={selectedId === point.id || undefined}>
            <th scope="row">{point.label}</th>
            <td>{formatX(model, point.x, true)}</td>
            <td>
              {point.rawY === null
                ? point.imputed
                  ? "Missing (shown as 0)"
                  : "Missing"
                : formatY(model, point.rawY)}
            </td>
            {onSelectionChange && (
              <td>
                <button
                  type="button"
                  aria-label={`Select ${describePoint(model, point)}`}
                  aria-pressed={selectedId === point.id}
                  onClick={() => onSelectionChange(selectedId === point.id ? null : point.id)}
                >
                  {selectedId === point.id ? "Selected" : "Select"}
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
