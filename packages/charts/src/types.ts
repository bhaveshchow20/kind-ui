import type { ComponentProps, ComponentType, ReactNode } from "react";
import type { Symbols, TooltipValueType } from "recharts";

import type { FillPattern } from "./fill-pattern.js";

/** Arrays are evenly distributed gradient stops, not category palettes. */
export type SeriesColor =
  | string
  | readonly string[]
  | { readonly light: string | readonly string[]; readonly dark: string | readonly string[] };

export type SeriesConfig = Readonly<
  Record<
    string,
    {
      /** Inferred from the matching key when omitted; explicit text takes precedence. */
      label?: string;
      color: SeriesColor;
      /** Optional implicit bar paint and built-in legend encoding. */
      pattern?: FillPattern;
      /** Decorative glyph shared by built-in legend and tooltip content. */
      icon?: ComponentType;
      /** Explicit legend-only native symbol; reuse this value for ScatterSeries.shape. */
      legendShape?: NonNullable<ComponentProps<typeof Symbols>["type"]>;
      formatValue?: (value: TooltipValueType) => ReactNode;
    }
  >
>;
