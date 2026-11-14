"use client";

import { Children, cloneElement, Fragment, isValidElement, type ReactNode } from "react";
import { Cell } from "recharts";
import type { SeriesConfig } from "./types.js";

/** Category identity is an own field or an accessor, never an array position. */
export type CategoryKey<Row> = (keyof Row & string) | ((row: Row) => string);

/** Only Pie and Radial category mode use this native Cell defaulting seam. */
export function categoryCells<Row>(
  data: readonly Row[] | undefined,
  categoryKey: CategoryKey<Row>,
  config: SeriesConfig,
  children: ReactNode,
  fill: string | undefined,
): ReactNode {
  if (!data) throw new Error("Category color defaults require explicit data");
  const colors = data.map((row) => {
    const key =
      typeof categoryKey === "function"
        ? categoryKey(row)
        : row !== null && typeof row === "object" && Object.hasOwn(row, categoryKey)
          ? row[categoryKey]
          : undefined;
    if (typeof key !== "string" || !Object.hasOwn(config, key))
      throw new Error("categoryKey must resolve to a string key in Root.config for every row");
    const datumFill =
      row !== null && typeof row === "object" && "fill" in row ? row.fill : undefined;
    return fill === undefined && datumFill === undefined ? `var(--color-${key})` : undefined;
  });
  if (fill !== undefined) return children;
  let index = 0;
  function defaults(parts: ReactNode): ReactNode {
    return Children.map(parts, (child) => {
      if (!isValidElement<{ fill?: string; children?: ReactNode }>(child)) return child;
      if (child.type === Fragment) return cloneElement(child, {}, defaults(child.props.children));
      if (child.type !== Cell) return child;
      const color = colors[index++];
      return child.props.fill === undefined && color !== undefined
        ? cloneElement(child, { fill: color })
        : child;
    });
  }
  const resolved = defaults(children);
  return (
    <>
      {resolved}
      {colors.slice(index).map((color, offset) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Native Cell alignment is positional; Cells hold no consumer state.
        <Cell key={`kind-category-${index + offset}`} {...(color ? { fill: color } : {})} />
      ))}
    </>
  );
}
