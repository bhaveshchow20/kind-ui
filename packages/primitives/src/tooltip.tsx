"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import {
  type ComponentProps,
  cloneElement,
  createContext,
  isValidElement,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefAttributes,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "./utils.js";

type PositionerProps = ComponentProps<typeof BaseTooltip.Positioner>;
type PlacementProps = Pick<
  PositionerProps,
  "side" | "align" | "sideOffset" | "alignOffset" | "collisionPadding"
>;
export type TooltipPoint = { x: number; y: number };
/** Kind's additive touch gesture. Native Base UI change details pass through unchanged. */
export type TooltipTouchDetails = {
  reason: "touch-press";
  event: MouseEvent;
  trigger: HTMLElement;
  isCanceled: boolean;
  cancel: () => void;
};
export type TooltipChangeDetails = BaseTooltip.Root.ChangeEventDetails | TooltipTouchDetails;

type TooltipContextValue = {
  open: boolean;
  disabled: boolean;
  hasContent: boolean;
  asLabel: boolean;
  contentId: string;
  labelId: string;
  delay: number | undefined;
  closeDelay: number | undefined;
  triggerRef: RefObject<HTMLElement | null>;
  setHasContent: (present: boolean) => void;
  setContentId: (id: string) => void;
  setTriggerDisabled: (disabled: boolean) => void;
  toggleTouch: (event: ReactMouseEvent<HTMLElement>) => void;
};
const TooltipContext = createContext<TooltipContextValue | null>(null);
function isEmpty(content: ReactNode): boolean {
  if (content == null || typeof content === "boolean") return true;
  if (typeof content === "string") return content.trim().length === 0;
  if (Array.isArray(content)) return content.every(isEmpty);
  return false;
}

export type TooltipProps<Payload = unknown> = Omit<
  BaseTooltip.Root.Props<Payload>,
  "onOpenChange"
> &
  PlacementProps & {
    /** Omit for composition; null, false or blank suppress the shorthand popup. */
    content?: ReactNode;
    arrow?: boolean | undefined;
    /** Use tooltip content as the trigger's name, available even while closed. */
    asLabel?: boolean | undefined;
    /** Uses Base UI's native cursor anchor. Keyboard opens remain anchor-based. */
    followCursor?: boolean | undefined;
    anchorRef?: RefObject<Element | null> | undefined;
    /** Fractions inside the anchor: {x: 0.5, y: 0.5} is its center. */
    anchorPoint?: TooltipPoint | undefined;
    delay?: number | undefined;
    closeDelay?: number | undefined;
    container?: ComponentProps<typeof BaseTooltip.Portal>["container"];
    contentProps?: Omit<TooltipContentProps, "children"> | undefined;
    triggerProps?: Omit<TooltipTriggerProps<Payload>, "children" | "render"> | undefined;
    onOpenChange?: ((open: boolean, details: TooltipChangeDetails) => void) | undefined;
  };

/** Short syntax for one trigger, or the root of an explicitly composed tooltip. */
export function Tooltip<Payload = unknown>(inputProps: TooltipProps<Payload>) {
  const {
    children,
    content,
    asLabel = false,
    followCursor = false,
    trackCursorAxis,
    delay,
    closeDelay,
    open: controlledOpen,
    defaultOpen = false,
    disabled = false,
    onOpenChange,
    triggerId,
    arrow,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    anchorRef,
    anchorPoint,
    container,
    contentProps,
    triggerProps,
    ...props
  } = inputProps;
  const id = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [hasContent, setHasContent] = useState(true);
  const [triggerDisabled, setTriggerDisabled] = useState(false);
  const [contentId, setContentId] = useState(`${id}-content`);
  const [touchTriggerId, setTouchTriggerId] = useState<string>();
  const triggerRef = useRef<HTMLElement>(null);
  const shorthand = Object.hasOwn(inputProps, "content");
  const childDisabled =
    isValidElement<{ disabled?: boolean; "aria-disabled"?: boolean | "true" | "false" }>(
      children,
    ) &&
    (children.props.disabled ||
      children.props["aria-disabled"] === true ||
      children.props["aria-disabled"] === "true");
  const suppressed =
    disabled ||
    triggerDisabled ||
    !!(shorthand && childDisabled) ||
    (shorthand ? isEmpty(content) : !hasContent);
  const requestedOpen = controlledOpen ?? uncontrolledOpen;
  const open = !suppressed && requestedOpen;
  const commit = (next: boolean, details: TooltipChangeDetails) => {
    onOpenChange?.(next, details);
    if (!details.isCanceled && controlledOpen === undefined) setUncontrolledOpen(next);
  };
  const context: TooltipContextValue = {
    open,
    disabled: suppressed,
    hasContent: shorthand ? !isEmpty(content) : hasContent,
    asLabel,
    contentId,
    labelId: `${id}-label`,
    delay,
    closeDelay,
    triggerRef,
    setHasContent,
    setContentId,
    setTriggerDisabled,
    toggleTouch(event) {
      if (
        suppressed ||
        event.defaultPrevented ||
        event.currentTarget.matches(":disabled") ||
        event.currentTarget.getAttribute("aria-disabled") === "true"
      )
        return;
      const details: TooltipTouchDetails = {
        reason: "touch-press",
        event: event.nativeEvent,
        trigger: event.currentTarget,
        isCanceled: false,
        cancel: () => {
          details.isCanceled = true;
        },
      };
      commit(!open, details);
      if (!details.isCanceled) setTouchTriggerId(open ? undefined : event.currentTarget.id);
    },
  };
  const wrap = (node: ReactNode) => (
    <TooltipContext.Provider value={context}>{node}</TooltipContext.Provider>
  );
  // Keep valid trigger ancestry stable as content becomes empty or is restored.
  if (shorthand && !isValidElement(children))
    return typeof children === "function" ? null : children;
  return (
    <BaseTooltip.Root
      {...props}
      open={requestedOpen}
      disabled={suppressed}
      triggerId={triggerId ?? touchTriggerId}
      trackCursorAxis={trackCursorAxis ?? (followCursor ? "both" : "none")}
      onOpenChange={(next, details) => {
        commit(next, details);
        if (!details.isCanceled) setTouchTriggerId(undefined);
      }}
    >
      {shorthand
        ? wrap(
            <>
              {anchorRef ? (
                children
              ) : (
                <TooltipTrigger
                  {...triggerProps}
                  render={isValidElement(children) ? children : undefined}
                />
              )}
              <TooltipContent
                side={side}
                align={align}
                sideOffset={sideOffset}
                alignOffset={alignOffset}
                collisionPadding={collisionPadding}
                arrow={arrow}
                anchorRef={anchorRef}
                anchorPoint={anchorPoint}
                container={container}
                {...contentProps}
              >
                {content}
              </TooltipContent>
            </>,
          )
        : typeof children === "function"
          ? (payload) => wrap(children(payload))
          : wrap(children)}
    </BaseTooltip.Root>
  );
}

export type TooltipTriggerProps<Payload = unknown> = Omit<
  BaseTooltip.Trigger.Props<Payload>,
  "ref"
> &
  RefAttributes<HTMLElement>;
/** Render composition keeps the consumer's original element, ref and handlers. */
export function TooltipTrigger<Payload = unknown>({
  ref,
  render,
  id: idProp,
  delay,
  closeDelay,
  onPointerDown,
  onPointerCancel,
  onClick,
  onFocus,
  onKeyDown,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: TooltipTriggerProps<Payload>) {
  const context = useContext(TooltipContext);
  const generatedId = useId();
  const touch = useRef(false);
  const contextRef = context?.triggerRef;
  const child = isValidElement<{
    disabled?: boolean | undefined;
    id?: string | undefined;
    "aria-disabled"?: boolean | "true" | "false";
    "aria-label"?: string | undefined;
    "aria-labelledby"?: string | undefined;
    "aria-describedby"?: string | undefined;
  }>(render)
    ? render
    : null;
  const childDisabled = !!(
    child?.props.disabled ||
    child?.props["aria-disabled"] === true ||
    child?.props["aria-disabled"] === "true"
  );
  const triggerId = idProp ?? child?.props.id ?? generatedId;
  const setTriggerDisabled = context?.setTriggerDisabled;
  useEffect(() => {
    setTriggerDisabled?.(childDisabled || !!props.disabled);
  }, [childDisabled, props.disabled, setTriggerDisabled]);
  const explicitName =
    labelledBy !== undefined ||
    props["aria-label"] !== undefined ||
    child?.props["aria-label"] !== undefined ||
    child?.props["aria-labelledby"] !== undefined;
  const labels =
    [
      labelledBy,
      child?.props["aria-labelledby"],
      !explicitName && context?.asLabel && context.hasContent && context.labelId,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const descriptions =
    [
      describedBy,
      child?.props["aria-describedby"],
      context?.open && !context.asLabel && context.contentId,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const mergedRef = useCallback(
    (element: HTMLElement | null) => {
      if (contextRef) contextRef.current = element;
      if (typeof ref === "function") {
        const cleanup = ref(element);
        if (typeof cleanup === "function")
          return () => {
            if (contextRef) contextRef.current = null;
            cleanup();
          };
      } else if (ref) ref.current = element;
    },
    [ref, contextRef],
  );
  return (
    <BaseTooltip.Trigger
      {...props}
      id={triggerId}
      disabled={props.disabled ?? (childDisabled || undefined)}
      render={
        child
          ? cloneElement(child, {
              id: triggerId,
              "aria-labelledby": labels,
              "aria-describedby": descriptions,
            })
          : render
      }
      ref={mergedRef}
      delay={delay ?? context?.delay}
      closeDelay={closeDelay ?? context?.closeDelay}
      aria-labelledby={labels}
      aria-describedby={descriptions}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || event.baseUIHandlerPrevented) {
          touch.current = false;
          return;
        }
        touch.current = event.pointerType === "touch";
        // Skip Base UI's press dismissal only; never prevent or replay the child action.
        if (touch.current && context && !event.defaultPrevented) event.preventBaseUIHandler();
      }}
      onPointerCancel={(event) => {
        touch.current = false;
        onPointerCancel?.(event);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (touch.current && context) event.preventBaseUIHandler();
      }}
      onKeyDown={(event) => {
        touch.current = false;
        onKeyDown?.(event);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.baseUIHandlerPrevented) return;
        if (touch.current && context) {
          touch.current = false;
          event.preventBaseUIHandler();
          context.toggleTouch(event);
        }
      }}
    />
  );
}

export type TooltipProviderProps = ComponentProps<typeof BaseTooltip.Provider>;
/** Share initial delay and instant subsequent tooltips across a group. */
export function TooltipProvider({
  delay = 400,
  closeDelay = 80,
  timeout = 400,
  ...props
}: TooltipProviderProps) {
  return (
    <BaseTooltip.Provider delay={delay} closeDelay={closeDelay} timeout={timeout} {...props} />
  );
}

export type TooltipContentProps = ComponentProps<typeof BaseTooltip.Popup> &
  PlacementProps & {
    arrow?: boolean | undefined;
    anchorRef?: RefObject<Element | null> | undefined;
    anchorPoint?: TooltipPoint | undefined;
    /** Keep the popup inside a theme or overlay boundary instead of document.body. */
    container?: ComponentProps<typeof BaseTooltip.Portal>["container"];
    positionerProps?: Omit<PositionerProps, "children" | keyof PlacementProps> | undefined;
  };
/** Base UI owns the pointer corridor, collision placement and popup lifecycle. */
export function TooltipContent({
  className,
  children,
  id,
  side = "top",
  align = "center",
  sideOffset = 8,
  alignOffset = 0,
  collisionPadding = 8,
  arrow = false,
  anchorRef,
  anchorPoint,
  container,
  positionerProps,
  ...props
}: TooltipContentProps) {
  const context = useContext(TooltipContext);
  const empty = isEmpty(children);
  const popupId = id ?? context?.contentId;
  const setHasContent = context?.setHasContent;
  const setContentId = context?.setContentId;
  const triggerRef = context?.triggerRef;
  useEffect(() => {
    setHasContent?.(!empty);
  }, [empty, setHasContent]);
  useEffect(() => {
    if (id) setContentId?.(id);
  }, [id, setContentId]);
  const pointX = anchorPoint?.x;
  const pointY = anchorPoint?.y;
  const positionerAnchor = positionerProps?.anchor;
  const anchor = useMemo(() => {
    if (pointX === undefined || pointY === undefined) return anchorRef ?? positionerAnchor;
    return {
      get contextElement() {
        return anchorRef?.current ?? triggerRef?.current ?? undefined;
      },
      getBoundingClientRect() {
        const element = anchorRef?.current ?? triggerRef?.current;
        const rect = element?.getBoundingClientRect();
        return new DOMRect(
          (rect?.left ?? 0) + (rect?.width ?? 0) * pointX,
          (rect?.top ?? 0) + (rect?.height ?? 0) * pointY,
          0,
          0,
        );
      },
    };
  }, [anchorRef, pointX, pointY, triggerRef, positionerAnchor]);
  if (empty) return null;
  return (
    <>
      {context?.asLabel && (
        <span id={context.labelId} hidden>
          {children}
        </span>
      )}
      <BaseTooltip.Portal container={container}>
        <BaseTooltip.Positioner
          {...positionerProps}
          className={(state) =>
            cn(
              "z-[60]",
              typeof positionerProps?.className === "function"
                ? positionerProps.className(state)
                : positionerProps?.className,
            )
          }
          anchor={anchor}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          collisionPadding={collisionPadding}
        >
          <BaseTooltip.Popup
            {...props}
            role={props.role ?? "tooltip"}
            id={popupId}
            aria-hidden={context?.asLabel || props["aria-hidden"]}
            data-slot="tooltip-content"
            className={(state) =>
              cn(
                "relative max-w-[min(20rem,var(--available-width))] origin-(--transform-origin) rounded-xl bg-secondary px-3 py-2 font-sans text-sm leading-5 text-secondary-foreground shadow-md ring-1 ring-foreground/5 [overflow-wrap:anywhere] transition-[opacity,transform,scale] duration-125 ease-out motion-safe:data-starting-style:scale-97 data-starting-style:opacity-0 motion-safe:data-ending-style:scale-97 data-ending-style:opacity-0 data-instant:transition-none motion-reduce:transform-none motion-reduce:transition-none motion-reduce:scale-100 forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:shadow-none forced-colors:ring-0",
                typeof className === "function" ? className(state) : className,
              )
            }
          >
            {children}
            {arrow && (
              <BaseTooltip.Arrow
                data-slot="tooltip-arrow"
                className="absolute size-2.5 rotate-45 rounded-[2px] bg-inherit data-[side=top]:-bottom-1 data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 forced-colors:bg-[Canvas]"
              />
            )}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </>
  );
}
