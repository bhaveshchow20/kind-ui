"use client";

import { Meter } from "@base-ui/react/meter";
import type { Popover as BasePopover } from "@base-ui/react/popover";
import {
  Popover,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@kind-ui/primitives/popover";
import { useReducedMotion } from "@kind-ui/primitives/use-reduced-motion";
import { animate } from "motion/react";
import {
  type ComponentPropsWithRef,
  createContext,
  type ReactNode,
  type Ref,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "./utils.js";

export interface ContextUsage {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  totalTokens?: number;
}
/** Actual consumer-calculated monetary amounts; never inferred from a model name. */
export interface ContextCosts {
  input?: number;
  output?: number;
  reasoning?: number;
  cache?: number;
  total?: number;
}
export interface ContextModel {
  id: string;
  name?: string;
}
export interface ContextFormatters {
  tokens?: (value: number) => string;
  percent?: (ratio: number) => string;
  cost?: (value: number) => string;
}
interface ContextValue {
  usedTokens: number;
  maxTokens: number;
  usage: ContextUsage | undefined;
  costs: ContextCosts | undefined;
  model: ContextModel | undefined;
  tokenText: (value: number | undefined) => string;
  costText: (value: number | undefined) => string;
  percentText: string;
  ratio: number | undefined;
  locale: Intl.LocalesArgument;
}
const UsageContext = createContext<ContextValue | null>(null);
function useUsageContext() {
  const value = useContext(UsageContext);
  if (!value) throw new Error("Context parts must be used inside Context.");
  return value;
}
function validAmount(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value >= 0;
}
export type ContextProps = BasePopover.Root.Props & {
  usedTokens: number;
  maxTokens: number;
  usage?: ContextUsage;
  costs?: ContextCosts;
  model?: ContextModel;
  /** Display metadata only. Prefer model when a human-readable name is available. */
  modelId?: string;
  locale?: Intl.LocalesArgument;
  currency?: string;
  formatters?: ContextFormatters;
};
export function Context({
  usedTokens,
  maxTokens,
  usage,
  costs,
  model,
  modelId,
  locale = "en-US",
  currency = "USD",
  formatters,
  ...props
}: ContextProps) {
  const value = useMemo<ContextValue>(() => {
    const tokenFormat = new Intl.NumberFormat(locale, { notation: "compact" });
    const percentFormat = new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 1,
    });
    const moneyFormat = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 6,
    });
    const rawRatio =
      validAmount(usedTokens) && Number.isFinite(maxTokens) && maxTokens > 0
        ? usedTokens / maxTokens
        : undefined;
    const ratio = rawRatio !== undefined && Number.isFinite(rawRatio) ? rawRatio : undefined;
    return {
      usedTokens,
      maxTokens,
      usage,
      costs,
      locale,
      model: model ?? (modelId ? { id: modelId } : undefined),
      ratio,
      tokenText: (amount) =>
        validAmount(amount) ? (formatters?.tokens?.(amount) ?? tokenFormat.format(amount)) : "—",
      costText: (amount) =>
        validAmount(amount) ? (formatters?.cost?.(amount) ?? moneyFormat.format(amount)) : "—",
      percentText:
        ratio === undefined ? "—" : (formatters?.percent?.(ratio) ?? percentFormat.format(ratio)),
    };
  }, [usedTokens, maxTokens, usage, costs, model, modelId, locale, currency, formatters]);
  return (
    <UsageContext value={value}>
      <Popover {...props} />
    </UsageContext>
  );
}
export type ContextTriggerProps = BasePopover.Trigger.Props & { ref?: Ref<HTMLElement> };
export function ContextTrigger({
  children,
  className,
  openOnHover = true,
  delay = 150,
  closeDelay = 200,
  ...props
}: ContextTriggerProps) {
  const { ratio, percentText } = useUsageContext();
  const fraction = Math.max(0, Math.min(1, ratio ?? 0));
  return (
    <PopoverTrigger
      aria-label={
        ratio === undefined ? "Context usage unavailable" : `Context usage: ${percentText}`
      }
      openOnHover={openOnHover}
      delay={delay}
      closeDelay={closeDelay}
      {...props}
      data-slot="context-trigger"
      className={(state) =>
        cn(
          "inline-flex min-h-8 items-center justify-center coarse:min-h-11 gap-1.5 rounded-full bg-inset/40 ps-2.5 pe-2 text-ai-label font-medium tabular-nums text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:shadow-kind-focus",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {children ?? (
        <>
          <span>{percentText}</span>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" className="-rotate-90">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="opacity-20"
            />
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - fraction}
              strokeLinecap="round"
            />
          </svg>
        </>
      )}
    </PopoverTrigger>
  );
}
export type ContextContentProps = BasePopover.Popup.Props & {
  ref?: Ref<HTMLDivElement>;
  side?: BasePopover.Positioner.Props["side"];
  align?: BasePopover.Positioner.Props["align"];
  sideOffset?: number;
  alignOffset?: number;
  keepMounted?: boolean;
  container?: BasePopover.Portal.Props["container"];
};
export function ContextContent({
  className,
  children,
  side = "top",
  align = "end",
  sideOffset = 8,
  alignOffset = 0,
  keepMounted,
  container,
  ...props
}: ContextContentProps) {
  return (
    <PopoverPortal keepMounted={keepMounted} container={container}>
      <PopoverPositioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50"
      >
        <PopoverPopup
          aria-label="Context usage details"
          {...props}
          data-slot="context-content"
          className={(state) =>
            cn(
              "w-80 max-w-[calc(100vw-2rem)] divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-elevated text-foreground shadow-[0_8px_30px_rgb(0_0_0/0.10)] outline-none",
              typeof className === "function" ? className(state) : className,
            )
          }
        >
          {children}
        </PopoverPopup>
      </PopoverPositioner>
    </PopoverPortal>
  );
}
export type ContextContentHeaderProps = ComponentPropsWithRef<"div">;
export function ContextContentHeader({ className, children, ...props }: ContextContentHeaderProps) {
  const { usedTokens, maxTokens, percentText, tokenText, model, locale } = useUsageContext();
  return (
    <div {...props} data-slot="context-content-header" className={cn("space-y-2 p-3", className)}>
      {children ?? (
        <>
          {model && (
            <p className="break-words text-ai-title font-medium text-foreground">
              {model.name ?? model.id}
            </p>
          )}
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-ai-description tabular-nums">
            <span className="text-ai-title font-medium">{percentText}</span>
            <span className="text-muted-foreground">
              {tokenText(usedTokens)} / {maxTokens > 0 ? tokenText(maxTokens) : "—"}
            </span>
          </div>
          <UsageBar
            value={usedTokens}
            max={maxTokens}
            locale={locale}
            aria-label="Context window usage"
          />
        </>
      )}
    </div>
  );
}
export type ContextContentBodyProps = ComponentPropsWithRef<"div">;
export function ContextContentBody({ className, ...props }: ContextContentBodyProps) {
  return (
    <div {...props} data-slot="context-content-body" className={cn("space-y-2 p-3", className)} />
  );
}
export type ContextContentFooterProps = ComponentPropsWithRef<"div">;
export function ContextContentFooter({ className, children, ...props }: ContextContentFooterProps) {
  const { costs, costText } = useUsageContext();
  return (
    <div
      {...props}
      data-slot="context-content-footer"
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 bg-inset/60 px-3 py-2.5 text-ai-label tabular-nums",
        className,
      )}
    >
      {children ?? (
        <>
          <span className="text-muted-foreground">Total cost</span>
          <span className="font-medium text-foreground">{costText(costs?.total)}</span>
        </>
      )}
    </div>
  );
}
type UsageRowProps = ComponentPropsWithRef<"div">;
function ContextUsageRow({
  kind,
  className,
  children,
  ...props
}: UsageRowProps & { kind: "input" | "output" | "reasoning" | "cache" }) {
  const { usage, costs, tokenText, costText } = useUsageContext();
  const keys = {
    input: "inputTokens",
    output: "outputTokens",
    reasoning: "reasoningTokens",
    cache: "cachedInputTokens",
  } as const;
  const amount = usage?.[keys[kind]];
  // Explicit zero remains visible; absent/invalid counters never become fabricated usage.
  if (children == null && amount === undefined && costs?.[kind] === undefined) return null;
  return (
    <div
      {...props}
      data-slot={`context-${kind}-usage`}
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 text-ai-label tabular-nums",
        className,
      )}
    >
      {children ?? (
        <>
          <span className="text-muted-foreground">
            {kind === "cache" ? "Cache" : kind.charAt(0).toUpperCase() + kind.slice(1)}
          </span>
          <span className="text-end font-medium text-foreground">
            {tokenText(amount)}
            {costs?.[kind] !== undefined && (
              <span className="ms-2 inline-block min-w-20 text-end text-ai-meta font-normal text-muted-foreground">
                · {costText(costs[kind])}
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}
export type ContextInputUsageProps = UsageRowProps;
export type ContextOutputUsageProps = UsageRowProps;
export type ContextReasoningUsageProps = UsageRowProps;
export type ContextCacheUsageProps = UsageRowProps;
export function ContextInputUsage(props: ContextInputUsageProps) {
  return <ContextUsageRow {...props} kind="input" />;
}
export function ContextOutputUsage(props: ContextOutputUsageProps) {
  return <ContextUsageRow {...props} kind="output" />;
}
export function ContextReasoningUsage(props: ContextReasoningUsageProps) {
  return <ContextUsageRow {...props} kind="reasoning" />;
}
export function ContextCacheUsage(props: ContextCacheUsageProps) {
  return <ContextUsageRow {...props} kind="cache" />;
}

export type UsageMeterProps = ComponentPropsWithRef<"div"> & { size?: "sm" | "md" | "lg" };
export function UsageMeter({ size = "md", className, ...props }: UsageMeterProps) {
  return (
    <div
      {...props}
      data-slot="usage-meter"
      data-size={size}
      className={cn(
        "group/meter inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ai-label text-foreground [&_[data-slot=usage-bar]]:flex-1",
        size === "sm" && "gap-x-2.5 gap-y-1 text-ai-description",
        size === "lg" && "gap-x-4 gap-y-2 text-ai-body",
        className,
      )}
    />
  );
}
export type UsageStatProps = ComponentPropsWithRef<"div">;
export function UsageStat({ className, ...props }: UsageStatProps) {
  return (
    <div
      {...props}
      data-slot="usage-stat"
      className={cn("inline-flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5", className)}
    />
  );
}
export type UsageStatLabelProps = ComponentPropsWithRef<"span">;
export function UsageStatLabel({ className, ...props }: UsageStatLabelProps) {
  return (
    <span
      {...props}
      data-slot="usage-stat-label"
      className={cn("text-muted-foreground", className)}
    />
  );
}
export type UsageStatValueProps = ComponentPropsWithRef<"span">;
export function UsageStatValue({ className, ...props }: UsageStatValueProps) {
  return (
    <span
      {...props}
      data-slot="usage-stat-value"
      className={cn("font-medium tabular-nums text-foreground", className)}
    />
  );
}
export type AnimatedNumberProps = Omit<ComponentPropsWithRef<"span">, "children"> & {
  value: number;
  duration?: number;
  format?: (value: number) => ReactNode;
  locale?: Intl.LocalesArgument;
};
export function AnimatedNumber({
  value,
  duration = 300,
  format,
  locale = "en-US",
  className,
  ...props
}: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  useEffect(() => {
    if (
      !Number.isFinite(value) ||
      !Number.isFinite(displayRef.current) ||
      reducedMotion ||
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(displayRef.current, value, {
      duration: duration / 1000,
      ease: [0.215, 0.61, 0.355, 1],
      onUpdate: (next) => {
        displayRef.current = next;
        setDisplay(next);
      },
    });
    return () => controls.stop();
  }, [value, duration, reducedMotion]);
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const renderValue = (amount: number) =>
    Number.isFinite(amount) ? (format ? format(amount) : numberFormat.format(amount)) : "—";
  return (
    <span {...props} data-slot="animated-number" className={cn("tabular-nums", className)}>
      <span aria-hidden="true">{renderValue(reducedMotion ? value : display)}</span>
      <span className="sr-only">{renderValue(value)}</span>
    </span>
  );
}
export type UsageBarProps = Omit<Meter.Root.Props, "value" | "max"> & {
  value: number;
  max: number;
  ref?: Ref<HTMLDivElement>;
  warningThreshold?: number;
};
export function UsageBar({
  value,
  max,
  min = 0,
  warningThreshold = 0.8,
  className,
  children,
  ...props
}: UsageBarProps) {
  const validRange = Number.isFinite(min) && Number.isFinite(max) && max > min;
  const validValue = Number.isFinite(value);
  const floor = Number.isFinite(min) ? min : 0;
  const ceiling = validRange ? max : floor + 1;
  const clamped = validValue ? Math.max(floor, Math.min(ceiling, value)) : floor;
  const ratio = (clamped - floor) / (ceiling - floor);
  const threshold = Number.isFinite(warningThreshold)
    ? Math.max(0, Math.min(1, warningThreshold))
    : 0.8;
  const state = !validRange || !validValue ? "unknown" : ratio >= threshold ? "over" : "under";
  return (
    <Meter.Root
      aria-label="Usage"
      aria-valuetext={state === "unknown" ? "Usage unavailable" : undefined}
      {...props}
      min={floor}
      max={ceiling}
      value={state === "unknown" ? floor : clamped}
      data-slot="usage-bar"
      data-state={state}
      className={(meterState) =>
        cn(
          "group/bar flex min-w-32 flex-col gap-1.5",
          typeof className === "function" ? className(meterState) : className,
        )
      }
    >
      {children != null && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-ai-description tabular-nums text-muted-foreground">
          {children}
        </div>
      )}
      <Meter.Track
        data-slot="usage-bar-track"
        className="h-1.5 w-full overflow-hidden rounded-full bg-inset group-data-[size=sm]/meter:h-1 group-data-[size=lg]/meter:h-2"
      >
        <Meter.Indicator
          data-slot="usage-bar-fill"
          className="h-full rounded-full bg-primary group-data-[state=over]/bar:bg-destructive group-data-[state=unknown]/bar:bg-muted-foreground transition-colors duration-150 motion-reduce:transition-none"
        />
      </Meter.Track>
    </Meter.Root>
  );
}
