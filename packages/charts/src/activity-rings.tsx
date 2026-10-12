"use client";

import { type ComponentProps, createContext, type ReactNode, use, useId } from "react";
import { Cell, LabelList, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Tooltip, type TooltipProps } from "./animation.js";
import { useChartInteraction } from "./chart-interaction.js";
import {
  type ChartName,
  type FamilyOptions,
  FamilyRoot,
  familyFrame,
  familyVisibility,
} from "./family-root.js";
import { RadialBarChartFrame, type RadialBarChartProps } from "./polar-chart.js";
import { RadialBarSeries, type RadialBarSeriesProps } from "./polar-series.js";
import { RadialBarLabel } from "./radial-bar-label.js";
import { resolveSeriesLabel } from "./series-label.js";
import { TooltipContent } from "./tooltip-content.js";
import { visibilityLabel } from "./visibility-labels.js";

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
export type ActivityRingsProps = Omit<
  RadialBarChartProps<ActivityRingDatum>,
  "data" | "children" | "layout" | "categoryKey" | "interactionBinding" | keyof FamilyOptions
> &
  FamilyOptions &
  ChartName & {
    "aria-describedby"?: string;
    rings: readonly ActivityRing[];
    /** Default domain for rings without their own domain. Defaults to [0, 100]. */
    domain?: readonly [number, number];
    children: Exclude<ReactNode, undefined>;
  };

/** Ring data normalization with explicitly composed presentation parts. */
export function ActivityRings({
  children,
  rings,
  config,
  domain = [0, 100],
  interaction,
  emphasis,
  nonce,
  frameProps,
  visibleSeries,
  defaultVisibleSeries,
  onVisibleSeriesChange,
  legendPosition,
  width,
  height,
  style,
  className,
  responsive = true,
  accessibilityLayer = true,
  ...chartProps
}: ActivityRingsProps) {
  const descriptionId = useId();
  if (children === undefined) throw new Error("ActivityRings requires explicit children");
  if (!config || typeof config !== "object" || Array.isArray(config))
    throw new Error("ActivityRings requires config");
  if (
    ["rootProps", "series", "labels", "legend", "tooltip"].some((key) =>
      Object.hasOwn(chartProps, key),
    )
  )
    throw new Error(
      "ActivityRings uses explicit Series, Labels, Tooltip and Legend parts; recipe options are unsupported",
    );
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
    <FamilyRoot
      family="ActivityRings"
      name={chartProps}
      loading={chartProps.loading}
      config={activeConfig}
      interaction={interaction ?? { kind: "category", eligibleKeys: keys }}
      {...(emphasis !== undefined ? { emphasis } : {})}
      {...(nonce !== undefined ? { nonce } : {})}
      {...(frameProps !== undefined ? { frameProps } : {})}
      {...familyVisibility({ visibleSeries, defaultVisibleSeries, onVisibleSeriesChange })}
      {...(legendPosition ? { legendPosition } : {})}
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
          {...(!interaction || interaction.kind === "category"
            ? { interactionBinding: "root" as const }
            : {})}
          layout="radial"
          accessibilityLayer={accessibilityLayer}
          responsive={responsive}
          {...(width !== undefined ? { width } : {})}
          {...(height !== undefined ? { height } : {})}
          {...familyFrame(
            {
              width,
              height,
              className: ["kind-ui-activity-rings", className].filter(Boolean).join(" "),
              style,
            },
            300,
          )}
        >
          {children}
        </RadialBarChartFrame>
      </ActivityData>
    </FamilyRoot>
  );
}

const ActivityData = createContext<readonly ActivityRingDatum[] | null>(null);
export type ActivitySeriesProps = Omit<
  RadialBarSeriesProps<ActivityRingDatum, number>,
  "data" | "dataKey" | "seriesKey" | "children" | "angleAxisId" | "radiusAxisId"
> & { children?: ReactNode };
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
  const data = use(ActivityData);
  const { visible } = useChartInteraction();
  if (!data) throw new Error("ActivityRings.Labels requires ActivityRings");
  return (
    <LabelList
      {...visibilityLabel(
        { ...props, content: props.content ?? <RadialBarLabel /> },
        false,
        data.map((ring) => visible !== undefined && !visible.includes(ring.key)),
        undefined,
        data.map((ring) => ring.key),
      )}
      dataKey="label"
    />
  );
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
