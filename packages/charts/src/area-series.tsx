"use client";

import { type ComponentProps, useId, useLayoutEffect, useRef } from "react";
import { Area, DefaultZIndexes, ZIndexLayer } from "recharts";
import { ActiveMarker } from "./animation.js";
import { type AreaMaterial, MaterialArea } from "./area-material.js";
import { useChart } from "./chart-context.js";
import { type FillPattern, FillPatternDefinition, patternResourceId } from "./fill-pattern.js";
import { useLineInteraction } from "./line-chart.js";
import { SeriesInteractionLayer, useSeriesInteraction } from "./series-interaction.js";

export type AreaSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof Area<DataPoint, Value>>,
  "isAnimationActive"
> & {
  /** Metadata/visibility key, required only for function or numeric data keys. */
  seriesKey?: string;
  /** Finish on the native area; explicit shape/filter retain consumer ownership. */
  material?: AreaMaterial;
  /** Static fill encoding; none opts out of configured patterns. Native paint/shape wins. */
  pattern?: FillPattern | false | undefined;
};

/** A registered Recharts Area with Root colors and controlled visibility. */
export function AreaSeries<DataPoint = unknown, Value = unknown>({
  seriesKey,
  material = "plain",
  pattern,
  hide,
  stroke,
  fill,
  className,
  ...props
}: AreaSeriesProps<DataPoint, Value>) {
  const { config, paints, visibleSeries } = useChart();
  const { registerSeries, invalidate } = useLineInteraction();
  const generatedId = useId();
  const id = props.id || generatedId;
  const key = seriesKey ?? (typeof props.dataKey === "string" ? props.dataKey : undefined);
  const effectiveHide =
    hide === true || (visibleSeries !== undefined && !visibleSeries.includes(key ?? ""));
  const previous = useRef({ data: props.data, hide: effectiveHide });
  useLayoutEffect(() => {
    if (props.data !== previous.current.data || effectiveHide !== previous.current.hide)
      invalidate();
    previous.current = { data: props.data, hide: effectiveHide };
  }, [props.data, effectiveHide, invalidate]);
  useLayoutEffect(() => {
    if (key === undefined) return;
    return registerSeries(id, key);
  }, [id, key, registerSeries]);
  if (key === undefined && visibleSeries !== undefined)
    throw new Error("AreaSeries requires seriesKey for controlled non-string dataKey");
  const configuredPattern = key && Object.hasOwn(config, key) ? config[key]?.pattern : undefined;
  const resolvedPattern = pattern === false ? undefined : (pattern ?? configuredPattern);
  const patternId = patternResourceId(generatedId);
  const patterned =
    resolvedPattern !== undefined &&
    fill === undefined &&
    props.style?.fill === undefined &&
    props.shape === undefined;
  const interaction = useSeriesInteraction(
    key,
    effectiveHide,
    hide === true,
    props.data,
    props.onClick,
  );
  const color = stroke ?? (key && Object.hasOwn(config, key) ? paints[key] : undefined);
  return (
    <>
      {patterned && (
        <defs pointerEvents="none">
          <FillPatternDefinition
            id={patternId}
            pattern={resolvedPattern}
            baseColor={
              stroke ?? (key && Object.hasOwn(config, key) ? `var(--color-${key})` : "currentColor")
            }
          />
        </defs>
      )}
      <ZIndexLayer zIndex={props.zIndex ?? DefaultZIndexes.area}>
        <SeriesInteractionLayer seriesKey={key} hidden={effectiveHide}>
          <Area
            activeDot={<ActiveMarker />}
            {...props}
            {...(interaction.onClick !== undefined ? { onClick: interaction.onClick } : {})}
            {...(material !== "plain" && props.shape === undefined && props.filter === undefined
              ? {
                  shape: (
                    <MaterialArea material={material} filterId={`${generatedId}-area-material`} />
                  ),
                }
              : {})}
            isAnimationActive={false}
            id={id}
            zIndex={0}
            hide={effectiveHide}
            {...(color !== undefined ? { stroke: color } : {})}
            {...(fill !== undefined
              ? { fill }
              : patterned
                ? { fill: `url(#${patternId})` }
                : color !== undefined
                  ? { fill: color }
                  : {})}
            className={["kind-ui-area-series", className].filter(Boolean).join(" ")}
          />
        </SeriesInteractionLayer>
      </ZIndexLayer>
    </>
  );
}
