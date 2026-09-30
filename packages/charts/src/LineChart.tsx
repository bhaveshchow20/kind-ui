import { type ChartModel, createLineGeometry } from "@kind-ui/charts-core";
import { useId, useMemo } from "react";
import { describePoint, formatX, formatY, type SelectionProps } from "./shared.js";
import { type ChartTheme, lightTheme } from "./theme.js";

export type LineChartProps = SelectionProps & {
  readonly model: ChartModel;
  readonly title: string;
  readonly description?: string;
  /** Logical SVG dimensions; CSS scales the viewBox to the container. */
  readonly width?: number;
  readonly height?: number;
  readonly theme?: ChartTheme;
};

export function LineChart({
  model,
  title,
  description,
  width = 720,
  height = 320,
  theme = lightTheme,
  selectedId,
  onSelectionChange,
}: LineChartProps) {
  const id = useId();
  const geometry = useMemo(
    () => createLineGeometry(model, { width, height }),
    [model, width, height],
  );
  const summary =
    description ??
    `Line chart with ${model.points.length} observations. Missing values: ${model.missing}. ${onSelectionChange ? "Focus a point and press Enter or Space to select it; Escape clears selection." : "Exact values are available in the companion data table."}`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role={onSelectionChange ? "group" : "img"}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        background: theme.background,
        color: theme.foreground,
        fontFamily: "inherit",
      }}
    >
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-description`}>{summary}</desc>
      {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: Static SVG guides have no events or tabindex and are explicitly nonfocusable. */}
      <g aria-hidden="true" focusable="false">
        {geometry.yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={geometry.plot.left}
              x2={geometry.plot.right}
              y1={tick.position}
              y2={tick.position}
              stroke={theme.grid}
            />
            <text
              x={geometry.plot.left - 10}
              y={tick.position}
              dy="0.35em"
              textAnchor="end"
              fill={theme.muted}
              fontSize={12}
            >
              {formatY(model, tick.value)}
            </text>
          </g>
        ))}
        {geometry.xTicks.map((tick) => (
          <text
            key={tick.value}
            x={tick.position}
            y={geometry.plot.bottom + 25}
            textAnchor="middle"
            fill={theme.muted}
            fontSize={11}
          >
            {formatX(model, tick.value)}
          </text>
        ))}
        {geometry.path && (
          <path
            data-chart-line=""
            d={geometry.path}
            fill="none"
            stroke={theme.line}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </g>
      {geometry.points.map((point) => {
        if (point.py === null) return null;
        const mark = (
          <circle
            data-point-id={point.id}
            cx={point.px}
            cy={point.py}
            r={selectedId === point.id ? 7 : 5}
            fill={point.imputed ? theme.background : theme.line}
            stroke={selectedId === point.id ? theme.selected : theme.line}
            strokeWidth={selectedId === point.id ? 3 : 2}
          />
        );
        if (!onSelectionChange) return <g key={point.id}>{mark}</g>;
        return (
          // biome-ignore lint/a11y/useSemanticElements: HTML buttons cannot be SVG children; this SVG control mirrors a native table button.
          <g
            key={point.id}
            role="button"
            tabIndex={0}
            aria-label={describePoint(model, point)}
            aria-pressed={selectedId === point.id}
            onClick={() => onSelectionChange(selectedId === point.id ? null : point.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectionChange(selectedId === point.id ? null : point.id);
              } else if (event.key === "Escape") {
                event.preventDefault();
                onSelectionChange(null);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {mark}
          </g>
        );
      })}
      {model.points.every((point) => point.y === null) && (
        <text x={width / 2} y={height / 2} textAnchor="middle" fill={theme.foreground}>
          No observed values
        </text>
      )}
    </svg>
  );
}
