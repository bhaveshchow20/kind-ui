import type { ComponentProps, ComponentType, ReactNode } from "react";
import type { Symbols, TooltipValueType } from "recharts";

import type { FillPattern } from "./fill-pattern.js";

export type SeriesConfig = Readonly<
  Record<
    string,
    {
      /** Inferred from the matching key when omitted; explicit text takes precedence. */
      label?: string;
      color: string;
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
