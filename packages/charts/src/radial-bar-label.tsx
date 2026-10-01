"use client";

import { type Ref, useCallback, useId, useLayoutEffect, useState } from "react";
import type { LabelProps } from "recharts";

export type RadialBarLabelProps = Omit<
  LabelProps,
  | "fontSize"
  | "position"
  | "content"
  | "children"
  | "offset"
  | "labelRef"
  | "angle"
  | "textBreakAll"
  | "x"
  | "y"
  | "dx"
  | "dy"
  | "transform"
> & {
  /** Independently controls this visual label, without affecting payload or tooltip state. */
  show?: boolean;
  /** Numeric SVG pixels; reduced to fit the native ring band, never below minFontSize. */
  fontSize?: number;
  minFontSize?: number;
  /** Space reserved at the arc endpoints and both edges of the band. */
  padding?: number;
  ref?: Ref<SVGTextElement>;
  labelRef?: Ref<SVGTextElement>;
};

function attach(ref: Ref<SVGTextElement> | undefined, node: SVGTextElement | null) {
  if (typeof ref === "function") return ref(node);
  if (ref) ref.current = node;
}

// Native Label forwards these layout/content fields to custom content; they are not SVG attributes.
function svgAttributes({
  x: _x,
  y: _y,
  dx: _dx,
  dy: _dy,
  transform: _transform,
  position: _position,
  content: _content,
  offset: _offset,
  children: _children,
  angle: _angle,
  textBreakAll: _textBreakAll,
  viewBox: _viewBox,
  parentViewBox: _parentViewBox,
  value: _value,
  formatter: _formatter,
  index: _index,
  zIndex: _zIndex,
  labelRef: _labelRef,
  ...props
}: LabelProps) {
  return props;
}

/** LabelList content placed along the actual native sector's mid-radius, within its endpoints. */
export function RadialBarLabel({
  show = true,
  fontSize = 11,
  minFontSize = 9,
  padding = 2,
  viewBox,
  parentViewBox: _parentViewBox,
  value,
  formatter,
  index: _index,
  zIndex: _zIndex,
  id,
  ref,
  labelRef,
  style,
  fill = "white",
  pointerEvents = "none",
  ...props
}: RadialBarLabelProps) {
  const generatedId = useId();
  const pathId = `${id ?? generatedId}-arc`;
  const [node, setNode] = useState<SVGTextElement | null>(null);
  const [measurement, setMeasurement] = useState({
    length: Infinity,
    fontSize: Infinity,
    contained: false,
  });
  const [fitSize, setFitSize] = useState(fontSize);
  const text = formatter ? formatter(value) : value;
  const textKey =
    typeof text === "string" || typeof text === "number" ? String(text) : String(value);
  const box = viewBox && "cx" in viewBox ? viewBox : undefined;
  const band = box ? box.outerRadius - box.innerRadius : 0;
  const inset = Number.isFinite(padding) ? Math.max(0, padding) : 2;
  const size = Math.min(fontSize, fitSize, band - inset * 2);
  const radius = box ? (box.innerRadius + box.outerRadius) / 2 : 0;
  const rawDelta = box ? box.endAngle - box.startAngle : 0;
  const delta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 359.999);
  const length = ((Math.abs(delta) * Math.PI) / 180) * radius;
  const valid =
    box !== undefined &&
    [box.cx, box.cy, radius, delta, band, size, fontSize, minFontSize].every(Number.isFinite) &&
    box.innerRadius >= 0 &&
    radius > 0 &&
    band > 0 &&
    fontSize > 0 &&
    minFontSize > 0 &&
    Math.abs(delta) > 0 &&
    size >= minFontSize;
  const attachRef = useCallback(
    (element: SVGTextElement | null) => {
      setNode(element);
      const first = attach(ref, element);
      const second = attach(labelRef, element);
      return () => {
        if (first) first();
        else attach(ref, null);
        if (second) second();
        else attach(labelRef, null);
      };
    },
    [ref, labelRef],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies: New geometry or text retries the requested size before measuring its fit.
  useLayoutEffect(() => {
    setFitSize(fontSize);
  }, [fontSize, textKey, band, radius, delta, minFontSize, inset, box?.startAngle]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Text and font/style changes must remeasure the retained SVG node before paint.
  useLayoutEffect(() => {
    if (!node) return;
    const measure = () => {
      const cx = Number(node.dataset.cx),
        cy = Number(node.dataset.cy);
      const inner = Number(node.dataset.innerRadius),
        outer = Number(node.dataset.outerRadius);
      const start = Number(node.dataset.startAngle),
        end = Number(node.dataset.endAngle);
      const direction = Math.sign(end - start),
        span = Math.abs(end - start);
      const contained = Array.from({ length: node.getNumberOfChars() }, (_, index) => {
        const extent = node.getExtentOfChar(index);
        return [extent.x, extent.x + extent.width].every((x) =>
          [extent.y, extent.y + extent.height].every((y) => {
            const r = Math.hypot(x - cx, y - cy);
            const angle = (Math.atan2(cy - y, x - cx) * 180) / Math.PI;
            const along = (((direction * (angle - start)) % 360) + 360) % 360;
            return r >= inner && r <= outer && along <= span;
          }),
        );
      }).every(Boolean);
      const next = {
        contained,
        length: node.getComputedTextLength(),
        fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
      };
      if ((!contained || next.length > length - inset * 2) && size > minFontSize)
        setFitSize(Math.max(minFontSize, size - 1));
      setMeasurement((old) =>
        old.length === next.length &&
        old.fontSize === next.fontSize &&
        old.contained === next.contained
          ? old
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    document.fonts?.addEventListener("loadingdone", measure);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", measure);
    };
  }, [
    node,
    text,
    size,
    length,
    inset,
    minFontSize,
    style,
    box?.cx,
    box?.cy,
    box?.innerRadius,
    box?.outerRadius,
    box?.startAngle,
    box?.endAngle,
  ]);
  if (!show || !valid || !box || text == null || typeof text === "boolean") return null;
  const middle = box.startAngle + delta / 2;
  // Reverse a left-facing tangent so text reads upright on either sweep direction.
  const reverse = -Math.sign(delta) * Math.sin((middle * Math.PI) / 180) < 0;
  const start = reverse ? box.startAngle + delta : box.startAngle;
  const sweep = reverse ? -delta : delta;
  const point = (angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return `${box.cx + radius * Math.cos(radians)},${box.cy - radius * Math.sin(radians)}`;
  };
  const pieces = Math.ceil(Math.abs(sweep) / 180);
  let path = `M${point(start)}`;
  for (let part = 1; part <= pieces; part++)
    path += ` A${radius},${radius} 0 0 ${sweep < 0 ? 1 : 0} ${point(start + (sweep * part) / pieces)}`;
  const fits =
    measurement.contained &&
    measurement.length <= length - inset * 2 &&
    measurement.fontSize <= band - inset * 2;
  return (
    <g data-kind-ui="radial-label-frame">
      <defs>
        <path id={pathId} d={path} />
      </defs>
      <text
        {...svgAttributes(props)}
        ref={attachRef}
        id={id}
        fill={fill}
        pointerEvents={pointerEvents}
        data-kind-ui="radial-label"
        data-fit={fits ? "yes" : "no"}
        data-cx={box.cx}
        data-cy={box.cy}
        data-inner-radius={box.innerRadius}
        data-outer-radius={box.outerRadius}
        data-start-angle={box.startAngle}
        data-end-angle={box.startAngle + delta}
        data-arc-length={length}
        data-text-length={measurement.length}
        dominantBaseline="central"
        textAnchor="middle"
        style={{ fontSize: size, ...style, visibility: fits ? style?.visibility : "hidden" }}
      >
        <textPath href={`#${pathId}`} startOffset="50%">
          {text}
        </textPath>
      </text>
    </g>
  );
}
