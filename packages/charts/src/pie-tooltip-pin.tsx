"use client";

import { Children, createContext, Fragment, isValidElement, type ReactNode } from "react";
import { piePinComponentKind } from "./pie-pin-identity.js";
import type { PieSeriesProps } from "./pie-series.js";

export const PieTooltipPin = createContext<number | undefined>(undefined);

/** Resolve against current rows; the returned index is never retained as identity. */
export function pinnedPieIndex(children: ReactNode, category: string): number | undefined {
  const series: PieSeriesProps[] = [];
  let tooltips = 0;
  let unsupported = false;
  function collect(nodes: ReactNode) {
    Children.forEach(nodes, (child) => {
      if (!isValidElement<PieSeriesProps>(child)) {
        if (child !== null && child !== undefined && typeof child !== "boolean") unsupported = true;
        return;
      }
      if (child.type === Fragment) collect(child.props.children);
      else if (piePinComponentKind(child.type) === "series") series.push(child.props);
      else if (piePinComponentKind(child.type) === "tooltip") tooltips += 1;
      else unsupported = true;
    });
  }
  collect(children);
  const candidate = series[0];
  if (
    series.length !== 1 ||
    tooltips !== 1 ||
    unsupported ||
    !candidate?.data ||
    candidate.categoryKey === undefined
  )
    throw new Error(
      "defaultPinnedCategory requires one direct PieSeries with explicit data and categoryKey, and one direct Tooltip",
    );
  const { data, categoryKey, hide } = candidate;
  if (hide) return undefined;
  const keys = data.map((row) =>
    typeof categoryKey === "function"
      ? categoryKey(row)
      : row !== null && typeof row === "object" && Object.hasOwn(row, categoryKey)
        ? (row as Record<string, unknown>)[categoryKey]
        : undefined,
  );
  // Ambiguous identities are never silently resolved by position, including hidden rows.
  if (keys.filter((key) => key === category).length !== 1) return undefined;
  // Hidden categories still occupy their original angular and native pointer slots.
  const index = keys.indexOf(category);
  return index < 0 ? undefined : index;
}
