"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import type { CategoryKey } from "./category-cells.js";

type Series = { keys: readonly unknown[] | null; hidden: boolean };
type Context = {
  index: number | undefined;
  ready: boolean;
  registerSeries: (id: string, series: Series) => () => void;
  registerTooltip: (id: string) => () => void;
};
export const PieCompositionPin = createContext<Context | null>(null);
/** Mounted parts declare their identity, including through fragments and consumer components. */
export function PiePinRegistry({
  category: defaultCategory,
  children,
}: {
  category?: string | undefined;
  children: ReactNode;
}) {
  const [category] = useState(defaultCategory);
  const [series, setSeries] = useState(() => new Map<string, Series>());
  const [tooltips, setTooltips] = useState(() => new Set<string>());
  const ready = series.size === 1 && tooltips.size === 1;
  const registerSeries = useCallback(
    (id: string, value: Series) => {
      if (category === undefined) return () => {};
      setSeries((current) => new Map(current).set(id, value));
      return () =>
        setSeries((current) => {
          const next = new Map(current);
          next.delete(id);
          return next;
        });
    },
    [category],
  );
  const registerTooltip = useCallback(
    (id: string) => {
      if (category === undefined) return () => {};
      setTooltips((current) => new Set(current).add(id));
      return () =>
        setTooltips((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
    },
    [category],
  );
  if (category !== undefined && (series.size > 1 || tooltips.size > 1))
    throw new Error("defaultPinnedCategory requires one PieChart.Series and one PieChart.Tooltip");
  const item = [...series.values()][0];
  if (category !== undefined && item && !item.keys)
    throw new Error("defaultPinnedCategory requires explicit PieChart.Series data and categoryKey");
  const index =
    category !== undefined &&
    !item?.hidden &&
    tooltips.size === 1 &&
    item?.keys?.filter((key) => key === category).length === 1
      ? item.keys.indexOf(category)
      : undefined;
  const context = useMemo(
    () => ({ index, ready, registerSeries, registerTooltip }),
    [index, ready, registerSeries, registerTooltip],
  );
  return <PieCompositionPin value={context}>{children}</PieCompositionPin>;
}
export function usePieSeriesRegistration<DataPoint>(
  data: readonly DataPoint[] | undefined,
  categoryKey: CategoryKey<DataPoint> | undefined,
  hidden: boolean | undefined,
) {
  const registration = use(PieCompositionPin);
  const id = useId();
  const item = useMemo<Series>(
    () => ({
      hidden: Boolean(hidden),
      keys:
        data && categoryKey !== undefined
          ? data.map((row) =>
              typeof categoryKey === "function"
                ? categoryKey(row)
                : row !== null && typeof row === "object" && Object.hasOwn(row, categoryKey)
                  ? Reflect.get(row, categoryKey)
                  : undefined,
            )
          : null,
    }),
    [data, categoryKey, hidden],
  );
  useLayoutEffect(
    () => registration?.registerSeries(id, item),
    [registration?.registerSeries, id, item],
  );
}
export function usePieTooltipRegistration() {
  const registration = use(PieCompositionPin);
  const id = useId();
  useLayoutEffect(() => registration?.registerTooltip(id), [registration?.registerTooltip, id]);
}
