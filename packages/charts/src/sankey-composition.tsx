"use client";

import {
  createContext,
  type ReactElement,
  type ReactNode,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  Tooltip as NativeTooltip,
  ResponsiveContainer,
  type ResponsiveContainerProps,
  type TooltipProps,
} from "recharts";
import {
  type ChartName,
  type FamilyFrameOptions,
  FamilyRoot,
  familyFrame,
  familyVisibility,
  OutsidePlot,
} from "./family-root.js";
import { LoadingSkeletonSurface, LoadingStatus, useLoadingSeed } from "./loading-skeleton.js";
import { StandaloneLoadingDesign } from "./loading-standalone-designs.js";
import {
  SankeyChart as NativeSankeyChart,
  type SankeyChartProps as NativeSankeyChartProps,
  validateSankeyChartData,
} from "./sankey-chart.js";
import type { SankeyNodeConfig } from "./sankey-colors.js";
import { type SankeyFlowData, sankeyAdjacency } from "./sankey-data.js";
import { SankeyFocusMark } from "./sankey-interaction.js";
import { SankeyLegend, type SankeyLegendProps } from "./sankey-legend.js";
import {
  SankeyLink,
  type SankeyLinkProps,
  SankeyNode,
  type SankeyNodeProps,
} from "./sankey-marks.js";
import { SankeyTable, type SankeyTableProps } from "./sankey-table.js";
import { cn } from "./utils.js";

type Slots = {
  node?: ((props: SankeyNodeProps) => ReactNode) | true | undefined;
  link?: ((props: SankeyLinkProps) => ReactElement) | true | undefined;
};
type SlotKind = keyof Slots;
type Context = {
  data: SankeyFlowData;
  config: SankeyNodeConfig;
  slots: Slots;
  adjacent: Map<string, Set<string>>;
  register: <Kind extends SlotKind>(kind: Kind, id: string, renderer: Slots[Kind]) => () => void;
};
const Flow = createContext<Context | null>(null);
function useFlow() {
  const context = use(Flow);
  if (!context) throw new Error("Sankey compound parts require SankeyChart with config");
  return context;
}
export type SankeyChartProps = Omit<
  NativeSankeyChartProps,
  | "node"
  | "link"
  | "nodeConfig"
  | "width"
  | "height"
  | "children"
  | "interactionBinding"
  | "loadingPresentation"
  | keyof FamilyFrameOptions
> &
  FamilyFrameOptions &
  ChartName & {
    config: SankeyNodeConfig;
    children: Exclude<ReactNode, undefined>;
    width?: ResponsiveContainerProps["width"];
    height?: ResponsiveContainerProps["height"];
    responsive?: boolean;
  };
const renderNode = (props: SankeyNodeProps) => <FlowNode {...props} />;
const renderLink = (props: SankeyLinkProps) => <FlowLink {...props} />;
export function SankeyChart({
  config,
  interaction,
  emphasis,
  nonce,
  frameProps,
  visibleSeries,
  defaultVisibleSeries,
  onVisibleSeriesChange,
  legendPosition,
  ...props
}: SankeyChartProps) {
  if (!config || typeof config !== "object" || Array.isArray(config))
    throw new Error("SankeyChart requires config");
  if (["rootProps", "node", "link", "nodeConfig"].some((key) => Object.hasOwn(props, key)))
    throw new Error(
      "SankeyChart uses explicit Nodes and Links parts; root renderer options are unsupported",
    );
  validateSankeyChartData(props.data, config);
  const [entries, setEntries] = useState<{
    [Kind in SlotKind]?: { id: string; renderer: Slots[Kind] };
  }>({});
  const register = useCallback<Context["register"]>((kind, id, renderer) => {
    setEntries((current) => {
      if (current[kind] && current[kind].id !== id)
        throw new Error(`SankeyChart accepts one ${kind} renderer part`);
      return { ...current, [kind]: { id, renderer } };
    });
    return () =>
      setEntries((current) => {
        if (current[kind]?.id !== id) return current;
        const next = { ...current };
        delete next[kind];
        return next;
      });
  }, []);
  const metadata = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(config).map(([key, item]) => [
          key,
          { label: item.label, color: item.color },
        ]),
      ),
    [config],
  );
  const adjacent = useMemo(() => sankeyAdjacency(props.data), [props.data]);
  const context: Context = {
    data: props.data,
    config,
    adjacent,
    slots: { node: entries.node?.renderer, link: entries.link?.renderer },
    register,
  };
  if (props.children === undefined) throw new Error("SankeyChart requires explicit children");
  return (
    <FamilyRoot
      family="SankeyChart"
      config={metadata}
      name={props}
      loading={props.loading}
      interaction={
        interaction ?? {
          kind: "node",
          mode: "focus",
          eligibleKeys: props.data.nodes.map((node) => node.id),
        }
      }
      {...(emphasis !== undefined ? { emphasis } : {})}
      {...(nonce !== undefined ? { nonce } : {})}
      {...(frameProps !== undefined ? { frameProps } : {})}
      {...familyVisibility({ visibleSeries, defaultVisibleSeries, onVisibleSeriesChange })}
      {...(legendPosition ? { legendPosition } : {})}
    >
      <Flow value={context}>
        <FlowPlot {...props} />
      </Flow>
    </FamilyRoot>
  );
}
function FlowPlot({
  width,
  height,
  responsive = true,
  className,
  style,
  loading,
  loadingLabel,
  empty = "No positive flows",
  ...props
}: Omit<
  NativeSankeyChartProps,
  "width" | "height" | "node" | "link" | "nodeConfig" | "loadingPresentation"
> & {
  width?: ResponsiveContainerProps["width"];
  height?: ResponsiveContainerProps["height"];
  responsive?: boolean;
}) {
  const { config } = useFlow();
  const seed = useLoadingSeed(loading);
  const duration =
    typeof props.animate === "object" ? (props.animate.revealDurationMs ?? 450) : 450;
  if (!Number.isFinite(duration) || duration < 0)
    throw new Error("Sankey revealDurationMs must be finite and nonnegative");
  const native = {
    ...props,
    loading,
    node: renderNode,
    link: renderLink,
    nodeConfig: config,
    interactionBinding: "root" as const,
    loadingPresentation: false,
  };
  if (!responsive && (typeof width !== "number" || typeof height !== "number"))
    throw new Error("SankeyChart with responsive=false requires numeric width and height");
  const frame = familyFrame({ width, height, className, style });
  const hasFlows = props.data.links.some((link) => link.value > 0);
  return (
    <div
      data-kind-ui="sankey-frame"
      {...frame}
      className={cn(
        frame.className,
        "relative [&>[data-kind-ui=chart-loading-skeleton]]:absolute [&>[data-kind-ui=chart-loading-skeleton]]:inset-0",
      )}
    >
      <div
        data-kind-ui="sankey-geometry"
        data-loading={loading || undefined}
        aria-busy={loading}
        aria-hidden={loading || undefined}
        inert={loading || undefined}
        className="contents data-loading:[&>*]:invisible"
      >
        {responsive ? (
          <ResponsiveContainer width="100%" height="100%">
            <NativeSankeyChart {...native} />
          </ResponsiveContainer>
        ) : (
          <NativeSankeyChart {...native} width={width as number} height={height as number} />
        )}
      </div>
      {loading && (
        <LoadingSkeletonSurface
          family="sankey"
          design={(value) => <StandaloneLoadingDesign family="sankey" seed={value} />}
          width="100%"
          height="100%"
          seed={seed}
          animation={{ revealDurationMs: duration }}
        />
      )}
      <LoadingStatus loading={loading} label={loadingLabel} />
      {!loading && !hasFlows && (
        <div role="status" className="absolute inset-0">
          {empty}
        </div>
      )}
    </div>
  );
}
function FlowNode(props: SankeyNodeProps) {
  const { slots, adjacent } = useFlow();
  if (!slots.node) return <g />;
  return (
    <SankeyFocusMark nodeKey={props.payload.id} adjacent={adjacent}>
      {slots.node === true ? <SankeyNode {...props} /> : slots.node(props)}
    </SankeyFocusMark>
  );
}
function FlowLink(props: SankeyLinkProps) {
  const { slots, adjacent } = useFlow();
  if (!slots.link) return <g />;
  return (
    <SankeyFocusMark
      endpoints={[props.payload.source.id, props.payload.target.id]}
      adjacent={adjacent}
    >
      {slots.link === true ? <SankeyLink {...props} /> : slots.link(props)}
    </SankeyFocusMark>
  );
}

export function SankeyNodes({ render }: { render?: Exclude<Slots["node"], true> }) {
  const { register } = useFlow();
  const id = useId();
  useLayoutEffect(() => register("node", id, render ?? true), [register, id, render]);
  return null;
}
export function SankeyLinks({ render }: { render?: Exclude<Slots["link"], true> }) {
  const { register } = useFlow();
  const id = useId();
  useLayoutEffect(() => register("link", id, render ?? true), [register, id, render]);
  return null;
}
export type CompoundSankeyLegendProps = Omit<SankeyLegendProps, "config" | "interactionBinding">;
export function CompoundSankeyLegend(props: CompoundSankeyLegendProps) {
  const { config } = useFlow();
  return (
    <OutsidePlot>
      <SankeyLegend config={config} interactionBinding="root" {...props} />
    </OutsidePlot>
  );
}
export function CompoundSankeyTable(props: Omit<SankeyTableProps, "data">) {
  const { data } = useFlow();
  return (
    <OutsidePlot>
      <SankeyTable data={data} {...props} />
    </OutsidePlot>
  );
}
function FlowTooltip(props: TooltipProps) {
  return (
    <NativeTooltip
      isAnimationActive={false}
      contentStyle={{
        padding: "6px 8px",
        fontSize: 12,
        lineHeight: "16px",
        background: "var(--popover, Canvas)",
        color: "var(--popover-foreground, CanvasText)",
        border: "1px solid var(--border, GrayText)",
        borderRadius: "var(--radius, 8px)",
      }}
      itemStyle={{ padding: 0, color: "inherit" }}
      {...props}
    />
  );
}
export const SankeyComposition = { Tooltip: FlowTooltip };
