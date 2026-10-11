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
  familyClass,
  familyVisibility,
  OutsidePlot,
} from "./family-root.js";
import {
  SankeyChart as NativeSankeyChart,
  type SankeyChartProps as NativeSankeyChartProps,
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
export type SankeyChartProps =
  | (NativeSankeyChartProps & { config?: never; rootProps?: never; legendPosition?: never })
  | (Omit<NativeSankeyChartProps, "node" | "link" | "nodeConfig" | "width" | "height"> &
      FamilyFrameOptions &
      ChartName & {
        config: SankeyNodeConfig;
        children: ReactNode;
        width?: ResponsiveContainerProps["width"];
        height?: ResponsiveContainerProps["height"];
        responsive?: boolean;
        node?: never;
        link?: never;
        nodeConfig?: never;
      });
const renderNode = (props: SankeyNodeProps) => <FlowNode {...props} />;
const renderLink = (props: SankeyLinkProps) => <FlowLink {...props} />;
export function SankeyChart(props: SankeyChartProps) {
  if (props.config === undefined) {
    if (props.rootProps !== undefined || props.legendPosition !== undefined)
      throw new Error("SankeyChart frame options require config");
    return <NativeSankeyChart {...props} />;
  }
  if (props.node !== undefined || props.link !== undefined || props.nodeConfig !== undefined)
    throw new Error(
      "Explicit SankeyChart uses Nodes and Links parts; remove node, link and nodeConfig",
    );
  return <FlowRoot {...props} />;
}
function FlowRoot({
  config,
  rootProps,
  visibleSeries,
  defaultVisibleSeries,
  onVisibleSeriesChange,
  legendPosition,
  ...props
}: Extract<SankeyChartProps, { config: SankeyNodeConfig }>) {
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
      rootProps={{
        ...rootProps,
        interaction: rootProps?.interaction ?? {
          kind: "node",
          mode: "focus",
          eligibleKeys: props.data.nodes.map((node) => node.id),
        },
      }}
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
  ...props
}: Omit<NativeSankeyChartProps, "width" | "height"> & {
  width?: ResponsiveContainerProps["width"];
  height?: ResponsiveContainerProps["height"];
  responsive?: boolean;
}) {
  const { config } = useFlow();
  const renderers = {
    node: renderNode,
    link: renderLink,
    nodeConfig: config,
    interactionBinding: props.interactionBinding ?? ("root" as const),
  };
  if (!responsive) {
    if (typeof width !== "number" || typeof height !== "number")
      throw new Error("SankeyChart with responsive=false requires numeric width and height");
    return (
      <NativeSankeyChart
        {...props}
        {...renderers}
        width={width}
        height={height}
        {...(className ? { className } : {})}
        {...(style ? { style } : {})}
      />
    );
  }
  return (
    <div
      className={familyClass(className)}
      style={{
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        ...style,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <NativeSankeyChart {...props} {...renderers} />
      </ResponsiveContainer>
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
export function CompoundSankeyLegend(props: Omit<SankeyLegendProps, "config">) {
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
