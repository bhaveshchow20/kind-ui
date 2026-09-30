import { scaleLinear, scaleUtc } from "d3-scale";
import { line } from "d3-shape";
import type { ChartModel, LineGeometry, PlotInsets, PlotSize, PositionedPoint } from "./types.js";

const DEFAULT_INSETS: PlotInsets = { top: 24, right: 24, bottom: 52, left: 72 };

/** Numeric geometry only. Theme and React cannot change the data model. */
export function createLineGeometry(
  model: ChartModel,
  size: PlotSize,
  insets: PlotInsets = DEFAULT_INSETS,
): LineGeometry {
  if (
    ![size.width, size.height, ...Object.values(insets)].every(Number.isFinite) ||
    Object.values(insets).some((value) => value < 0) ||
    size.width <= insets.left + insets.right ||
    size.height <= insets.top + insets.bottom
  ) {
    throw new RangeError(
      "Chart size must leave a positive plot area with finite, nonnegative insets",
    );
  }
  const plot = {
    left: insets.left,
    right: size.width - insets.right,
    top: insets.top,
    bottom: size.height - insets.bottom,
  };
  const x = scaleLinear().domain(model.xDomain).range([plot.left, plot.right]);
  const y = scaleLinear().domain(model.yDomain).range([plot.bottom, plot.top]);
  const points = model.points.map((point) => ({
    ...point,
    px: x(point.x),
    py: point.y === null ? null : y(point.y),
  }));
  const path = line<PositionedPoint>()
    .defined((point) => point.py !== null)
    .x((point) => point.px)
    .y((point) => point.py ?? 0)(points);
  // Calendar intervals may loop after offsetting beyond Date limits.
  // Outside ordinary ISO years, use safe numeric epoch ticks instead.
  const calendarTicksSafe =
    model.xDomain[0] >= -62_135_596_800_000 && model.xDomain[1] <= 253_402_300_799_999;
  const xValues =
    model.x.kind === "time" && calendarTicksSafe
      ? scaleUtc()
          .domain(model.xDomain.map((value) => new Date(value)))
          .ticks(5)
          .map(Number)
      : x.ticks(5);
  return {
    path,
    points,
    xTicks: xValues.map((value) => ({ value, position: x(value) })),
    yTicks: y.ticks(5).map((value) => ({ value, position: y(value) })),
    plot,
  };
}
