"use client";

import { type ComponentProps, cloneElement, isValidElement } from "react";
import { ReferenceLine, useChartLayout } from "recharts";
import { BarSeries, type BarSeriesProps } from "./bar-series.js";
import { useChart } from "./chart-context.js";
import { SeriesEscapePaint } from "./series-escape-paint.js";
import { visibilityLabel } from "./visibility-labels.js";
import type { WaterfallDatum } from "./waterfall-data.js";

export type WaterfallSeriesProps = Omit<
  BarSeriesProps,
  "dataKey" | "data" | "stackId" | "minPointSize"
>;

/** Native numeric range Bar. Children, shape, cells, labels, refs and events stay native. */
export function WaterfallSeries(props: WaterfallSeriesProps) {
  for (const key of ["dataKey", "data", "stackId", "minPointSize"])
    if (key in props) throw new Error(`WaterfallSeries does not accept ${key}`);
  return <BarSeries {...props} dataKey="range" minPointSize={0} />;
}

export type WaterfallConnectorsProps = Omit<
  ComponentProps<typeof ReferenceLine>,
  "x" | "y" | "segment" | "children"
> & {
  data: readonly WaterfallDatum[];
  /** Match the WaterfallSeries metadata key and native hide state. */
  seriesKey?: string;
  hide?: boolean;
};

/** Native axis-scaled connectors. Place before bars so the center endpoints sit underneath. */
export function WaterfallConnectors({
  data,
  seriesKey = "range",
  hide,
  ...props
}: WaterfallConnectorsProps) {
  const { visibleSeries } = useChart();
  const horizontal = useChartLayout() === "vertical";
  const hidden = hide || (visibleSeries !== undefined && !visibleSeries.includes(seriesKey));
  return (
    <>
      {data.slice(1).map((next, index) => {
        const previous = data[index];
        const incoming = next.kind === "delta" ? next.start : next.balance;
        if (
          !previous ||
          previous.range === null ||
          next.range === null ||
          previous.balance === null ||
          previous.balance !== incoming
        )
          return null;
        return (
          <ReferenceLine<string | number, string | number>
            key={JSON.stringify([previous.id, next.id])}
            stroke="currentColor"
            strokeDasharray="3 3"
            ifOverflow="discard"
            zIndex={100}
            {...props}
            // Keep ReferenceLine registrations stable, including consumer extendDomain.
            shape={
              <ConnectorPaint option={props.shape} hidden={Boolean(hidden)} seriesKey={seriesKey} />
            }
            {...(props.label !== undefined
              ? { label: visibilityLabel(props.label, Boolean(hidden), undefined, seriesKey) }
              : {})}
            pointerEvents="none"
            segment={[
              horizontal
                ? { x: previous.balance, y: previous.id }
                : { x: previous.id, y: previous.balance },
              horizontal ? { x: incoming, y: next.id } : { x: next.id, y: incoming },
            ]}
          />
        );
      })}
    </>
  );
}

function ConnectorPaint({
  option,
  hidden,
  seriesKey,
  ...props
}: ComponentProps<"line"> & {
  option: WaterfallConnectorsProps["shape"];
  hidden: boolean;
  seriesKey: string;
}) {
  const paint = isValidElement<ComponentProps<"line">>(option) ? (
    cloneElement(option, props)
  ) : typeof option === "function" ? (
    option(props)
  ) : (
    <line {...props} />
  );
  return (
    <SeriesEscapePaint seriesKey={seriesKey} hidden={hidden}>
      {paint}
    </SeriesEscapePaint>
  );
}
