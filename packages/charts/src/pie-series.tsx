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
import { type PieMaterial, PieMaterialFilter, type PiePaintBounds } from "./pie-material.js";

export type PieSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof Pie<DataPoint, Value>>,
  "isAnimationActive"
> & {
  /** Finish on default native sectors; custom shapes and filters keep ownership. */
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
  const sourceId = `kind-ui-pie-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "_")}-paint`;
  const maskId = `${sourceId}-alpha`;
  const filterId = `kind-ui-pie-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "_")}-material`;
  // Unresolved CSS stroke widths retain native rendering rather than receiving guessed bounds.
  const strokeWidth = props.style?.strokeWidth ?? props.strokeWidth ?? 0;
  const resolvedStroke = Number(strokeWidth);
  const markGroup = useRef<SVGGElement>(null);
  const [paintFilter, setPaintFilter] = useState("none");
  const [paintClip, setPaintClip] = useState("none");
  const [clipTransform, setClipTransform] = useState({ forward: "", inverse: "" });
  const [paintBounds, setPaintBounds] = useState<PiePaintBounds>();
  const [paintStroke, setPaintStroke] = useState(
    Number.isFinite(resolvedStroke) ? resolvedStroke : 0,
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: class/id changes can change stylesheet-owned paint.
  useLayoutEffect(() => {
    if (
      material === "plain" ||
      props.filter !== undefined ||
      props.style?.filter !== undefined ||
      !Number.isFinite(resolvedStroke)
    )
      return;
    const path = markGroup.current?.querySelector("path");
    if (!path) return;
    const computed = getComputedStyle(path);
    if (computed.filter !== paintFilter) setPaintFilter(computed.filter);
    if (computed.clipPath !== paintClip) setPaintClip(computed.clipPath);
    const width = Number.parseFloat(computed.strokeWidth);
    if (Number.isFinite(width) && width !== paintStroke) setPaintStroke(width);
    const parentMatrix = markGroup.current?.getCTM();
    const pathMatrix = path.getCTM();
    if (parentMatrix && pathMatrix) {
      if (parentMatrix.a * parentMatrix.d - parentMatrix.b * parentMatrix.c === 0) return;
      const matrix = parentMatrix.inverse().multiply(pathMatrix);
      if (matrix.a * matrix.d - matrix.b * matrix.c === 0) return;
      const inverse = matrix.inverse();
      const svgMatrix = (m: DOMMatrix) => `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`;
      const nextTransform = { forward: svgMatrix(matrix), inverse: svgMatrix(inverse) };
      setClipTransform((old) =>
        old.forward === nextTransform.forward && old.inverse === nextTransform.inverse
          ? old
          : nextTransform,
      );
      const center = new DOMPoint(props.cx, props.cy).matrixTransform(matrix);
      const radius = props.outerRadius + (Number.isFinite(width) ? width : 0) / 2;
      const rx = Math.hypot(matrix.a, matrix.c) * radius + 16;
      const ry = Math.hypot(matrix.b, matrix.d) * radius + 16;
      const x = Math.floor(center.x - rx);
      const y = Math.floor(center.y - ry);
      const next = {
        x,
        y,
        width: Math.ceil(center.x + rx) - x,
        height: Math.ceil(center.y + ry) - y,
      };
      setPaintBounds((old) =>
        old &&
        Object.keys(next).every(
          (key) => old[key as keyof PiePaintBounds] === next[key as keyof PiePaintBounds],
        )
          ? old
          : next,
      );
    }
  }, [
    material,
    props.filter,
    props.style,
    props.className,
    props.id,
    props.clipPath,
    props.transform,
    props.cx,
    props.cy,
    props.outerRadius,
    resolvedStroke,
    paintFilter,
    paintClip,
    paintStroke,
  ]);
  const materialized =
    material !== "plain" &&
    props.filter === undefined &&
    props.style?.filter === undefined &&
    paintFilter === "none" &&
    Number.isFinite(resolvedStroke);
  const inset = materialized && material !== "glow";
  const margin =
    16 + Math.max(Number.isFinite(resolvedStroke) ? resolvedStroke : 0, paintStroke) / 2;
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
    <g ref={markGroup}>
      {materialized && (
        <defs data-kind-ui="pie-material" data-material={material} pointerEvents="none">
          <PieMaterialFilter
            material={material}
            id={filterId}
            strokeWidth={Math.max(
              0,
              Number.isFinite(resolvedStroke) ? resolvedStroke : 0,
              paintStroke,
            )}
            cx={props.cx}
            cy={props.cy}
            radius={props.outerRadius}
            thickness={props.outerRadius - props.innerRadius}
            bounds={paintBounds}
          />
          {inset && (
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x={paintBounds?.x ?? Math.floor(props.cx - props.outerRadius - margin)}
              y={paintBounds?.y ?? Math.floor(props.cy - props.outerRadius - margin)}
              width={paintBounds?.width ?? Math.ceil(props.outerRadius * 2 + margin * 2) + 1}
              height={paintBounds?.height ?? Math.ceil(props.outerRadius * 2 + margin * 2) + 1}
              style={{ maskType: "alpha" }}
            >
              <use href={`#${sourceId}`} />
            </mask>
          )}
        </defs>
      )}
      {materialized && material === "glow" && (
        // biome-ignore lint/a11y/noAriaHiddenOnFocusable: SVG decoration is explicitly nonfocusable and ignores pointer events.
        <g
          pointerEvents="none"
          focusable="false"
          aria-hidden="true"
          data-kind-ui="pie-halo"
          style={{ clipPath: paintClip }}
          transform={paintClip !== "none" ? clipTransform.forward : undefined}
        >
          <g
            transform={paintClip !== "none" ? clipTransform.inverse : undefined}
            filter={`url(#${filterId})`}
          >
            <use href={`#${sourceId}`} />
          </g>
        </g>
      )}
      <g
        {...(inset ? { filter: `url(#${filterId})` } : {})}
        {...(inset ? { mask: `url(#${maskId})` } : {})}
      >
        <g id={sourceId}>
          {materialized && (
            <rect
              x={paintBounds?.x ?? props.cx - props.outerRadius - margin}
              y={paintBounds?.y ?? props.cy - props.outerRadius - margin}
              width={paintBounds?.width ?? props.outerRadius * 2 + margin * 2}
              height={paintBounds?.height ?? props.outerRadius * 2 + margin * 2}
              fill="white"
              fillOpacity={0}
              pointerEvents="none"
            />
          )}
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
        </g>
      </g>
    </g>
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
