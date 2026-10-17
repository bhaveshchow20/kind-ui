"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { Button } from "@kind-ui/primitives/button";
import { CircleAlert, FileQuestionMark } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ToolState } from "./tool.js";
import { actionVariants, cn, surfaceClass } from "./utils.js";

export type ConfirmationState = "pending" | "approved" | "rejected";
export type ConfirmationTone = "default" | "danger";
export type ConfirmationApproval = {
  id: string;
  approved?: boolean | undefined;
  reason?: string | undefined;
};
export type ConfirmationResponse = { id: string; approved: boolean };

type ConfirmationContextValue = {
  state: ConfirmationState;
  busy: boolean;
  disabled: boolean;
  request: (next: "approved" | "rejected") => void;
};
const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);
function useConfirmation() {
  const value = useContext(ConfirmationContext);
  if (!value) throw new Error("Confirmation parts must be used within Confirmation.");
  return value;
}

export type ConfirmationProps = Omit<ComponentProps<"div">, "onChange"> & {
  state?: ConfirmationState | ToolState | undefined;
  defaultState?: ConfirmationState | undefined;
  approval?: ConfirmationApproval | undefined;
  onStateChange?: ((state: ConfirmationState) => void | Promise<void>) | undefined;
  onApprovalResponse?: ((response: ConfirmationResponse) => void | Promise<void>) | undefined;
  onDecisionError?: ((error: unknown) => void) | undefined;
  tone?: ConfirmationTone | undefined;
  submitting?: boolean | undefined;
  disabled?: boolean | undefined;
};

/** Class utility matching the public tone API; no variant-library dependency. */
export function confirmationVariants({
  tone = "default",
  className,
}: {
  tone?: ConfirmationTone | undefined;
  className?: string | undefined;
} = {}): string {
  return cn(
    surfaceClass,
    "group/confirmation flex min-w-0 flex-col rounded-xl transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:shadow-kind-focus",
    tone === "danger" && "border-destructive/25",
    className,
  );
}

export function Confirmation({
  state: stateProp,
  defaultState = "pending",
  approval,
  onStateChange,
  onApprovalResponse,
  onDecisionError,
  tone = "default",
  submitting = false,
  disabled = false,
  className,
  children,
  ref,
  onFocusCapture,
  onBlurCapture,
  ...props
}: ConfirmationProps) {
  const [internalState, setInternalState] = useState(defaultState);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  const generation = useRef(0);
  const root = useRef<HTMLDivElement | null>(null);
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === "function") {
        const cleanup = ref(node);
        if (typeof cleanup === "function")
          return () => {
            root.current = null;
            cleanup();
          };
      } else if (ref) ref.current = node;
    },
    [ref],
  );
  const focusedChild = useRef<HTMLElement | null>(null);
  // Keep the receipt reachable when a decision removes its focused action.
  // Do not reclaim focus if the user has already moved elsewhere.
  useLayoutEffect(() => {
    const previous = focusedChild.current;
    if (previous && !previous.isConnected) {
      focusedChild.current = null;
      if (previous.ownerDocument.activeElement === previous.ownerDocument.body)
        root.current?.focus({ preventScroll: true });
    }
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: A new approval ID invalidates the previous request generation and clears its pending UI.
  useEffect(() => {
    generation.current += 1;
    lock.current = false;
    setBusy(false);
    setFailed(false);
    return () => {
      generation.current += 1;
    };
  }, [approval?.id]);
  const lifecycleMode =
    stateProp !== undefined &&
    stateProp !== "pending" &&
    stateProp !== "approved" &&
    stateProp !== "rejected";
  const state: ConfirmationState =
    lifecycleMode || (stateProp === undefined && approval !== undefined)
      ? stateProp === "approval-requested"
        ? "pending"
        : approval?.approved === true
          ? "approved"
          : approval?.approved === false
            ? "rejected"
            : "pending"
      : ((stateProp as ConfirmationState | undefined) ?? internalState);
  const controlled = stateProp !== undefined || approval !== undefined;
  const active =
    !lifecycleMode ||
    (approval !== undefined && stateProp !== "input-streaming" && stateProp !== "input-available");
  const blocked =
    disabled ||
    submitting ||
    busy ||
    state !== "pending" ||
    (lifecycleMode && stateProp !== "approval-requested");

  const request = (next: "approved" | "rejected") => {
    if (blocked || lock.current) return;
    lock.current = true;
    const version = generation.current;
    const current = () => mounted.current && version === generation.current;
    setBusy(true);
    setFailed(false);
    // A resolved callback confirms only a decision, never execution success.
    const settle = async () => {
      try {
        await onStateChange?.(next);
        if (!current()) return;
        if (approval)
          await onApprovalResponse?.({ id: approval.id, approved: next === "approved" });
        if (current() && !controlled) setInternalState(next);
      } catch (error: unknown) {
        if (current()) {
          setFailed(true);
          onDecisionError?.(error);
        }
      } finally {
        if (current()) {
          lock.current = false;
          setBusy(false);
        }
      }
    };
    void settle();
  };

  if (!active) return null;
  return (
    <ConfirmationContext.Provider
      value={{ state, busy: busy || submitting, disabled: blocked, request }}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: Preserve the public div ref contract for this named approval group. */}
      <div
        role="group"
        tabIndex={-1}
        {...props}
        ref={setRootRef}
        onFocusCapture={(event) => {
          onFocusCapture?.(event);
          focusedChild.current = event.target;
        }}
        onBlurCapture={(event) => {
          onBlurCapture?.(event);
          if (
            event.target.isConnected &&
            !event.currentTarget.contains(
              event.relatedTarget ?? event.currentTarget.ownerDocument.activeElement,
            )
          )
            focusedChild.current = null;
        }}
        aria-label={props["aria-label"] ?? (props["aria-labelledby"] ? undefined : "Confirmation")}
        aria-busy={busy || submitting}
        data-slot="confirmation"
        data-state={state}
        data-tone={tone}
        className={confirmationVariants({ tone, className })}
      >
        {children}
        <span role="status" aria-atomic="true" className="sr-only">
          {busy || submitting
            ? "Submitting decision…"
            : state === "approved"
              ? "Approved"
              : state === "rejected"
                ? "Declined"
                : ""}
        </span>
        {failed ? (
          <div
            role="alert"
            className="mx-3 mb-3 flex items-start gap-2 rounded-lg bg-destructive/5 px-2.5 py-2 text-ai-description text-danger-text"
          >
            <CircleAlert
              aria-hidden="true"
              size={14}
              strokeWidth={1.5}
              className="mt-0.5 size-3.5 shrink-0 [&_*]:[vector-effect:non-scaling-stroke]"
            />
            <span>Your choice could not be submitted. Try again.</span>
          </div>
        ) : null}
      </div>
    </ConfirmationContext.Provider>
  );
}

export type ConfirmationHeaderProps = ComponentProps<"header">;
export function ConfirmationHeader({ className, ...props }: ConfirmationHeaderProps) {
  return (
    <header
      {...props}
      data-slot="confirmation-header"
      className={cn("flex items-start gap-2 px-3 pt-3 pb-1.5", className)}
    />
  );
}
export type ConfirmationIconProps = ComponentProps<"span">;
export function ConfirmationIcon({ className, children, ...props }: ConfirmationIconProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      data-slot="confirmation-icon"
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary/40 text-muted-foreground [[data-tone=danger][data-state=pending]_&]:bg-destructive/5 [[data-tone=danger][data-state=pending]_&]:text-danger-text group-data-[state=approved]/confirmation:bg-success/8 group-data-[state=approved]/confirmation:text-success group-data-[state=rejected]/confirmation:bg-secondary/40 group-data-[state=rejected]/confirmation:text-muted-foreground [&_svg]:size-3.5",
        className,
      )}
    >
      {children === undefined && props.dangerouslySetInnerHTML === undefined ? (
        <FileQuestionMark
          aria-hidden="true"
          size={14}
          strokeWidth={1.5}
          className="[&_*]:[vector-effect:non-scaling-stroke]"
        />
      ) : (
        children
      )}
    </span>
  );
}
export type ConfirmationTitleProps = ComponentProps<"div">;
export function ConfirmationTitle({ className, ...props }: ConfirmationTitleProps) {
  return (
    <div
      {...props}
      data-slot="confirmation-title"
      className={cn(
        "min-w-0 flex-1 py-0.5 text-start text-ai-title font-medium break-words text-pretty",
        className,
      )}
    />
  );
}
export type ConfirmationDescriptionProps = ComponentProps<"div">;
export function ConfirmationDescription({ className, ...props }: ConfirmationDescriptionProps) {
  return (
    <div
      {...props}
      data-slot="confirmation-description"
      className={cn(
        "px-3 pb-2 text-start text-ai-description break-words text-pretty text-muted-foreground group-has-[[data-slot=confirmation-icon]]/confirmation:ps-12",
        className,
      )}
    />
  );
}
export type ConfirmationContentProps = ComponentProps<"div">;
export function ConfirmationContent({ className, ...props }: ConfirmationContentProps) {
  return (
    <div
      {...props}
      data-slot="confirmation-content"
      className={cn("min-w-0 px-3 pb-2 text-ai-body", className)}
    />
  );
}

export type ConfirmationPendingProps = ComponentProps<"div">;
export function ConfirmationPending(props: ConfirmationPendingProps) {
  const { state } = useConfirmation();
  return state === "pending" ? <div {...props} data-slot="confirmation-pending" /> : null;
}
export type ConfirmationRequestProps = ConfirmationPendingProps;
export function ConfirmationRequest(props: ConfirmationRequestProps) {
  return <ConfirmationPending {...props} />;
}
export type ConfirmationApprovedProps = ComponentProps<"div">;
export function ConfirmationApproved(props: ConfirmationApprovedProps) {
  const { state } = useConfirmation();
  return state === "approved" ? <div {...props} data-slot="confirmation-approved" /> : null;
}
export type ConfirmationAcceptedProps = ConfirmationApprovedProps;
export function ConfirmationAccepted(props: ConfirmationAcceptedProps) {
  return <ConfirmationApproved {...props} />;
}
export type ConfirmationRejectedProps = ComponentProps<"div">;
export function ConfirmationRejected(props: ConfirmationRejectedProps) {
  const { state } = useConfirmation();
  return state === "rejected" ? <div {...props} data-slot="confirmation-rejected" /> : null;
}

export type ConfirmationActionsProps = ComponentProps<"div">;
export function ConfirmationActions({ className, ...props }: ConfirmationActionsProps) {
  const { state } = useConfirmation();
  return state === "pending" ? (
    <div
      {...props}
      data-slot="confirmation-actions"
      className={cn("flex flex-wrap items-center justify-end gap-2 px-3 pt-2 pb-3", className)}
    />
  ) : null;
}

export type ConfirmationActionProps = ComponentProps<typeof BaseButton> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link" | undefined;
  size?: "sm" | "md" | "lg" | undefined;
};
/** Generic action button; consumers own its click behavior. */
export function ConfirmationAction({
  className,
  disabled = false,
  type = "button",
  variant = "default",
  size = "md",
  ...props
}: ConfirmationActionProps) {
  const context = useContext(ConfirmationContext);
  return (
    <BaseButton
      {...props}
      render={props.render ?? <Button variant={variant} size="sm" />}
      type={type}
      disabled={disabled || context?.disabled}
      data-slot="confirmation-action"
      className={(state) =>
        cn(
          actionVariants(variant),
          "min-h-8 px-3 text-ai-label coarse:min-h-11 motion-reduce:transition-none",
          variant === "outline" && "border border-transparent",
          size === "sm" && "min-h-8 px-3 text-ai-description",
          size === "lg" && "min-h-11 px-5",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type ConfirmationAcceptProps = ConfirmationActionProps;
export function ConfirmationAccept({
  onClick,
  disabled = false,
  className,
  children = "Approve",
  ...props
}: ConfirmationAcceptProps) {
  const context = useConfirmation();
  return (
    <ConfirmationAction
      {...props}
      type="button"
      disabled={disabled || context.disabled}
      className={(state) => cn(typeof className === "function" ? className(state) : className)}
      onClick={(event) => {
        if (context.disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented) context.request("approved");
      }}
    >
      {children}
    </ConfirmationAction>
  );
}
export type ConfirmationRejectProps = ConfirmationActionProps;
export function ConfirmationReject({
  onClick,
  disabled = false,
  children = "Decline",
  variant = "outline",
  ...props
}: ConfirmationRejectProps) {
  const context = useConfirmation();
  return (
    <ConfirmationAction
      {...props}
      type="button"
      variant={variant}
      disabled={disabled || context.disabled}
      onClick={(event) => {
        if (context.disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!event.defaultPrevented) context.request("rejected");
      }}
    >
      {children}
    </ConfirmationAction>
  );
}
export type ConfirmationStatusProps = ComponentProps<"div">;
export function ConfirmationStatus({ className, ...props }: ConfirmationStatusProps) {
  return (
    <div
      {...props}
      data-slot="confirmation-status"
      className={cn(
        "flex min-h-8 items-start gap-2 px-3 pt-1 pb-3 text-ai-description text-muted-foreground group-data-[state=approved]/confirmation:text-success [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
    />
  );
}
