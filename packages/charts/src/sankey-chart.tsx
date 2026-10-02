"use client";

import { animate as animateValue, motion, useMotionValue } from "motion/react";
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Sankey as EngineSankey,
  type SankeyLinkProps as NativeLinkProps,
  type SankeyNodeProps as NativeNodeProps,
  useChartHeight,
  useChartWidth,
} from "recharts";
import { prepareSankeyData, type SankeyFlowData } from "./sankey-data.js";
import type { SankeyLinkProps, SankeyNodeProps } from "./sankey-marks.js";

function NativeSize({ onSize }: { onSize: (width: number, height: number) => void }) {
  const width = useChartWidth();
  const height = useChartHeight();
  useLayoutEffect(() => {
    if (width !== undefined && height !== undefined) onSize(width, height);
  }, [width, height, onSize]);
  return null;
}
const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;
type NativeProps = ComponentProps<typeof EngineSankey>;
type NativeEvent = NonNullable<NativeProps["onClick"]>;
type IdentityEvent = (
  item: SankeyNodeProps | SankeyLinkProps,
  type: Parameters<NativeEvent>[1],
  event: Parameters<NativeEvent>[2],
) => void;
export interface SankeyAnimation {
  revealDurationMs?: number;
}
export type SankeyChartProps = Omit<
  NativeProps,
  "data" | "node" | "link" | "onClick" | "onMouseEnter" | "onMouseLeave"
> & {
  data: SankeyFlowData;
  node?:
    | Exclude<NativeProps["node"], (props: NativeNodeProps) => ReactNode>
    | ((props: SankeyNodeProps) => ReactNode);
  link?:
    | Exclude<NativeProps["link"], (props: NativeLinkProps) => ReactNode>
    | ((
        props: SankeyLinkProps,
      ) => ReturnType<
        NonNullable<Extract<NativeProps["link"], (props: NativeLinkProps) => ReactNode>>
      >);
  onClick?: IdentityEvent;
  onMouseEnter?: IdentityEvent;
  onMouseLeave?: IdentityEvent;
  /** Opacity reveal only: geometry and proportional widths never animate. */
  animate?: boolean | SankeyAnimation;
  empty?: ReactNode;
};

/** Recharts owns layout, renderers, labels and events. Zero flows remain in the data alternative. */
export function SankeyChart({
  data,
  animate = false,
  empty = "No positive flows",
  ...props
}: SankeyChartProps) {
  const duration = typeof animate === "object" ? (animate.revealDurationMs ?? 450) : 450;
  if (!Number.isFinite(duration) || duration < 0)
    throw new Error("Sankey revealDurationMs must be finite and nonnegative");
  const validated = prepareSankeyData(data);
  const positive = validated.links.filter((link) => link.value > 0);
  const nativeKeys = new Set<string>();
  for (const link of positive) {
    const key = `${link.source}-${link.target}-${link.value}`;
    if (nativeKeys.has(key))
      throw new Error(
        "Sankey native renderer cannot distinguish equal-value parallel links; keep the table or supply a renderer that supports them.",
      );
    nativeKeys.add(key);
  }
  const used = new Set(positive.flatMap((link) => [link.source, link.target]));
  const mapping = new Map<number, number>();
  const nodes = validated.nodes.filter((_, index) => {
    if (!used.has(index)) return false;
    mapping.set(index, mapping.size);
    return true;
  });
  const links = positive.map((link) => ({
    ...link,
    source: mapping.get(link.source) as number,
    target: mapping.get(link.target) as number,
  }));
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [interrupted, setInterrupted] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const measured = useRef<{ width: number; height: number } | null>(null);
  const onSize = useCallback((width: number, height: number) => {
    const prior = measured.current;
    if (prior?.width === width && prior?.height === height) return;
    if (prior) setInterrupted(true);
    measured.current = { width, height };
    setSize(measured.current);
  }, []);
  const inputs = [
    data,
    props.width,
    props.height,
    props.nodePadding,
    props.nodeWidth,
    props.iterations,
    props.sort,
    props.align,
    props.verticalAlign,
    props.margin,
    props.linkCurvature,
    props.node,
    props.link,
  ];
  const previous = useRef(inputs);
  useLayoutEffect(() => {
    if (inputs.some((value, index) => value !== previous.current[index])) setInterrupted(true);
    previous.current = inputs;
  });
  const enabled = Boolean(animate) && !reduced && !interrupted && size !== null;
  const opacity = useMotionValue(1);
  useLayoutEffect(() => {
    if (!enabled) {
      opacity.set(1);
      return;
    }
    opacity.set(0);
    const playback = animateValue(opacity, 1, { duration: duration / 1000 });
    return () => playback.stop();
  }, [enabled, opacity, duration]);
  const margin = { top: 5, bottom: 5, left: 5, right: 5, ...props.margin };
  const height = size ? size.height - margin.top - margin.bottom : 0;
  const width = size ? size.width - margin.left - margin.right : 0;
  const padding = props.nodePadding ?? 10;
  const drawable =
    height > Math.max(0, nodes.length - 1) * padding && width > (props.nodeWidth ?? 10);
  if (drawable && links.length) {
    const total = links.reduce((sum, link) => sum + link.value, 0);
    const scale = height / total;
    const minimumScale = (height - Math.max(0, nodes.length - 1) * padding) / total;
    if (
      !Number.isFinite(total) ||
      !Number.isFinite(scale) ||
      scale <= 0 ||
      !Number.isFinite(total * height) ||
      links.some((link) => link.value * minimumScale === 0)
    )
      throw new Error(
        "Sankey flows exceed native renderer numeric limits at this size; use explicitly rescaled input units.",
      );
  }
  return (
    <motion.div
      data-kind-ui="sankey"
      onPointerDownCapture={() => setInterrupted(true)}
      onFocusCapture={() => setInterrupted(true)}
      style={{ opacity, position: "relative", width: "fit-content", height: "fit-content" }}
    >
      <EngineSankey
        {...(props as NativeProps)}
        data={drawable && links.length ? { nodes, links } : { nodes: [], links: [] }}
      >
        <NativeSize onSize={onSize} />
        {props.children}
      </EngineSankey>
      {!links.length ? (
        <div role="status" style={{ position: "absolute", inset: 0 }}>
          {empty}
        </div>
      ) : !drawable ? (
        <div role="status" style={{ position: "absolute", inset: 0 }}>
          Insufficient space for flows; use the data table
        </div>
      ) : null}
    </motion.div>
  );
}
