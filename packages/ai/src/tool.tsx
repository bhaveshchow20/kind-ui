"use client";

import { Badge, type BadgeTone } from "@kind-ui/primitives/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@kind-ui/primitives/collapsible";
import {
  Ban,
  Check,
  ChevronRight,
  Circle,
  CircleAlert,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  Wrench,
} from "lucide-react";
import { parse } from "partial-json";
import { type ComponentProps, isValidElement, type ReactNode } from "react";
import { cn, focusRing, surfaceClass } from "./utils.js";

/** SDK-independent, detailed invocation lifecycle. The host owns every transition. */
export type ToolState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-denied"
  | "output-error";

/** Optional shorthand states for runtimes with a coarser lifecycle. */
export type ToolStateAlias = "pending" | "approval" | "running" | "success" | "error";
export type ToolStatusValue = ToolState | ToolStateAlias;

/** A display contract, not an AI SDK message-part type or an execution request. */
export type ToolPart<Input = unknown, Output = unknown> = {
  state: ToolState;
  input?: Input;
  output?: Output;
  errorText?: string | undefined;
  toolCallId?: string | undefined;
  approval?:
    | { id: string; approved?: boolean | undefined; reason?: string | undefined }
    | undefined;
} & ({ type: `tool-${string}`; toolName?: never } | { type: "dynamic-tool"; toolName: string });

const aliases: Record<ToolStateAlias, ToolState> = {
  pending: "input-streaming",
  approval: "approval-requested",
  running: "input-available",
  success: "output-available",
  error: "output-error",
};

function normalizeState(state: ToolStatusValue): ToolState {
  return state in aliases ? aliases[state as ToolStateAlias] : (state as ToolState);
}

const labels: Record<ToolState, string> = {
  "input-streaming": "Preparing input",
  "input-available": "Input ready",
  "approval-requested": "Awaiting approval",
  "approval-responded": "Approval submitted",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error",
};

export type ToolProps = ComponentProps<typeof Collapsible> & {
  state?: ToolStatusValue | undefined;
};

export function Tool({ state, className, ...props }: ToolProps) {
  return (
    <Collapsible
      {...props}
      data-slot="tool"
      data-state={state === undefined ? undefined : normalizeState(state)}
      data-running={state === "running" || undefined}
      aria-busy={
        props["aria-busy"] ??
        (state === "running" ||
          (state !== undefined && normalizeState(state) === "input-streaming") ||
          undefined)
      }
      className={(primitiveState) =>
        cn(
          surfaceClass,
          "group/tool min-w-0 w-full rounded-xl transition-colors duration-150 motion-reduce:transition-none",
          "data-[state=approval-requested]:bg-warning/5",
          typeof className === "function" ? className(primitiveState) : className,
        )
      }
    />
  );
}

export type ToolTriggerProps = ComponentProps<typeof CollapsibleTrigger>;

export function ToolTrigger({ className, children, ...props }: ToolTriggerProps) {
  return (
    <CollapsibleTrigger
      {...props}
      data-slot="tool-trigger"
      className={(primitiveState) =>
        cn(
          "group/tool-trigger flex min-h-9 w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl px-3 py-1.5 text-start text-ai-label transition-colors duration-120 hover:bg-secondary/40 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 coarse:min-h-12",
          "group-data-[state=output-error]/tool:text-danger-text",
          typeof className === "function" ? className(primitiveState) : className,
        )
      }
    >
      {children}
      <ChevronRight
        aria-hidden="true"
        nonScalingStroke
        strokeWidth={1.5}
        size={14}
        className="ms-auto size-3.5 shrink-0 text-muted-foreground/70 group-has-[[data-slot=tool-status]]/tool-trigger:ms-0 transition-transform duration-180 ease-kind-out group-data-open/tool:rotate-90 motion-reduce:transition-none"
      />
    </CollapsibleTrigger>
  );
}

export type ToolHeaderProps = Omit<ToolTriggerProps, "type" | "title" | "children"> & {
  title?: string | undefined;
  state: ToolStatusValue;
} & ({ type: `tool-${string}`; toolName?: never } | { type: "dynamic-tool"; toolName: string });

export function ToolHeader({ title, type, state, toolName, ...props }: ToolHeaderProps) {
  const name = title ?? (type === "dynamic-tool" ? toolName : type.slice(5));
  return (
    <ToolTrigger {...props} data-slot="tool-header">
      <ToolIcon>
        <Wrench aria-hidden="true" nonScalingStroke strokeWidth={1.5} size={14} />
      </ToolIcon>
      <ToolName>{name}</ToolName>
      <ToolStatus state={state} className="ms-auto" />
    </ToolTrigger>
  );
}

export type ToolStatusProps = ComponentProps<"span"> & { state: ToolStatusValue };

export function ToolStatus({ state, children, className, ...props }: ToolStatusProps) {
  const status = normalizeState(state);
  const StatusIcon =
    status === "output-available"
      ? Check
      : status === "approval-responded"
        ? MessageSquareText
        : status === "output-error"
          ? CircleAlert
          : status === "output-denied"
            ? Ban
            : status === "approval-requested"
              ? Clock3
              : state === "running"
                ? LoaderCircle
                : Circle;
  const tone: BadgeTone =
    status === "approval-requested"
      ? "warning"
      : status === "output-available"
        ? "success"
        : status === "output-error"
          ? "danger"
          : "neutral";
  return (
    <Badge
      {...props}
      tone={tone}
      size="sm"
      data-slot="tool-status"
      data-state={status}
      className={cn(
        "shrink-0 whitespace-normal [overflow-wrap:anywhere] border-0 bg-secondary/40 px-1.5 text-ai-meta transition-colors duration-120 motion-reduce:transition-none",
        status === "approval-requested" && "bg-warning/10",
        status === "output-error" && "bg-destructive/8",
        className,
      )}
    >
      <StatusIcon
        aria-hidden="true"
        nonScalingStroke
        strokeWidth={1.5}
        size={14}
        className={cn("size-3.5 shrink-0", state === "running" && "motion-safe:animate-spin")}
      />
      {children ??
        (state === "running" ? "Running" : state === "pending" ? "Pending" : labels[status])}
    </Badge>
  );
}

export function getStatusBadge(state: ToolStatusValue): ReactNode {
  return <ToolStatus state={state} />;
}

export type ToolIconProps = ComponentProps<"span">;
export function ToolIcon({ className, children, ...props }: ToolIconProps) {
  return (
    <span
      {...props}
      data-slot="tool-icon"
      aria-hidden="true"
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-3.5",
        className,
      )}
    >
      <span className="inline-flex group-data-[running]/tool:hidden">{children}</span>
      <LoaderCircle
        aria-hidden="true"
        nonScalingStroke
        strokeWidth={1.5}
        size={14}
        className="hidden group-data-[running]/tool:block motion-safe:animate-spin"
      />
    </span>
  );
}

export type ToolNameProps = ComponentProps<"span">;
export function ToolName({ className, ...props }: ToolNameProps) {
  return (
    <span
      {...props}
      data-slot="tool-name"
      className={cn(
        "min-w-0 flex-1 [overflow-wrap:anywhere] text-ai-label font-medium text-foreground",
        className,
      )}
    />
  );
}

export type ToolLabelProps = ComponentProps<"span">;
export function ToolLabel({ className, ...props }: ToolLabelProps) {
  return (
    <span
      {...props}
      data-slot="tool-label"
      className={cn("min-w-0 break-words text-ai-description text-muted-foreground", className)}
    />
  );
}

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;
export function ToolContent({ className, children, ...props }: ToolContentProps) {
  return (
    <CollapsibleContent
      {...props}
      data-slot="tool-content"
      className={(primitiveState) =>
        cn(
          "min-w-0 origin-top motion-safe:transition-[opacity,transform] motion-safe:duration-150 motion-safe:ease-kind-out motion-safe:data-starting-style:opacity-0 motion-safe:data-ending-style:opacity-0 motion-safe:data-ending-style:duration-100 motion-safe:data-starting-style:-translate-y-0.5 motion-safe:data-ending-style:-translate-y-0.5 motion-reduce:transition-none",
          typeof className === "function" ? className(primitiveState) : className,
        )
      }
    >
      <div className="space-y-3 px-3 pt-1 pb-3 text-ai-body">{children}</div>
    </CollapsibleContent>
  );
}

export type ToolSubtitleProps = ComponentProps<"div">;
export function ToolSubtitle({ className, ...props }: ToolSubtitleProps) {
  return (
    <div
      {...props}
      data-slot="tool-subtitle"
      className={cn("text-ai-description font-medium text-muted-foreground", className)}
    />
  );
}

export type ToolBlockProps = ComponentProps<"pre">;
export function ToolBlock({ className, tabIndex = 0, ...props }: ToolBlockProps) {
  return (
    <pre
      {...props}
      tabIndex={tabIndex}
      data-slot="tool-block"
      className={cn(
        "min-w-0 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border/45 bg-inset px-2.5 py-2 font-mono text-ai-description text-foreground/85 [overflow-wrap:anywhere] [tab-size:2]",
        focusRing,
        className,
      )}
    />
  );
}

export type ToolErrorProps = ComponentProps<"div">;
export function ToolError({ className, ...props }: ToolErrorProps) {
  return (
    <div
      {...props}
      data-slot="tool-error"
      className={cn(
        "hidden rounded-lg bg-destructive/5 px-2.5 py-2 text-ai-body text-danger-text group-data-[state=output-error]/tool:block",
        className,
      )}
    />
  );
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";
  try {
    return (
      JSON.stringify(
        value,
        (_key, item: unknown) => (typeof item === "bigint" ? String(item) : item),
        2,
      ) ?? String(value)
    );
  } catch {
    return "[Value cannot be serialized]";
  }
}

export type ToolInputProps = Omit<ComponentProps<"div">, "children"> & {
  input: unknown;
  label?: ReactNode;
};
export function ToolInput({ input, label = "Parameters", className, ...props }: ToolInputProps) {
  return (
    <div {...props} data-slot="tool-input" className={cn("min-w-0 space-y-1.5", className)}>
      <ToolSubtitle>{label}</ToolSubtitle>
      <ToolBlock>
        {typeof input === "string" ? JSON.stringify(input) : formatValue(input)}
      </ToolBlock>
    </div>
  );
}

export type ToolOutputProps = Omit<ComponentProps<"div">, "children"> & {
  output?: unknown;
  errorText?: string | undefined;
  label?: ReactNode;
};
export function ToolOutput({ output, errorText, label, className, ...props }: ToolOutputProps) {
  if (output === undefined && !errorText) return null;
  return (
    <div {...props} data-slot="tool-output" className={cn("min-w-0 space-y-1.5", className)}>
      <ToolSubtitle>{label ?? (errorText ? "Error" : "Result")}</ToolSubtitle>
      {errorText ? (
        <div className="rounded-lg bg-destructive/5 px-2.5 py-2 text-ai-body text-danger-text">
          {errorText}
        </div>
      ) : null}
      {output !== undefined ? (
        isValidElement(output) ? (
          output
        ) : (
          <ToolBlock>{formatValue(output)}</ToolBlock>
        )
      ) : null}
    </div>
  );
}

export type ToolArgumentProps = Omit<ComponentProps<"div">, "children"> & {
  value: string;
  state?: "streaming" | "complete" | undefined;
};
export function ToolArgument({ value, state, className, ...props }: ToolArgumentProps) {
  if (!value.trim()) return null;
  let parsed: unknown;
  try {
    parsed = state === "streaming" ? parse(value) : JSON.parse(value);
  } catch {
    parsed = undefined;
  }
  const entries =
    parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? Object.entries(parsed as Record<string, unknown>)
      : null;
  return (
    <div
      {...props}
      data-slot="tool-argument"
      data-state={state}
      aria-busy={state === "streaming"}
      className={cn(
        "min-w-0 rounded-lg border border-border/45 bg-inset font-mono text-ai-description data-[state=streaming]:bg-secondary/40",
        className,
      )}
    >
      {entries && entries.length > 0 ? (
        <dl className="max-h-64 overflow-auto px-2.5 py-2">
          {entries.map(([key, entry]) => (
            <div
              key={key}
              data-slot="tool-argument-row"
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-3 gap-y-1 py-1.5 first:pt-0 last:pb-0"
            >
              <dt
                data-slot="tool-argument-key"
                className="min-w-0 break-words text-ai-description text-muted-foreground [overflow-wrap:anywhere]"
              >
                {key}
              </dt>
              <dd
                data-slot="tool-argument-value"
                className="min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
              >
                {formatValue(entry)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <ToolBlock data-slot="tool-argument-raw" className="rounded-none border-0 bg-transparent">
          {parsed === undefined ? value : formatValue(parsed)}
        </ToolBlock>
      )}
    </div>
  );
}
