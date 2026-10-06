"use client";

import {
  Children,
  type ComponentProps,
  cloneElement,
  Fragment,
  isValidElement,
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
import { type CategoryKey, categoryCells, filterCategoryRows } from "./category-cells.js";
import { useChart } from "./chart-context.js";
import { useChartInteraction, useInteractionFocus } from "./chart-interaction.js";
import { EmphasisMark } from "./emphasis.js";
import { useChartKeyboard, useLineInteraction } from "./line-chart.js";
import { PieMotion } from "./pie-chart.js";
import { type PieMaterial, PieMaterialFilter, type PiePaintBounds } from "./pie-material.js";

export type PieSeriesProps<DataPoint = unknown, Value = unknown> = Omit<
  ComponentProps<typeof Pie<DataPoint, Value>>,
  "isAnimationActive"
> & {
  /** Opt-in category colors from Root.config; requires explicit series data. */
  categoryKey?: CategoryKey<DataPoint> | undefined;
  /** Explicitly share this Pie's category identities and actions with Root/Legend. */
  interactionBinding?: "root";
  /** Finish on default native sectors; custom shapes, filters and CSS transforms keep ownership. */
  material?: PieMaterial | undefined;
  /** Stable sector identity; defaults to the native nameKey value. */
  emphasisKey?: ((payload: unknown) => string | number | undefined) | undefined;
};

type SectorPaintProps = Omit<
  PieSectorShapeProps,
  "isActive" | "index" | "data-recharts-item-index" | "data-recharts-item-id"
> &
  Partial<
    Pick<
      PieSectorShapeProps,
      "isActive" | "index" | "data-recharts-item-index" | "data-recharts-item-id"
    >
  >;

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

// Capture original rendered identity before an inner Cell handler can commit new rows.
function captureCellIdentity(
  children: ReactNode,
  keyAt: (index: number) => string | undefined,
  identities: WeakMap<Event, string>,
): ReactNode {
  let index = 0;
  function capture(parts: ReactNode): ReactNode {
    return Children.map(parts, (child) => {
      if (!isValidElement<ComponentProps<typeof Cell>>(child)) return child;
      if (child.type === Fragment) return cloneElement(child, {}, capture(child.props.children));
      if (child.type !== Cell) return child;
      const key = keyAt(index++);
      if (key === undefined) return child;
      return cloneElement(child, {
        onClick: (event) => {
          identities.set(event.nativeEvent, key);
          child.props.onClick?.(event);
        },
      });
    });
  }
  return capture(children);
}

// One chart-level angular window reveals unchanged native sectors.
function EntranceSector({
  material,
  emphasisKey,
  scope,
  enabled,
  interactionKey,
  seriesStartAngle,
  seriesEndAngle,
  ...props
}: SectorPaintProps & {
  material: PieMaterial;
  interactionKey?: ((index: number) => string | undefined) | undefined;
  emphasisKey?: PieSeriesProps["emphasisKey"];
  scope: string;
  enabled: boolean;
  seriesStartAngle: number;
  seriesEndAngle: number;
}) {
  const keyboard = useChartKeyboard();
  const interaction = useChartInteraction();
  const { reveal, progress, direction } = use(PieMotion);
  const semantic = interactionKey
    ? interactionKey(props.index ?? -1)
    : emphasisKey
      ? emphasisKey(props.payload)
      : props.name;
  const interactive =
    interactionKey !== undefined &&
    interaction.interactive &&
    interaction.markActivation &&
    interaction.eligible.includes(String(semantic));
  const focusRef = useInteractionFocus(String(semantic), interactive);
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
      ref={focusRef}
      data-interaction-focus-key={interactive ? String(semantic) : undefined}
      persistent={interactionKey !== undefined}
      enabled={
        enabled &&
        (emphasisKey !== undefined ? semantic !== undefined : typeof semantic === "string")
      }
      target={{ kind: "sector", key: String(semantic), scope, seriesKey: String(semantic) }}
      keyboardActive={keyboard && props.isActive === true}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={
        interactive
          ? `${interaction.mode === "focus" ? "Highlight" : "Toggle"} ${String(semantic)}`
          : undefined
      }
      aria-pressed={
        interactive
          ? interaction.mode === "focus"
            ? interaction.selected === semantic
            : true
          : undefined
      }
      onKeyDown={(event) => {
        if (
          interactive &&
          event.target === event.currentTarget &&
          !event.defaultPrevented &&
          (event.key === "Enter" || event.key === " ")
        ) {
          if (!event.repeat)
            interaction.activate({ kind: "category", key: String(semantic) }, "mark", event);
          event.preventDefault();
        }
      }}
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
                data-sector-span={props.endAngle - props.startAngle}
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
  const {
    material = "plain",
    emphasisKey,
    categoryKey,
    interactionBinding,
    ...nativeProps
  } = props;
  const interaction = useChartInteraction();
  if (
    interactionBinding &&
    (interaction.kind !== "category" || categoryKey === undefined || props.data === undefined)
  )
    throw new Error(
      "PieSeries Root interaction binding requires category-kind Root, categoryKey and explicit data",
    );
  const filtered = useMemo(
    () =>
      interactionBinding && props.data && categoryKey !== undefined
        ? filterCategoryRows(props.data, categoryKey, interaction.visible, props.children)
        : undefined,
    [interactionBinding, props.data, categoryKey, interaction.visible, props.children],
  );
  const data = filtered?.data ?? props.data;
  const originalChildren = filtered?.children ?? props.children;
  const resolveInteractionKey = useCallback(
    (index: number): string | undefined => {
      // Cell props can override native payload fields; native index still addresses our rendered rows.
      const row = data?.[index];
      if (row === undefined) return undefined;
      if (typeof categoryKey === "function") return categoryKey(row);
      if (
        categoryKey !== undefined &&
        typeof row === "object" &&
        row !== null &&
        Object.hasOwn(row, categoryKey)
      )
        return String((row as Record<string, unknown>)[categoryKey]);
      throw new Error("PieSeries interaction requires a stable category key");
    },
    [categoryKey, data],
  );
  const interactionKey = interactionBinding ? resolveInteractionKey : undefined;
  const { config, paints } = useChart();
  const children = useMemo(
    () =>
      categoryKey === undefined
        ? originalChildren
        : categoryCells(data, categoryKey, config, paints, originalChildren, props.fill),
    [categoryKey, data, config, paints, originalChildren, props.fill],
  );
  const identities = useRef(new WeakMap<Event, string>());
  const boundChildren = useMemo(
    () =>
      interactionKey && interaction.interactive && interaction.markActivation
        ? captureCellIdentity(children, interactionKey, identities.current)
        : children,
    [children, interactionKey, interaction.interactive, interaction.markActivation],
  );
  const latestClick = useRef({ handler: props.onClick, interactionKey, interaction });
  useLayoutEffect(() => {
    latestClick.current = { handler: props.onClick, interactionKey, interaction };
  });
  const activate = useCallback<NonNullable<PieSeriesProps<DataPoint, Value>["onClick"]>>(
    (...args) => {
      // Capture the pressed row before a consumer can synchronously reorder/filter the data.
      const pressed = latestClick.current;
      const key = identities.current.get(args[2].nativeEvent) ?? pressed.interactionKey?.(args[1]);
      pressed.handler?.(...args);
      if (key !== undefined)
        latestClick.current.interaction.activate({ kind: "category", key }, "mark", args[2]);
    },
    [],
  );
  const onClick =
    interactionBinding && interaction.interactive && interaction.markActivation
      ? activate
      : props.onClick;
  const seriesId = useId();
  const { invalidate, emphasisScope } = useLineInteraction();
  const scope = `${emphasisScope}/${seriesId}`;
  const sectorShape = useCallback(
    (sector: SectorPaintProps) => (
      <EntranceSector
        {...sector}
        material={material}
        interactionKey={interactionKey}
        scope={scope}
        emphasisKey={emphasisKey}
        enabled={props.activeShape === undefined && props.inactiveShape === undefined}
        seriesStartAngle={props.startAngle ?? 0}
        seriesEndAngle={props.endAngle ?? 360}
      />
    ),
    [
      material,
      scope,
      emphasisKey,
      interactionKey,
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
      {...(data !== undefined ? { data } : {})}
      {...(onClick !== undefined ? { onClick } : {})}
      stroke={props.stroke ?? "none"}
      shape={props.shape ?? sectorShape}
      {...(interactionBinding && props.shape === undefined && props.activeShape === undefined
        ? { activeShape: sectorShape }
        : {})}
      {...(interactionBinding && props.shape === undefined && props.inactiveShape === undefined
        ? { inactiveShape: sectorShape }
        : {})}
      isAnimationActive={false}
    >
      {boundChildren}
    </Pie>
  );
}
