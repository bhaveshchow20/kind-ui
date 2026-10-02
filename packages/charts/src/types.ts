import type { ComponentProps, ComponentType, ReactNode } from "react";
import type { Symbols, TooltipValueType } from "recharts";

export type SeriesConfig = Readonly<
  Record<
    string,
    {
      label: string;
      color: string;
      /** Decorative glyph shared by built-in legend and tooltip content. */
      icon?: ComponentType;
      /** Explicit legend-only native symbol; reuse this value for ScatterSeries.shape. */
      legendShape?: NonNullable<ComponentProps<typeof Symbols>["type"]>;
      formatValue?: (value: TooltipValueType) => ReactNode;
    }
  >
>;
