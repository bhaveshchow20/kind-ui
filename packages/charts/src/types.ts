import type { ComponentType, ReactNode } from "react";
import type { TooltipValueType } from "recharts";

export type SeriesConfig = Readonly<
  Record<
    string,
    {
      label: string;
      color: string;
      /** Decorative glyph shared by built-in legend and tooltip content. */
      icon?: ComponentType;
      formatValue?: (value: TooltipValueType) => ReactNode;
    }
  >
>;
