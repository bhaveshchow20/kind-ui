"use client";

import {
  type ComponentType,
  type CSSProperties,
  createContext,
  type ReactNode,
  use,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChartContext } from "./chart-context.js";
import type { ChartVisibilityProps } from "./chart-interaction.js";
import { Legend, type LegendProps } from "./legend.js";
import { Root, type RootProps } from "./root.js";
import { cn } from "./utils.js";

export type ChartName =
  | { "aria-label": string; "aria-labelledby"?: string }
  | { "aria-labelledby": string; "aria-label"?: string };
export type FamilyFrameOptions = ChartVisibilityProps & {
  legendPosition?: "top" | "bottom";
  rootProps?: Omit<
    RootProps,
    "config" | "children" | "visibleSeries" | "defaultVisibleSeries" | "onVisibleSeriesChange"
  >;
};
export type FamilyOptions = FamilyFrameOptions & Pick<RootProps, "config">;
/** A family can own its frame, or retain the original native composition contract. */
export type FamilyProps<Props, Explicit = Props> =
  | (Props & {
      config?: never;
      rootProps?: never;
      legendPosition?: never;
      visibleSeries?: never;
      defaultVisibleSeries?: never;
      onVisibleSeriesChange?: never;
    })
  | (Explicit & FamilyOptions & ChartName & { children: ReactNode });
const FamilySlot = createContext<{ host: HTMLDivElement | null } | null>(null);

/** Mount HTML parts outside the engine while retaining their React context and handlers. */
export function FamilyLayout({
  children,
  legendPosition = "bottom",
}: {
  children: ReactNode;
  legendPosition?: "top" | "bottom";
}) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const slot = <div data-kind-ui="chart-parts" className="empty:hidden" ref={setHost} />;
  return (
    <FamilySlot value={{ host }}>
      {legendPosition === "top" && slot}
      {children}
      {legendPosition === "bottom" && slot}
    </FamilySlot>
  );
}
export function useFamilyOwned() {
  return use(FamilySlot) !== null;
}
export function OutsidePlot({ children }: { children: ReactNode }) {
  const slot = use(FamilySlot);
  if (!slot) throw new Error("Compound HTML parts require a chart-family root with config");
  return slot.host ? createPortal(children, slot.host) : null;
}
export function FamilyLegend(props: LegendProps) {
  return (
    <OutsidePlot>
      <Legend {...props} />
    </OutsidePlot>
  );
}
export function FamilyRoot({
  family,
  children,
  name,
  ...options
}: FamilyOptions & {
  family: string;
  children: ReactNode;
  name: { "aria-label"?: string | undefined; "aria-labelledby"?: string | undefined };
}) {
  const parent = use(ChartContext);
  if (parent) throw new Error(`${family} with config owns Root; remove the surrounding Root`);
  if (!name["aria-label"]?.trim() && !name["aria-labelledby"]?.trim())
    throw new Error(`${family} requires aria-label or aria-labelledby`);
  if (children === undefined) throw new Error(`${family} requires explicit children`);
  const {
    config,
    rootProps,
    visibleSeries,
    defaultVisibleSeries,
    onVisibleSeriesChange,
    legendPosition,
  } = options;
  return (
    <Root
      {...rootProps}
      config={config}
      {...familyVisibility({ visibleSeries, defaultVisibleSeries, onVisibleSeriesChange })}
    >
      <FamilyLayout {...(legendPosition ? { legendPosition } : {})}>{children}</FamilyLayout>
    </Root>
  );
}
export const familyChartClass = "w-full min-w-0 h-[280px]";
export function familyClass(className?: string) {
  return cn(familyChartClass, className);
}

type NativeFrame = {
  children?: ReactNode;
  responsive?: boolean | undefined;
  width?: number | string | undefined;
  height?: number | string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
};
/** Only frame ownership is shared; the supplied family retains its native contract and renderer. */
export function familyChart<Props extends NativeFrame>(
  Component: ComponentType<Props>,
  props: FamilyProps<Props>,
  family: string,
) {
  const {
    config,
    rootProps,
    visibleSeries,
    defaultVisibleSeries,
    onVisibleSeriesChange,
    legendPosition,
    ...rest
  } = props;
  // Remove only the frame options introduced by this adapter. Family fields pass through intact.
  const chartProps = rest as Props;
  if (config === undefined) {
    if (
      [rootProps, visibleSeries, defaultVisibleSeries, onVisibleSeriesChange, legendPosition].some(
        (option) => option !== undefined,
      )
    )
      throw new Error(`${family} frame options require config`);
    return <Component {...chartProps} />;
  }
  if (chartProps.children === undefined) throw new Error(`${family} requires explicit children`);
  return (
    <FamilyRoot
      family={family}
      config={config}
      name={chartProps}
      {...(rootProps ? { rootProps } : {})}
      {...familyVisibility({ visibleSeries, defaultVisibleSeries, onVisibleSeriesChange })}
      {...(legendPosition ? { legendPosition } : {})}
    >
      <Component
        {...chartProps}
        responsive={chartProps.responsive ?? true}
        className={familyClass(chartProps.className)}
        style={{
          ...(chartProps.width !== undefined ? { width: chartProps.width } : {}),
          ...(chartProps.height !== undefined ? { height: chartProps.height } : {}),
          ...chartProps.style,
        }}
      />
    </FamilyRoot>
  );
}

export function familyVisibility(options: {
  visibleSeries?: readonly string[] | undefined;
  defaultVisibleSeries?: readonly string[] | undefined;
  onVisibleSeriesChange?: ((next: string[]) => void) | undefined;
}): ChartVisibilityProps {
  const { visibleSeries, defaultVisibleSeries, onVisibleSeriesChange } = options;
  const callback = onVisibleSeriesChange ? { onVisibleSeriesChange } : {};
  if (visibleSeries !== undefined) {
    if (defaultVisibleSeries !== undefined)
      throw new Error("Chart visibility cannot be both controlled and defaulted");
    return { visibleSeries, ...callback };
  }
  if (defaultVisibleSeries !== undefined) return { defaultVisibleSeries, ...callback };
  if (onVisibleSeriesChange)
    throw new Error(
      "Chart requires visibleSeries or defaultVisibleSeries when onVisibleSeriesChange is provided",
    );
  return {};
}
