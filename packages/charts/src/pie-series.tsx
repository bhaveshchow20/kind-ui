"use client";

import { animate } from "motion/react";
import {
  Children,
  type ComponentProps,
  Fragment,
  isValidElement,
  type ReactNode,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Cell, Pie, type PieSectorShapeProps, Sector } from "recharts";
import { EmphasisMark } from "./emphasis.js";
import { useChartKeyboard, useLineInteraction } from "./line-chart.js";
import { PieMotion } from "./pie-chart.js";

export type PieSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof Pie<DataPoint, Value>>,
  "isAnimationActive"
> & {
  /** Stable sector identity; defaults to the native nameKey value. */
  emphasisKey?: ((payload: unknown) => string | number | undefined) | undefined;
};

// Recharts also supports Cell props as data when neither the chart nor Pie supplies rows.
function cellProps(children: ReactNode): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<Record<string, unknown> & { children?: ReactNode }>(child)) return;
    if (child.type === Cell) result.push(child.props);
    else if (child.type === Fragment) result.push(...cellProps(child.props.children));
  });
  return result;
}
function sameCells(previous: Record<string, unknown>[], next: Record<string, unknown>[]) {
  return (
    previous.length === next.length &&
    next.every((props, index) => {
      const old = previous[index];
      return (
        old !== undefined &&
        Object.keys(old).length === Object.keys(props).length &&
        Object.keys(props).every((key) => Object.is(old[key], props[key]))
      );
    })
  );
}

// Motion interpolates only the native sector's angular span; Recharts owns all polar geometry.
function EntranceSector({
  emphasisKey,
  scope,
  enabled,
  ...props
}: PieSectorShapeProps & {
  emphasisKey?: PieSeriesProps["emphasisKey"];
  scope: string;
  enabled: boolean;
}) {
  const keyboard = useChartKeyboard();
  const semantic = emphasisKey ? emphasisKey(props.payload) : props.name;
  const { reveal, options, finish } = use(PieMotion);
  const [progress, setProgress] = useState(reveal ? 0 : 1);
  useLayoutEffect(() => {
    if (!reveal) {
      setProgress(1);
      return;
    }
    setProgress(0);
    const controls = animate(0, 1, {
      duration: Math.max(0, options.revealDurationMs ?? 1000) / 1000,
      ease: options.revealEasing ?? [0.25, 0.1, 0.25, 1],
      onUpdate: setProgress,
      onComplete: finish,
    });
    return () => controls.stop();
  }, [reveal, options.revealDurationMs, options.revealEasing, finish]);
  const { startAngle, endAngle } = props;
  const {
    className,
    cornerRadius,
    onClick,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    onMouseOver,
    onMouseOut,
    onMouseEnter,
    onMouseLeave,
    ...sector
  } = props;
  return (
    <EmphasisMark
      enabled={
        enabled &&
        (emphasisKey !== undefined ? semantic !== undefined : typeof semantic === "string")
      }
      target={{ kind: "sector", key: String(semantic), scope, seriesKey: String(semantic) }}
      keyboardActive={keyboard && props.isActive}
    >
      <Sector
        {...sector}
        {...(onClick ? { onClick } : {})}
        {...(onMouseDown ? { onMouseDown } : {})}
        {...(onMouseUp ? { onMouseUp } : {})}
        {...(onMouseMove ? { onMouseMove } : {})}
        {...(onMouseOver ? { onMouseOver } : {})}
        {...(onMouseOut ? { onMouseOut } : {})}
        {...(onMouseEnter ? { onMouseEnter } : {})}
        {...(onMouseLeave ? { onMouseLeave } : {})}
        {...(className !== undefined ? { className } : {})}
        {...(cornerRadius !== undefined ? { cornerRadius } : {})}
        data-kind-ui="pie-sector"
        data-reveal={reveal ? "on" : "off"}
        endAngle={reveal ? startAngle + (endAngle - startAngle) * progress : endAngle}
      />
    </EmphasisMark>
  );
}

/** A native Pie. Use innerRadius for donuts; category data, Cells and visibility are consumer-owned. */
export function PieSeries<DataPoint = unknown, Value = unknown>(
  props: PieSeriesProps<DataPoint, Value>,
) {
  const { emphasisKey, ...native } = props;
  const seriesId = useId();
  const { invalidate, emphasisScope } = useLineInteraction();
  const scope = `${emphasisScope}/${seriesId}`;
  const sectorShape = useCallback(
    (shapeProps: PieSectorShapeProps) => (
      <EntranceSector
        {...shapeProps}
        scope={scope}
        emphasisKey={emphasisKey}
        enabled={props.activeShape === undefined && props.inactiveShape === undefined}
      />
    ),
    [scope, emphasisKey, props.activeShape, props.inactiveShape],
  );
  const inputs = [
    props.data,
    props.dataKey,
    props.nameKey,
    props.cx,
    props.cy,
    props.innerRadius,
    props.outerRadius,
    props.startAngle,
    props.endAngle,
    props.paddingAngle,
    props.minAngle,
    props.cornerRadius,
    props.hide,
    props.shape,
    props.activeShape,
    props.inactiveShape,
  ];
  const cells = cellProps(props.children);
  const previousCells = useRef(cells);
  const previous = useRef(inputs);
  useLayoutEffect(() => {
    if (
      inputs.some((value, index) => value !== previous.current[index]) ||
      !sameCells(previousCells.current, cells)
    )
      invalidate();
    previousCells.current = cells;
    previous.current = inputs;
  });
  return (
    <Pie<DataPoint, Value>
      {...native}
      stroke={props.stroke ?? "none"}
      shape={props.shape ?? sectorShape}
      isAnimationActive={false}
    />
  );
}
