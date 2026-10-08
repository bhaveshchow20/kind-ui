"use client";

import {
  type ComponentPropsWithRef,
  cloneElement,
  createElement,
  isValidElement,
  type ReactNode,
  type Ref,
  use,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";
import {
  type TooltipContentProps as EngineContentProps,
  Tooltip as EngineTooltip,
  type TooltipProps as EngineTooltipProps,
  useChartHeight,
  useChartWidth,
} from "recharts";
import { useChart } from "./chart-context.js";
import { useLineInteraction } from "./line-chart.js";
import { PieTooltipPin } from "./pie-tooltip-pin.js";
import { TooltipContent, type TooltipContentProps } from "./tooltip-content.js";

export type TooltipProps = Omit<
  EngineTooltipProps,
  | "position"
  | "isAnimationActive"
  | "portal"
  | "allowEscapeViewBox"
  | "reverseDirection"
  | "useTranslate3d"
> & {
  /** Ref and native attributes for Kind's measured positioning element. */
  ref?: Ref<HTMLDivElement>;
  frameProps?: Omit<ComponentPropsWithRef<"div">, "children" | "ref">;
  maxWidth?: number;
  /** Resolves category identity before the existing series-key fallback. */
  itemKey?: TooltipContentProps["itemKey"];
  /** Default content only; custom content and explicit formatters retain ownership. */
  normalizedValue?: TooltipContentProps["normalizedValue"];
  /** Opt in on Kind's default content; custom content owns its own animation. */
  valueAnimation?: TooltipContentProps["valueAnimation"];
};
export type TooltipFrameProps = {
  x: number;
  y: number;
  maxX: number;
  maxY: number;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
  style: ComponentPropsWithRef<"div">["style"];
  frameProps: TooltipProps["frameProps"];
};
export function StaticTooltipFrame({ x, y, ref, style, frameProps, children }: TooltipFrameProps) {
  return (
    <div
      {...frameProps}
      data-kind-ui="tooltip-frame"
      ref={ref}
      style={{ ...style, ...frameProps?.style, transform: `translate(${x}px, ${y}px)` }}
    >
      {children}
    </div>
  );
}
function PositionedContent({
  consumerContent,
  itemKey,
  valueAnimation,
  normalizedValue,
  maxWidth,
  frameProps,
  frameRef,
  Frame,
  ...tooltip
}: EngineContentProps & {
  consumerContent: TooltipProps["content"];
  itemKey: TooltipProps["itemKey"];
  valueAnimation: TooltipProps["valueAnimation"];
  normalizedValue: TooltipProps["normalizedValue"];
  maxWidth: number;
  frameProps: TooltipProps["frameProps"];
  frameRef: TooltipProps["ref"];
  Frame: (props: TooltipFrameProps) => ReactNode;
}) {
  const { pointer, seriesKeys, categoryKeys, hiddenItems } = useLineInteraction();
  const { visibleSeries } = useChart();
  // Exiting strokes can remain painted briefly; hidden series leave all tooltip content immediately.
  const payload = tooltip.payload.filter((entry) => {
    if (
      entry.type === "none" ||
      entry.hide ||
      (entry.graphicalItemId && hiddenItems.get(entry.graphicalItemId))
    )
      return false;
    if (visibleSeries === undefined) return true;
    const key =
      itemKey?.(entry) ??
      (entry.graphicalItemId
        ? categoryKeys.get(entry.graphicalItemId)?.(Number(tooltip.activeIndex))
        : undefined) ??
      (entry.graphicalItemId ? seriesKeys.get(entry.graphicalItemId) : undefined) ??
      String(entry.dataKey ?? entry.name);
    return visibleSeries.includes(key);
  });
  const contentProps = { ...tooltip, payload };
  const width = useChartWidth() ?? 0;
  const height = useChartHeight() ?? 0;
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const attachRef = useCallback(
    (element: HTMLDivElement | null) => {
      setNode(element);
      if (typeof frameRef === "function") return frameRef(element);
      if (frameRef) frameRef.current = element;
    },
    [frameRef],
  );
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    if (!node) return;
    const measure = (entry?: ResizeObserverEntry) => {
      const box = entry?.borderBoxSize[0];
      const next = {
        width: box?.inlineSize ?? node.offsetWidth,
        height: box?.blockSize ?? node.offsetHeight,
      };
      setSize((old) => (old.width === next.width && old.height === next.height ? old : next));
    };
    measure();
    const observer = new ResizeObserver(([entry]) => measure(entry));
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  const anchor = pointer ?? tooltip.coordinate ?? { x: 0, y: 0 };
  const offset = tooltip.offset ?? 12;
  const offsetX = typeof offset === "number" ? offset : offset.x;
  const offsetY = typeof offset === "number" ? offset : offset.y;
  const maxX = Math.max(0, width - size.width);
  const maxY = Math.max(0, height - size.height);
  const children = isValidElement<EngineContentProps>(consumerContent) ? (
    cloneElement(consumerContent, contentProps)
  ) : typeof consumerContent === "function" ? (
    createElement(consumerContent, contentProps)
  ) : (
    <TooltipContent
      tooltip={contentProps}
      {...(normalizedValue ? { normalizedValue } : {})}
      {...(itemKey ? { itemKey } : {})}
      {...(valueAnimation ? { valueAnimation } : {})}
    />
  );
  return (
    <Frame
      x={Math.max(0, Math.min(anchor.x + offsetX, maxX))}
      y={Math.max(0, Math.min(anchor.y + offsetY, maxY))}
      maxX={maxX}
      maxY={maxY}
      ref={attachRef}
      style={{
        width: "max-content",
        maxWidth: Math.min(Math.max(0, maxWidth), width),
        maxHeight: height,
        overflow: "auto",
        boxSizing: "border-box",
      }}
      frameProps={frameProps}
    >
      {children}
    </Frame>
  );
}
export function TooltipBase({
  ref,
  content,
  frameProps,
  maxWidth = 180,
  itemKey,
  valueAnimation,
  normalizedValue,
  Frame = StaticTooltipFrame,
  defaultIndex: nativeDefaultIndex,
  ...props
}: TooltipProps & { Frame?: (props: TooltipFrameProps) => ReactNode }) {
  useLineInteraction();
  const pinIndex = use(PieTooltipPin);
  const defaultIndex =
    props.active === undefined ? (nativeDefaultIndex ?? pinIndex) : nativeDefaultIndex;
  return (
    <EngineTooltip
      cursor={false}
      offset={12}
      filterNull={false}
      {...props}
      {...(defaultIndex === undefined ? {} : { defaultIndex })}
      position={{ x: 0, y: 0 }}
      isAnimationActive={false}
      content={
        <PositionedContent
          active={false}
          payload={[]}
          coordinate={undefined}
          activeIndex={undefined}
          accessibilityLayer={false}
          consumerContent={content}
          itemKey={itemKey}
          valueAnimation={valueAnimation}
          normalizedValue={normalizedValue}
          maxWidth={maxWidth}
          frameProps={frameProps}
          frameRef={ref}
          Frame={Frame}
        />
      }
    />
  );
}
/** Measured and bounded content; the engine owns payload, selection and Escape dismissal. */
export function Tooltip(props: TooltipProps) {
  return <TooltipBase {...props} />;
}
