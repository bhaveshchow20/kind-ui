"use client";

import {
  Children,
  type ComponentProps,
  Fragment,
  isValidElement,
  memo,
  type ReactNode,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Cell, Pie, type PieSectorShapeProps, Sector } from "recharts";
import { type CategoryKey, categoryCells } from "./category-cells.js";
import { useChart } from "./chart-context.js";
import { EmphasisMark } from "./emphasis.js";
import { useChartKeyboard, useLineInteraction } from "./line-chart.js";
import { PieMotion } from "./pie-chart.js";
import { type PieMaterial, PieMaterialFilter, type PiePaintBounds } from "./pie-material.js";
import { registerPiePinComponent } from "./pie-pin-identity.js";

// Native Pie keys its animation subtree by props identity even with animation disabled.
// Pointer/pin context updates must not replace an unchanged pressed native sector.
const StablePie = memo(Pie) as typeof Pie;

export type PieSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof Pie<DataPoint, Value>>,
  "isAnimationActive"
> & {
  /** Opt-in category colors from Root.config; requires explicit series data. */
  categoryKey?: CategoryKey<DataPoint> | undefined;
  /** Finish on default native sectors; custom shapes, filters and CSS transforms keep ownership. */
  material?: PieMaterial | undefined;
  /** Categories receiving glow instead of material; requires categoryKey and explicit data. Unknown IDs are ignored. */
  glowCategories?: readonly string[] | undefined;
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

// One chart-level angular window reveals unchanged native sectors.
function EntranceSector({
  material,
  emphasisKey,
  scope,
  enabled,
  seriesStartAngle,
  seriesEndAngle,
  ...props
}: PieSectorShapeProps & {
  material: PieMaterial;
  emphasisKey?: PieSeriesProps["emphasisKey"];
  scope: string;
  enabled: boolean;
  seriesStartAngle: number;
  seriesEndAngle: number;
}) {
  const keyboard = useChartKeyboard();
  const { reveal, progress, direction } = use(PieMotion);
  const semantic = emphasisKey ? emphasisKey(props.payload) : props.name;
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
  // Measure native ownership before attaching paint, including the first non-Plain render.
  const [cssTransformOwned, setCssTransformOwned] = useState<boolean>();
  const [clipTransform, setClipTransform] = useState({ forward: "", inverse: "" });
  const [paintBounds, setPaintBounds] = useState<PiePaintBounds>();
  const [paintStroke, setPaintStroke] = useState(
    Number.isFinite(resolvedStroke) ? resolvedStroke : 0,
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: class/id changes can change stylesheet-owned paint.
  useLayoutEffect(() => {
    if (
      (material === "plain" && !reveal) ||
      props.filter !== undefined ||
      props.style?.filter !== undefined ||
      !Number.isFinite(resolvedStroke)
    )
      return;
    const path = markGroup.current?.querySelector("path");
    if (!path) return;
    const computed = getComputedStyle(path);
    // SVG attributes still receive finishes. CSS overrides keep native rasterization:
    // offscreen masks can change their antialiased alpha even with identical geometry.
    let attributeTransform = new DOMMatrix();
    for (let i = 0; i < path.transform.baseVal.numberOfItems; i++)
      attributeTransform = attributeTransform.multiply(path.transform.baseVal.getItem(i).matrix);
    const computedTransform =
      computed.transform === "none" ? new DOMMatrix() : new DOMMatrix(computed.transform);
    const differentTransform = (["a", "b", "c", "d", "e", "f"] as const).some(
      (key) =>
        Math.abs(attributeTransform[key] - computedTransform[key]) >
        0.00001 * Math.max(1, Math.abs(attributeTransform[key]), Math.abs(computedTransform[key])),
    );
    const ownsTransform =
      differentTransform ||
      !computedTransform.is2D ||
      computed.translate !== "none" ||
      computed.rotate !== "none" ||
      computed.scale !== "none" ||
      (props.style?.transform !== undefined && computed.transform !== "none");
    setCssTransformOwned((old) => (old === ownsTransform ? old : ownsTransform));
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
    reveal,
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
    cssTransformOwned === false &&
    Number.isFinite(resolvedStroke);
  const inset = materialized && material !== "glow";
  const margin =
    16 + Math.max(Number.isFinite(resolvedStroke) ? resolvedStroke : 0, paintStroke) / 2;
  const entranceId = `${sourceId}-entrance`;
  // A mask affects paint only: native hit targets and event ownership stay intact.
  const maskEntrance =
    reveal &&
    cssTransformOwned === false &&
    props.transform === undefined &&
    props.style?.transform === undefined;
  const nativeSpan = Math.max(-360, Math.min(360, seriesEndAngle - seriesStartAngle));
  const clockwise = direction === "clockwise";
  const fromStart = clockwise ? nativeSpan < 0 : nativeSpan >= 0;
  const revealStart = fromStart ? seriesStartAngle : seriesStartAngle + nativeSpan;
  const revealSpan = Math.abs(nativeSpan) * (clockwise ? -1 : 1);
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
      <g ref={markGroup}>
        {maskEntrance && (
          <defs>
            <mask
              id={entranceId}
              maskUnits="userSpaceOnUse"
              x={props.cx - props.outerRadius - margin}
              y={props.cy - props.outerRadius - margin}
              width={(props.outerRadius + margin) * 2}
              height={(props.outerRadius + margin) * 2}
              style={{ maskType: "alpha" }}
            >
              <Sector
                fill="white"
                data-kind-ui="pie-entrance-window"
                data-direction={direction}
                data-progress={progress}
                cx={props.cx}
                cy={props.cy}
                innerRadius={0}
                outerRadius={props.outerRadius + margin}
                startAngle={revealStart}
                endAngle={revealStart + revealSpan * progress}
              />
            </mask>
          </defs>
        )}
        <g mask={maskEntrance ? `url(#${entranceId})` : undefined}>
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
                data-reveal={maskEntrance ? "on" : "off"}
              />
            </g>
          </g>
        </g>
      </g>
    </EmphasisMark>
  );
}

/** A native Pie. Use innerRadius for donuts; category data, Cells and visibility are consumer-owned. */
export function PieSeries<DataPoint = unknown, Value = unknown>(
  props: PieSeriesProps<DataPoint, Value>,
) {
  const { material = "plain", glowCategories, emphasisKey, categoryKey, ...nativeProps } = props;
  const { config } = useChart();
  if (glowCategories !== undefined && categoryKey === undefined)
    throw new Error("glowCategories requires categoryKey and explicit series data");
  const children = useMemo(
    () =>
      categoryKey === undefined
        ? props.children
        : categoryCells(props.data, categoryKey, config, props.children, props.fill),
    [props.data, categoryKey, config, props.children, props.fill],
  );
  // Native sector indices align with explicit data, but membership uses the original
  // row identity, before native Cell props can override payload fields.
  const glowRows = useMemo(() => {
    if (categoryKey === undefined || glowCategories === undefined) return undefined;
    const glowing = new Set(glowCategories);
    return props.data?.map((row) => {
      const key =
        typeof categoryKey === "function"
          ? categoryKey(row)
          : row !== null && typeof row === "object" && Object.hasOwn(row, categoryKey)
            ? row[categoryKey]
            : undefined;
      return typeof key === "string" && glowing.has(key);
    });
  }, [props.data, categoryKey, glowCategories]);
  const seriesId = useId();
  const { invalidate, emphasisScope } = useLineInteraction();
  const scope = `${emphasisScope}/${seriesId}`;
  const sectorShape = useCallback(
    (sector: PieSectorShapeProps) => (
      <EntranceSector
        {...sector}
        material={glowRows?.[sector.index] ? "glow" : material}
        scope={scope}
        emphasisKey={emphasisKey}
        enabled={props.activeShape === undefined && props.inactiveShape === undefined}
        seriesStartAngle={props.startAngle ?? 0}
        seriesEndAngle={props.endAngle ?? 360}
      />
    ),
    [
      material,
      glowRows,
      scope,
      emphasisKey,
      props.activeShape,
      props.inactiveShape,
      props.startAngle,
      props.endAngle,
    ],
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
    material,
    categoryKey,
    glowCategories,
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
    <StablePie<DataPoint, Value>
      {...nativeProps}
      stroke={props.stroke ?? "none"}
      shape={props.shape ?? sectorShape}
      isAnimationActive={false}
    >
      {children}
    </StablePie>
  );
}
registerPiePinComponent(PieSeries, "series");
