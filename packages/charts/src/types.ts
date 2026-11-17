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
      /** The name the legend and tooltip show. Omit it to derive one from the key: `monthlyVisitors` becomes "Monthly visitors". */
      label?: string;
      /** A CSS color, an array of gradient stops, or `{ light, dark }` with one of either per color scheme. */
      color: SeriesColor;
      /** A fill pattern for bars and areas, also drawn in the legend swatch. */
      pattern?: FillPattern;
      /** A decorative icon shown in place of the color marker in the legend and tooltip. */
      icon?: ComponentType;
      /** The legend marker's symbol, like `"circle"` or `"triangle"`. Match it to a scatter series' `shape`. */
      legendShape?: NonNullable<ComponentProps<typeof Symbols>["type"]>;
      /** Formats this series' values in the tooltip. */
      formatValue?: (value: TooltipValueType) => ReactNode;
    }
  >
>;
