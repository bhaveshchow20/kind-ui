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
import { useLineInteraction } from "./line-chart.js";
import { PieMotion } from "./pie-chart.js";
import { type PieMaterial, PieMaterialFilter } from "./pie-material.js";

export type PieSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof Pie<DataPoint, Value>>,
  "isAnimationActive"
> & {
  /** Inset finish on default native sectors; custom shapes and filters keep ownership. */
  material?: PieMaterial | undefined;
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
function EntranceSector({ material, ...props }: PieSectorShapeProps & { material: PieMaterial }) {
  const generatedId = useId();
  const filterId = `kind-ui-pie-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "_")}-material`;
  const materialized =
    material !== "plain" && props.filter === undefined && props.style?.filter === undefined;
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
    <>
      {materialized && (
        <defs data-kind-ui="pie-material" data-material={material} pointerEvents="none">
          <PieMaterialFilter
            material={material}
            id={filterId}
            strokeWidth={
              Number.isFinite(Number(props.strokeWidth))
                ? Math.max(0, Number(props.strokeWidth))
                : 0
            }
            cx={props.cx}
            cy={props.cy}
            radius={props.outerRadius}
            thickness={props.outerRadius - props.innerRadius}
          />
        </defs>
      )}
      <Sector
        {...sector}
        {...(materialized ? { filter: `url(#${filterId})` } : {})}
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
    </>
  );
}

/** A native Pie. Use innerRadius for donuts; category data, Cells and visibility are consumer-owned. */
export function PieSeries<DataPoint = unknown, Value = unknown>(
  props: PieSeriesProps<DataPoint, Value>,
) {
  const { material = "plain", ...nativeProps } = props;
  const renderEntranceSector = useCallback(
    (sector: PieSectorShapeProps) => <EntranceSector {...sector} material={material} />,
    [material],
  );
  const { invalidate } = useLineInteraction();
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
    material,
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
      {...nativeProps}
      stroke={props.stroke ?? "none"}
      shape={props.shape ?? renderEntranceSector}
      isAnimationActive={false}
    />
  );
}
