"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import {
  type ComponentProps,
  type ReactNode,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "./button.js";
import { useReducedMotion } from "./use-reduced-motion.js";
import { cn } from "./utils.js";

export type CollapsibleProps = ComponentProps<typeof BaseCollapsible.Root>;
export type CollapsibleTriggerProps = ComponentProps<typeof BaseCollapsible.Trigger>;
export type CollapsibleContentProps = ComponentProps<typeof BaseCollapsible.Panel>;
export type CollapsibleChangeEventDetails = BaseCollapsible.Root.ChangeEventDetails;

/** A disclosure whose controlled state and interaction details remain consumer-owned. */
export function Collapsible({ className, ...props }: CollapsibleProps) {
  return (
    <BaseCollapsible.Root
      data-slot="collapsible"
      {...props}
      className={(state) =>
        cn("min-w-0", typeof className === "function" ? className(state) : className)
      }
    />
  );
}

export function CollapsibleTrigger({ className, render, ...props }: CollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      data-slot="collapsible-trigger"
      {...props}
      render={
        render ?? (
          <Button
            variant="ghost"
            className="min-h-0 justify-start rounded-none border-0 bg-transparent p-0 font-[inherit] text-[inherit] leading-[inherit] shadow-none"
          />
        )
      }
      className={(state) =>
        cn(
          "inline-flex items-center disabled:pointer-events-none disabled:opacity-45 aria-disabled:opacity-45 focus-visible:outline-none focus-visible:shadow-kind-focus focus-visible:bg-accent forced-colors:focus-visible:outline forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-offset-2",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type CollapsiblePreviewContentProps = ComponentProps<"div"> & {
  /** Controlled disclosure state; the preview remains visible while closed. */
  open: boolean;
  /** Maximum height of the closed preview, in CSS pixels. */
  previewHeight: number;
  /** Classes for the single measured content wrapper. */
  contentClassName?: string | undefined;
  /** Accessible replacement while the clipped content is inert. */
  previewDescription?: ReactNode;
  /** Optional visual adornment outside the measured content, such as a fade. */
  overlay?: ReactNode;
  /** Receives focus when closing clips the currently focused descendant. */
  returnFocusRef?: RefObject<HTMLElement | null> | undefined;
};

function visiblePreviewHeight(viewport: HTMLDivElement) {
  const outer = viewport.parentElement;
  const top = outer
    ? viewport.offsetParent === outer
      ? viewport.offsetTop
      : viewport.getBoundingClientRect().top - outer.getBoundingClientRect().top - outer.clientTop
    : 0;
  const availableHeight = outer ? Math.max(0, outer.clientHeight - top) : viewport.clientHeight;
  return Math.min(viewport.clientHeight, availableHeight);
}

/** A persistent clipped preview for disclosures whose closed content must stay visible. */
export function CollapsiblePreviewContent({
  open,
  previewHeight,
  contentClassName,
  previewDescription = "Content preview. Expand to read and interact with the full content.",
  overlay,
  returnFocusRef,
  className,
  children,
  style,
  tabIndex = -1,
  onFocusCapture,
  onBlurCapture,
  ...props
}: CollapsiblePreviewContentProps) {
  const reducedMotion = useReducedMotion();
  const height = Number.isFinite(previewHeight) ? Math.max(0, previewHeight) : 0;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const openingHeight = useRef<number | null>(null);
  const closingHeight = useRef<number | null>(null);
  const latestOpen = useRef(open);
  const previousOpen = useRef(open);
  const focusWithin = useRef(false);
  const [overflows, setOverflows] = useState<boolean | null>(null);
  const clipped = !open && overflows !== false;
  const explicitMaxHeight = style?.maxHeight;
  // Keep the default cap on the original element so native dimensions, padding,
  // and borders retain their CSS semantics. Only this default is motion-owned;
  // explicit consumer dimensions are never copied to a second containing block.
  const outerMaxHeight = open ? undefined : height;
  const latestOuterCap = useRef({ owned: explicitMaxHeight === undefined, height: outerMaxHeight });
  const initialOuterMaxHeight = useRef(outerMaxHeight);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const changed = previousOpen.current !== open;
    latestOpen.current = open;
    latestOuterCap.current = { owned: explicitMaxHeight === undefined, height: outerMaxHeight };
    const currentHeight = visiblePreviewHeight(viewport);
    animationRef.current?.cancel();
    animationRef.current = null;
    openingHeight.current = null;
    closingHeight.current = null;
    const settle = () => {
      viewport.style.height = "";
      if (explicitMaxHeight === undefined && viewport.parentElement)
        viewport.parentElement.style.maxHeight =
          outerMaxHeight === undefined ? "" : `${outerMaxHeight}px`;
    };
    previousOpen.current = open;
    // Resolve available space through the original element's layout, preserving CSS units.
    settle();
    const availableHeight = visiblePreviewHeight(viewport);
    const targetHeight = availableHeight;
    setOverflows(content.scrollHeight > availableHeight);
    if (
      !changed ||
      reducedMotion ||
      !viewport.animate ||
      currentHeight === targetHeight ||
      style?.height !== undefined ||
      explicitMaxHeight !== undefined
    ) {
      settle();
      return;
    }
    if (viewport.parentElement) viewport.parentElement.style.maxHeight = "";
    viewport.style.height = `${targetHeight}px`;
    const animation = viewport.animate(
      [{ height: `${currentHeight}px` }, { height: `${targetHeight}px` }],
      { duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    animationRef.current = animation;
    openingHeight.current = open ? content.scrollHeight : null;
    closingHeight.current = open ? null : availableHeight;
    animation.onfinish = () => {
      if (animationRef.current !== animation) return;
      animationRef.current = null;
      openingHeight.current = null;
      closingHeight.current = null;
      settle();
    };
  }, [explicitMaxHeight, open, outerMaxHeight, reducedMotion, style?.height]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || !clipped) return;
    const document = content.ownerDocument;
    if (
      content.contains(document.activeElement) ||
      (focusWithin.current && document.activeElement === document.body)
    ) {
      const trigger = returnFocusRef?.current;
      if (trigger && !trigger.matches(":disabled, [aria-disabled='true']")) trigger.focus();
      else viewportRef.current?.parentElement?.focus();
    }
    focusWithin.current = false;
  }, [clipped, returnFocusRef]);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const view = element.ownerDocument.defaultView;
    let frame: number | undefined;
    const update = () => {
      const naturalHeight = element.scrollHeight;
      // A stream changes natural layout, not disclosure state. End an opening
      // transition immediately so new content remains visible without token motion.
      if (latestOpen.current && animationRef.current && openingHeight.current !== naturalHeight) {
        animationRef.current.cancel();
        animationRef.current = null;
        openingHeight.current = null;
        const viewport = viewportRef.current;
        if (viewport) {
          viewport.style.height = "";
          const cap = latestOuterCap.current;
          if (cap.owned && viewport.parentElement)
            viewport.parentElement.style.maxHeight =
              cap.height === undefined ? "" : `${cap.height}px`;
        }
      }
      const viewport = viewportRef.current;
      if (viewport)
        setOverflows(naturalHeight > (closingHeight.current ?? visiblePreviewHeight(viewport)));
    };
    const scheduleUpdate = () => {
      if (!view || frame !== undefined) return;
      frame = view.requestAnimationFrame(() => {
        frame = undefined;
        update();
      });
    };
    update();
    const resize =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleUpdate);
    resize?.observe(element);
    if (viewportRef.current) resize?.observe(viewportRef.current);
    if (viewportRef.current?.parentElement) resize?.observe(viewportRef.current.parentElement);
    const mutations =
      typeof MutationObserver === "undefined" ? null : new MutationObserver(scheduleUpdate);
    mutations?.observe(element, { childList: true, characterData: true, subtree: true });
    return () => {
      resize?.disconnect();
      mutations?.disconnect();
      if (frame !== undefined) view?.cancelAnimationFrame(frame);
    };
  }, []);

  useLayoutEffect(() => () => animationRef.current?.cancel(), []);

  return (
    <div
      data-slot="collapsible-preview-content"
      {...props}
      style={{ maxHeight: initialOuterMaxHeight.current, ...style }}
      data-open={open || undefined}
      data-clipped={clipped || undefined}
      tabIndex={tabIndex}
      className={cn("relative min-w-0 overflow-hidden", className)}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        focusWithin.current = true;
      }}
      onBlurCapture={(event) => {
        onBlurCapture?.(event);
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
          focusWithin.current = false;
      }}
    >
      <div
        ref={viewportRef}
        data-slot="collapsible-preview-viewport"
        className="min-w-0 overflow-hidden"
      >
        <div
          ref={contentRef}
          data-slot="collapsible-preview-inner"
          inert={clipped}
          className={cn("min-w-0 flow-root", contentClassName)}
        >
          {children}
        </div>
      </div>
      {clipped && <span className="sr-only">{previewDescription}</span>}
      {overlay}
    </div>
  );
}

/** Reveals content without constraining live updates or changing the panel lifecycle. */
export function CollapsibleContent({ className, ...props }: CollapsibleContentProps) {
  return (
    <BaseCollapsible.Panel
      data-slot="collapsible-content"
      {...props}
      className={(state) =>
        cn(
          "min-w-0 motion-safe:transition-[opacity,translate] motion-safe:duration-150 motion-safe:ease-kind-out motion-safe:data-[starting-style]:-translate-y-0.5 motion-safe:data-[starting-style]:opacity-0 motion-safe:data-[ending-style]:-translate-y-0.5 motion-safe:data-[ending-style]:opacity-0 motion-reduce:transition-none",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
