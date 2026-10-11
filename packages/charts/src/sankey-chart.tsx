"use client";

import {
  animate as animateValue,
  type MotionValue,
  type Transition,
  useMotionValue,
} from "motion/react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  use,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Sankey as EngineSankey,
  type SankeyLinkProps as NativeLinkProps,
  useChartHeight,
  useChartWidth,
} from "recharts";
import { MotionContext, RegisterInteractionMotion } from "./animation.js";
import { useOptionalChartInteraction } from "./chart-interaction.js";
import { LoadingSkeletonSurface, LoadingStatus, useLoadingSeed } from "./loading-skeleton.js";
import { StandaloneLoadingDesign } from "./loading-standalone-designs.js";
import { useReducedMotion } from "./motion-preference.js";
import { SankeyColors, type SankeyNodeConfig } from "./sankey-colors.js";
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
type NativeProps = ComponentProps<typeof EngineSankey>;
type NativeEvent = NonNullable<NativeProps["onClick"]>;
type IdentityEvent = (
  item: SankeyNodeProps | SankeyLinkProps,
  type: Parameters<NativeEvent>[1],
  event: Parameters<NativeEvent>[2],
) => void;
export interface SankeyAnimation {
  revealDurationMs?: number;
  hoverTransition?: Transition;
}
export type SankeyChartProps = Omit<
  NativeProps,
  "data" | "node" | "link" | "onClick" | "onMouseEnter" | "onMouseLeave"
> & {
  data: SankeyFlowData;
  /** Node-ID metadata supplied by the owning compound chart. */
  nodeConfig: SankeyNodeConfig;
  /** Explicit node-focus binding; the owning chart must use node focus. */
  interactionBinding?: "root";
  node: (props: SankeyNodeProps) => ReactNode;
  link: (
    props: SankeyLinkProps,
  ) => ReturnType<NonNullable<Extract<NativeProps["link"], (props: NativeLinkProps) => ReactNode>>>;
  onClick?: IdentityEvent;
  onMouseEnter?: IdentityEvent;
  onMouseLeave?: IdentityEvent;
  /** Kind SankeyLink paint flows along unchanged paths; custom renderers retain ownership. */
  animate?: boolean | SankeyAnimation;
  loading?: boolean | undefined;
  loadingLabel?: string | undefined;
  /** Internal: a responsive owning frame can render this boundary before native geometry mounts. */
  loadingPresentation?: boolean;
  empty?: ReactNode;
};

export const SankeyMotion = createContext<{
  reveal: boolean;
  progress: MotionValue<number> | null;
  width: number;
}>({ reveal: false, progress: null, width: 1 });

/** Validate semantic/native identity before responsive geometry is available. */
export function validateSankeyChartData(data: SankeyFlowData, nodeConfig: SankeyNodeConfig) {
  const validated = prepareSankeyData(data);
  for (const node of validated.nodes) {
    if (!Object.hasOwn(nodeConfig, node.id))
      throw new Error(`Sankey config requires metadata for node "${node.id}"`);
  }
  const nativeKeys = new Set<string>();
  for (const link of validated.links.filter((link) => link.value > 0)) {
    const key = `${link.source}-${link.target}-${link.value}`;
    if (nativeKeys.has(key))
      throw new Error(
        "Sankey native renderer cannot distinguish equal-value parallel links; keep the table or supply a renderer that supports them.",
      );
    nativeKeys.add(key);
  }
  return validated;
}

/** Recharts owns layout, renderers, labels and events. Zero flows remain in the data alternative. */
export function SankeyChart({
  data,
  nodeConfig,
  interactionBinding,
  animate = false,
  loading,
  loadingLabel,
  loadingPresentation = true,
  empty = "No positive flows",
  ...props
}: SankeyChartProps) {
  const motion = use(MotionContext);
  const interaction = useOptionalChartInteraction();
  if (
    interactionBinding &&
    (!interaction || interaction.kind !== "node" || interaction.mode !== "focus")
  )
    throw new Error("SankeyChart interaction binding requires node focus");
  const loadingSeed = useLoadingSeed(loading);
  const duration = typeof animate === "object" ? (animate.revealDurationMs ?? 450) : 450;
  if (!Number.isFinite(duration) || duration < 0)
    throw new Error("Sankey revealDurationMs must be finite and nonnegative");
  const validated = validateSankeyChartData(data, nodeConfig);
  const positive = validated.links.filter((link) => link.value > 0);
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
  const reduced = useReducedMotion();
  const [interrupted, setInterrupted] = useState(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const measured = useRef<{ width: number; height: number } | null>(null);
  const previousLoading = useRef(loading);
  const completing = previousLoading.current === true && loading !== true;
  const onSize = useCallback(
    (width: number, height: number) => {
      const prior = measured.current;
      if (prior?.width === width && prior?.height === height) return;
      if (prior && !loading && !completing) setInterrupted(true);
      measured.current = { width, height };
      setSize(measured.current);
    },
    [loading, completing],
  );
  useLayoutEffect(() => {
    if (loading) setInterrupted(false);
  }, [loading]);
  const inputs = [
    duration,
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
  const started = useRef(false);
  const previous = useRef(inputs);
  useLayoutEffect(() => {
    if (
      !loading &&
      !completing &&
      inputs.some(
        (value, index) => (index !== 0 || started.current) && value !== previous.current[index],
      )
    )
      setInterrupted(true);
    previous.current = inputs;
    previousLoading.current = loading;
  });
  const enabled = Boolean(animate) && !reduced && !loading;
  const previousEnabled = useRef(enabled);
  useLayoutEffect(() => {
    if (previousEnabled.current && !enabled && !loading) setInterrupted(true);
    previousEnabled.current = enabled;
  }, [enabled, loading]);
  const reveal = enabled && !interrupted && size !== null;
  const progress = useMotionValue(1);
  useLayoutEffect(() => {
    if (!reveal) {
      progress.set(1);
      return;
    }
    started.current = true;
    progress.set(0);
    const playback = animateValue(progress, 1, {
      duration: duration / 1000,
      onComplete: () => setInterrupted(true),
    });
    return () => playback.stop();
  }, [reveal, progress, duration]);
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
    <MotionContext
      value={{
        enabled,
        transition:
          typeof animate === "object"
            ? (animate.hoverTransition ?? motion.transition)
            : motion.transition,
      }}
    >
      <RegisterInteractionMotion enabled={enabled} />
      <SankeyColors value={nodeConfig}>
        <SankeyMotion value={{ reveal, progress, width: size?.width ?? 1 }}>
          <div
            data-kind-ui="sankey"
            onPointerDownCapture={() => {
              if (!loading) setInterrupted(true);
            }}
            onFocusCapture={() => {
              if (!loading) setInterrupted(true);
            }}
            className="relative h-fit w-fit text-[color:var(--foreground,inherit)] [&>[data-kind-ui=chart-loading-skeleton]]:absolute [&>[data-kind-ui=chart-loading-skeleton]]:inset-0"
          >
            <div
              data-kind-ui="sankey-content"
              data-loading={loading || undefined}
              aria-busy={loading}
              aria-hidden={loading || undefined}
              inert={loading || undefined}
              className="contents data-loading:[&>*]:invisible"
            >
              <EngineSankey
                {...(props as NativeProps)}
                onClick={(item, type, event) => {
                  props.onClick?.(item as SankeyNodeProps | SankeyLinkProps, type, event);
                  if (interactionBinding && type === "node")
                    interaction?.activate(
                      { kind: "node", key: (item as SankeyNodeProps).payload.id },
                      "mark",
                      event,
                    );
                }}
                data={drawable && links.length ? { nodes, links } : { nodes: [], links: [] }}
              >
                <NativeSize onSize={onSize} />
                {props.children}
              </EngineSankey>
            </div>
            {loading && loadingPresentation && (
              <LoadingSkeletonSurface
                family="sankey"
                design={(seed) => <StandaloneLoadingDesign family="sankey" seed={seed} />}
                width="100%"
                height="100%"
                seed={loadingSeed}
                animation={{ revealDurationMs: duration }}
              />
            )}
            {loadingPresentation && <LoadingStatus loading={loading} label={loadingLabel} />}
            {!loading && !links.length && loadingPresentation ? (
              <div role="status" className="absolute inset-0">
                {empty}
              </div>
            ) : !loading && links.length > 0 && !drawable ? (
              <div role="status" className="absolute inset-0">
                Insufficient space for flows; use the data table
              </div>
            ) : null}
          </div>
        </SankeyMotion>
      </SankeyColors>
    </MotionContext>
  );
}
