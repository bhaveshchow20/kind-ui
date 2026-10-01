import type { ReactNode } from "react";
import type { TooltipValueType } from "recharts";

export type SeriesConfig = Readonly<
  Record<
    string,
    {
      label: string;
      color: string;
      formatValue?: (value: TooltipValueType) => ReactNode;
    }
  >
>;
