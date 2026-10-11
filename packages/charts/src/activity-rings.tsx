"use client";

import { type ComponentProps, createContext, type ReactNode, use, useContext, useId } from "react";
import { Cell, LabelList, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Tooltip, type TooltipProps } from "./animation.js";
import { ChartContext } from "./chart-context.js";
import { FamilyLayout } from "./family-root.js";
import { Legend, type LegendProps } from "./legend.js";
import { RadialBarChartFrame, type RadialBarChartProps } from "./polar-chart.js";
import { RadialBarSeries, type RadialBarSeriesProps } from "./polar-series.js";
import { RadialBarLabel } from "./radial-bar-label.js";
import { Root, type RootProps } from "./root.js";
import { resolveSeriesLabel } from "./series-label.js";
import { TooltipContent } from "./tooltip-content.js";
import type { SeriesConfig } from "./types.js";

type ActivityRootProps = RootProps extends infer Props
  ? Props extends object
    ? Omit<Props, "config" | "children">
    : never
  : never;

export type ActivityRing = {
  /** Stable metadata identity in config. Array order controls ring order. */
  key: string;
  value: number;
  /** Inclusive finite bounds; values outside them are clamped visually only. */
  domain?: readonly [number, number];
  /** Native per-ring paint and handlers override configured paint. */
  cellProps?: ComponentProps<typeof Cell>;
};
export type ActivityRingDatum = ActivityRing & {
  label: string;
  progress: number;
  /** Preserved through native computed sector payloads, whose value is normalized. */
  rawValue: number;
};
type Name =
  | { "aria-label": string; "aria-labelledby"?: string }
  | { "aria-labelledby": string; "aria-label"?: string };

type ActivityBaseProps = Omit<
  RadialBarChartProps<ActivityRingDatum>,
  "data" | "children" | "layout" | "categoryKey"
> &
  Name & {
    "aria-describedby"?: string;
    rings: readonly ActivityRing[];
    config: SeriesConfig;
    /** Default domain for rings without their own domain. Defaults to [0, 100]. */
    domain?: readonly [number, number];
    children?: ReactNode;
    /** Native chart geometry remains available: radii, center, angles and gaps. */
    series?: Omit<
      RadialBarSeriesProps<ActivityRingDatum, number>,
      "data" | "dataKey" | "seriesKey" | "children" | "angleAxisId" | "radiusAxisId"
    >;
    labels?: false | Omit<ComponentProps<typeof LabelList>, "dataKey">;
    legend?: false | LegendProps;
    /** Custom content receives native payload with original value and normalized progress. */
    tooltip?: false | TooltipProps;
    rootProps?: ActivityRootProps;
  };

export type ActivityRingsProps = Omit<
  ActivityBaseProps,
  "children" | "series" | "labels" | "legend" | "tooltip"
> &
  Name &
  (
    | (Pick<ActivityBaseProps, "series" | "labels" | "legend" | "tooltip"> & {
        children?: undefined;
      })
    | {
        children: Exclude<ReactNode, undefined>;
        series?: never;
        labels?: never;
        legend?: never;
        tooltip?: never;
      }
  );

/** A narrow progress recipe; native RadialBarChart remains the full composition escape hatch. */
export function ActivityRings({
  children,
  rings,
  config,
  domain = [0, 100],
  series,
  labels,
  legend,
  tooltip,
  rootProps,
  width,
  height,
  style,
  className,
  responsive = true,
  accessibilityLayer = true,
  ...chartProps
}: ActivityRingsProps) {
  const parent = useContext(ChartContext);
  const explicit = children !== undefined;
  if (explicit && [series, labels, legend, tooltip].some((part) => part !== undefined))
    throw new Error(
      "Explicit ActivityRings children replace generated parts; remove series, labels, legend and tooltip options",
    );
  const tooltipOptions = tooltip === false ? undefined : tooltip;
  const descriptionId = useId();
  if (parent)
    throw new Error("ActivityRings owns Root; use native RadialBarChart inside Root instead");
  if (!chartProps["aria-label"]?.trim() && !chartProps["aria-labelledby"]?.trim())
    throw new Error("ActivityRings requires aria-label or aria-labelledby");
  const keys = rings.map((ring) => ring.key);
  if (new Set(keys).size !== keys.length) throw new Error("ActivityRings ring keys must be unique");
  const data = rings.map((ring) => {
    if (!Object.hasOwn(config, ring.key))
      throw new Error(`ActivityRings ring key "${ring.key}" must exist in config`);
    const [min, max] = ring.domain ?? domain;
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min || !Number.isFinite(max - min))
      throw new Error("ActivityRings domains require finite increasing bounds");
    if (!Number.isFinite(ring.value))
      throw new Error("ActivityRings values must be finite numbers");
    return {
      ...ring,
      // biome-ignore lint/style/noNonNullAssertion: Object.hasOwn above rejects ring keys absent from config.
      label: resolveSeriesLabel(ring.key, config[ring.key]!.label),
      rawValue: ring.value,
      progress: Math.max(0, Math.min(100, ((ring.value - min) / (max - min)) * 100)),
    };
  });
  // biome-ignore lint/style/noNonNullAssertion: Every key was validated against config while constructing data.
  const activeConfig = Object.fromEntries(keys.map((key) => [key, config[key]!]));
  const describedBy = [chartProps["aria-describedby"], descriptionId].filter(Boolean).join(" ");
  return (
    <Root
      {...rootProps}
      config={activeConfig}
      interaction={rootProps?.interaction ?? { kind: "category", eligibleKeys: keys }}
    >
      <dl
        id={descriptionId}
        data-kind-ui="chart-instructions"
        className="sr-only"
        aria-hidden={chartProps.loading || undefined}
      >
        {data.map((ring) => (
          <div key={ring.key}>
            <dt>{ring.label}</dt>
            {/* biome-ignore lint/style/noNonNullAssertion: Every rendered ring key was validated against config above. */}
            <dd>{config[ring.key]!.formatValue?.(ring.rawValue) ?? ring.rawValue}</dd>
          </div>
        ))}
      </dl>
      <ActivityData value={data}>
        <FamilyLayout>
          <RadialBarChartFrame<ActivityRingDatum>
            skeletonFamily="activity-rings"
            innerRadius="30%"
            outerRadius="90%"
            startAngle={90}
            endAngle={-270}
            barCategoryGap="15%"
            {...chartProps}
            aria-describedby={describedBy}
            data={data}
            categoryKey="key"
            {...(!rootProps?.interaction || rootProps.interaction.kind === "category"
              ? { interactionBinding: "root" as const }
              : {})}
            layout="radial"
            accessibilityLayer={accessibilityLayer}
            responsive={responsive}
            {...(width !== undefined ? { width } : {})}
            {...(height !== undefined ? { height } : {})}
            className={["kind-ui-activity-rings", className].filter(Boolean).join(" ")}
            style={{ width: width ?? "100%", height: height ?? 300, ...style }}
          >
            {explicit ? (
              children
            ) : (
              <>
                <ActivitySeries {...series}>
                  {labels !== undefined && labels !== false && <ActivityLabels {...labels} />}
                </ActivitySeries>
                {tooltip !== false && <ActivityTooltip {...tooltipOptions} />}
              </>
            )}
          </RadialBarChartFrame>
        </FamilyLayout>
      </ActivityData>
      {!explicit && legend !== false && <Legend {...legend} />}
    </Root>
  );
}

const ActivityData = createContext<readonly ActivityRingDatum[] | null>(null);
export type ActivitySeriesProps = NonNullable<ActivityRingsProps["series"]> & {
  children?: ReactNode;
};
export function ActivitySeries({ children, ...props }: ActivitySeriesProps) {
  const data = use(ActivityData);
  if (!data) throw new Error("ActivityRings.Series requires ActivityRings");
  return (
    <>
      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
      <PolarRadiusAxis type="category" dataKey="key" tick={false} axisLine={false} />
      <RadialBarSeries<ActivityRingDatum, number>
        background
        cornerRadius="50%"
        {...props}
        dataKey="progress"
      >
        {data.some((ring) => ring.cellProps !== undefined) &&
          data.map((ring) => <Cell key={ring.key} {...ring.cellProps} />)}
        {children}
      </RadialBarSeries>
    </>
  );
}
export function ActivityLabels(props: Omit<ComponentProps<typeof LabelList>, "dataKey">) {
  return <LabelList {...props} content={props.content ?? <RadialBarLabel />} dataKey="label" />;
}
export function ActivityTooltip(props: TooltipProps) {
  const data = use(ActivityData);
  if (!data) throw new Error("ActivityRings.Tooltip requires ActivityRings");
  return (
    <Tooltip
      content={(native) => (
        <TooltipContent
          tooltip={{
            ...native,
            payload: native.payload.map((entry) => {
              const rawValue = (entry.payload as ActivityRingDatum | undefined)?.rawValue;
              return rawValue === undefined ? entry : { ...entry, value: rawValue };
            }),
          }}
          itemKey={
            props.itemKey ??
            ((entry) =>
              (entry.payload as ActivityRingDatum | undefined)?.key ?? String(entry.dataKey))
          }
          {...(props.valueAnimation ? { valueAnimation: props.valueAnimation } : {})}
          hideLabel
        />
      )}
      {...props}
    />
  );
}
