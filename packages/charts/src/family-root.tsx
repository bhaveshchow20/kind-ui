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
import { ChartProvider, type ChartProviderProps } from "./chart-provider.js";
import { Legend, type LegendProps } from "./legend.js";
import { cn } from "./utils.js";

export type ChartName =
  | { "aria-label": string; "aria-labelledby"?: string }
  | { "aria-labelledby": string; "aria-label"?: string };
export type FamilyFrameOptions = ChartVisibilityProps &
  Pick<ChartProviderProps, "interaction" | "emphasis" | "nonce"> & {
    legendPosition?: "top" | "bottom";
    /** Attributes, handlers and ref for the outer HTML frame. Plot props remain on the chart. */
    frameProps?: Omit<
      ChartProviderProps,
      | "config"
      | "children"
      | "interaction"
      | "emphasis"
      | "nonce"
      | "visibleSeries"
      | "defaultVisibleSeries"
      | "onVisibleSeriesChange"
    > & { [key: `data-${string}`]: unknown };
  };
export type FamilyOptions = FamilyFrameOptions & Pick<ChartProviderProps, "config">;
/** Every public family owns metadata and its frame; explicit children own the content. */
export type FamilyProps<Props, Explicit = Props> = Omit<
  Explicit,
  keyof FamilyOptions | keyof ChartName | "children" | "rootProps"
> &
  FamilyOptions &
  ChartName & { children: Exclude<ReactNode, undefined> };
const FamilySlot = createContext<{ host: HTMLDivElement | null } | null>(null);
type Instructions = { id: string; text: string };

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
export function OutsidePlot({ children }: { children: ReactNode }) {
  const slot = use(FamilySlot);
  if (!slot) throw new Error("Compound HTML parts require a chart-family frame");
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
  instructions,
  ...options
}: FamilyOptions & {
  family: string;
  children: ReactNode;
  name: { "aria-label"?: string | undefined; "aria-labelledby"?: string | undefined };
  instructions?: Instructions;
}) {
  const parent = use(ChartContext);
  if (parent) throw new Error(`${family} owns its chart frame; do not nest chart families`);
  if (!options.config || typeof options.config !== "object" || Array.isArray(options.config))
    throw new Error(`${family} requires config`);
  if (!name["aria-label"]?.trim() && !name["aria-labelledby"]?.trim())
    throw new Error(`${family} requires aria-label or aria-labelledby`);
  if (children === undefined) throw new Error(`${family} requires explicit children`);
  const {
    config,
    frameProps,
    interaction,
    emphasis,
    nonce,
    visibleSeries,
    defaultVisibleSeries,
    onVisibleSeriesChange,
    legendPosition,
  } = options;
  return (
    <ChartProvider
      {...frameProps}
      config={config}
      {...(interaction !== undefined ? { interaction } : {})}
      {...(emphasis !== undefined ? { emphasis } : {})}
      {...(nonce !== undefined ? { nonce } : {})}
      {...familyVisibility({ visibleSeries, defaultVisibleSeries, onVisibleSeriesChange })}
    >
      {instructions && (
        <p id={instructions.id} data-kind-ui="chart-instructions" className="sr-only">
          {instructions.text}
        </p>
      )}
      <FamilyLayout {...(legendPosition ? { legendPosition } : {})}>{children}</FamilyLayout>
    </ChartProvider>
  );
}

type FrameSizing = {
  width?: number | string | undefined;
  height?: number | string | undefined;
  style?: CSSProperties | undefined;
};
export function familyClass(
  className?: string,
  sizing: FrameSizing = {},
  defaultHeight: 280 | 300 = 280,
) {
  return cn(
    "min-w-0",
    sizing.width === undefined && sizing.style?.width === undefined && "w-full",
    sizing.height === undefined &&
      sizing.style?.height === undefined &&
      (defaultHeight === 300 ? "h-[300px]" : "h-[280px]"),
    className,
  );
}
/** Consumer dimensions and inline styles take precedence over sizing defaults. */
export function familyFrame(
  props: FrameSizing & { className?: string | undefined },
  defaultHeight: 280 | 300 = 280,
) {
  return {
    className: familyClass(props.className, props, defaultHeight),
    style: {
      ...(props.width !== undefined ? { width: props.width } : {}),
      ...(props.height !== undefined ? { height: props.height } : {}),
      ...props.style,
    },
  };
}

type NativeFrame = FrameSizing & {
  children?: ReactNode;
  responsive?: boolean | undefined;
  className?: string | undefined;
  "aria-label"?: string | undefined;
  "aria-labelledby"?: string | undefined;
};
/** Only frame ownership is shared; each supplied native renderer retains its geometry contract. */
export function familyChart<Props extends NativeFrame>(
  Component: ComponentType<Props>,
  props: FamilyProps<Props>,
  family: string,
  instructions?: Instructions,
) {
  const {
    config,
    frameProps,
    interaction,
    emphasis,
    nonce,
    visibleSeries,
    defaultVisibleSeries,
    onVisibleSeriesChange,
    legendPosition,
    ...rest
  } = props;
  if (Object.hasOwn(props, "rootProps"))
    throw new Error(`${family} uses direct chart options and frameProps; remove rootProps`);
  const chartProps = rest as unknown as Props;
  if (chartProps.children === undefined) throw new Error(`${family} requires explicit children`);
  return (
    <FamilyRoot
      family={family}
      config={config}
      name={chartProps}
      {...(frameProps ? { frameProps } : {})}
      {...(interaction !== undefined ? { interaction } : {})}
      {...(emphasis !== undefined ? { emphasis } : {})}
      {...(nonce !== undefined ? { nonce } : {})}
      {...familyVisibility({ visibleSeries, defaultVisibleSeries, onVisibleSeriesChange })}
      {...(legendPosition ? { legendPosition } : {})}
      {...(instructions ? { instructions } : {})}
    >
      <Component
        {...chartProps}
        responsive={chartProps.responsive ?? true}
        {...familyFrame(chartProps)}
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
  // Defer callback validation to the mounted provider so ownership changes fail first.
  if (onVisibleSeriesChange) return { onVisibleSeriesChange } as ChartVisibilityProps;
  return {};
}
