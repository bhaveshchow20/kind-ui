"use client";

import type { Popover as BasePopover } from "@base-ui/react/popover";
import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import {
  Popover,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@kind-ui/primitives/popover";
import { useReducedMotion } from "@kind-ui/primitives/use-reduced-motion";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  type ComponentPropsWithRef,
  createContext,
  type MouseEvent,
  type Ref,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { actionClass, cn, safeUrl } from "./utils.js";

export type InlineCitationProps = ComponentPropsWithRef<"span">;
export function InlineCitation({ className, ...props }: InlineCitationProps) {
  return (
    <span
      {...props}
      data-slot="inline-citation"
      className={cn("group/citation inline", className)}
    />
  );
}
export type InlineCitationTextProps = ComponentPropsWithRef<"span">;
export function InlineCitationText({ className, ...props }: InlineCitationTextProps) {
  return (
    <span
      {...props}
      data-slot="inline-citation-text"
      className={cn(
        "rounded-sm decoration-border underline-offset-4 group-hover/citation:underline group-focus-within/citation:underline",
        className,
      )}
    />
  );
}
export type InlineCitationCardProps = BasePopover.Root.Props;
export function InlineCitationCard(props: InlineCitationCardProps) {
  return <Popover {...props} />;
}
export type InlineCitationCardTriggerProps = BasePopover.Trigger.Props & {
  ref?: Ref<HTMLElement>;
  sources?: readonly string[];
};
function sourceLabel(url: string | undefined) {
  if (!url || !safeUrl(url)) return "Source";
  try {
    return new URL(url).hostname || "Source";
  } catch {
    return "Source";
  }
}
export function InlineCitationCardTrigger({
  sources = [],
  children,
  className,
  delay = 150,
  closeDelay = 200,
  openOnHover = true,
  ...props
}: InlineCitationCardTriggerProps) {
  return (
    <PopoverTrigger
      openOnHover={openOnHover}
      delay={delay}
      closeDelay={closeDelay}
      {...props}
      data-slot="inline-citation-card-trigger"
      aria-label={
        props["aria-label"] ??
        (children === undefined && props.render === undefined
          ? sources[0] && safeUrl(sources[0])
            ? `View ${sources.length > 1 ? `${sources.length} sources` : "source"} from ${sourceLabel(sources[0])}`
            : "View citation source"
          : undefined)
      }
      className={(state) =>
        cn(
          "mx-1 inline-flex min-h-6 items-center gap-1.5 rounded-md bg-inset px-2 py-0.5 align-baseline text-ai-meta font-medium text-muted-foreground transition-colors duration-150 hover:bg-secondary/60 hover:text-foreground data-popup-open:bg-secondary/60 data-popup-open:text-foreground focus-visible:outline-none focus-visible:shadow-kind-focus motion-reduce:transition-none",
          typeof className === "function" ? className(state) : className,
        )
      }
    >
      {children ?? (
        <>
          {sourceLabel(sources[0])}
          {sources.length > 1 && (
            <span className="text-muted-foreground">+{sources.length - 1}</span>
          )}
        </>
      )}
    </PopoverTrigger>
  );
}
export type InlineCitationCardBodyProps = BasePopover.Popup.Props & {
  ref?: Ref<HTMLDivElement>;
  side?: BasePopover.Positioner.Props["side"];
  align?: BasePopover.Positioner.Props["align"];
  sideOffset?: number;
  alignOffset?: number;
  keepMounted?: boolean;
  container?: BasePopover.Portal.Props["container"];
};
export function InlineCitationCardBody({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  alignOffset = 0,
  keepMounted,
  container,
  ...props
}: InlineCitationCardBodyProps) {
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
          aria-label="Citation sources"
          {...props}
          data-slot="inline-citation-card-body"
          className={(state) =>
            cn(
              "w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border/60 bg-elevated text-foreground shadow-[0_8px_30px_rgb(0_0_0/0.10)] outline-none",
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

export type InlineCitationCarouselApi = NonNullable<UseEmblaCarouselType[1]>;
export interface InlineCitationCarouselState {
  api: InlineCitationCarouselApi | undefined;
  index: number;
  total: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  orientation: "horizontal" | "vertical";
  direction: 1 | -1;
  setIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
}
type CarouselContextValue = InlineCitationCarouselState & { viewportRef: UseEmblaCarouselType[0] };
const CarouselContext = createContext<CarouselContextValue | null>(null);
export function useInlineCitationCarousel(): InlineCitationCarouselState {
  const value = useContext(CarouselContext);
  if (!value) throw new Error("Citation navigation must be used inside InlineCitationCarousel.");
  return value;
}
export type InlineCitationCarouselProps = ComponentPropsWithRef<"div"> & {
  opts?: Parameters<typeof useEmblaCarousel>[0];
  plugins?: Parameters<typeof useEmblaCarousel>[1];
  setApi?: (api: InlineCitationCarouselApi) => void;
  orientation?: "horizontal" | "vertical";
  onIndexChange?: (index: number) => void;
};
export function InlineCitationCarousel({
  opts,
  plugins,
  setApi,
  orientation = "horizontal",
  onIndexChange,
  className,
  onKeyDown,
  children,
  ...props
}: InlineCitationCarouselProps) {
  const reducedMotion = useReducedMotion();
  const [viewportRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
      ...(reducedMotion ? { duration: 0 } : {}),
    },
    plugins,
  );
  const requestedDirection = useRef<1 | -1 | null>(null);
  const [state, setState] = useState({
    direction: 1 as 1 | -1,
    index: 0,
    total: 0,
    canScrollPrev: false,
    canScrollNext: false,
  });
  useEffect(() => {
    if (!api) return;
    setApi?.(api);
    const sync = () =>
      setState((previous) => ({
        direction: requestedDirection.current ?? previous.direction,
        index: api.selectedScrollSnap(),
        total: api.scrollSnapList().length,
        canScrollPrev: api.canScrollPrev(),
        canScrollNext: api.canScrollNext(),
      }));
    const selected = () => {
      const direction =
        requestedDirection.current ??
        (api.selectedScrollSnap() >= api.previousScrollSnap() ? 1 : -1);
      requestedDirection.current = null;
      setState((previous) => ({ ...previous, direction }));
      sync();
      onIndexChange?.(api.selectedScrollSnap());
    };
    const originalAttributes = new Map<
      HTMLElement,
      { inert: boolean; ariaHidden: string | null }
    >();
    const visibility = () => {
      const visible = api.slidesInView();
      for (const [index, slide] of api.slideNodes().entries()) {
        const inactive = visible.length
          ? !visible.includes(index)
          : index !== api.selectedScrollSnap();
        let original = originalAttributes.get(slide);
        if (!original) {
          original = { inert: slide.inert, ariaHidden: slide.getAttribute("aria-hidden") };
          originalAttributes.set(slide, original);
        }
        slide.inert = inactive || original.inert;
        if (inactive) slide.setAttribute("aria-hidden", "true");
        else if (original.ariaHidden === null) slide.removeAttribute("aria-hidden");
        else slide.setAttribute("aria-hidden", original.ariaHidden);
      }
    };
    sync();
    visibility();
    api
      .on("select", selected)
      .on("reInit", sync)
      .on("slidesInView", visibility)
      .on("reInit", visibility);
    return () => {
      api
        .off("select", selected)
        .off("reInit", sync)
        .off("slidesInView", visibility)
        .off("reInit", visibility);
      for (const [slide, original] of originalAttributes) {
        slide.inert = original.inert;
        if (original.ariaHidden === null) slide.removeAttribute("aria-hidden");
        else slide.setAttribute("aria-hidden", original.ariaHidden);
      }
    };
  }, [api, setApi, onIndexChange]);
  const value = useMemo(
    () => ({
      ...state,
      api,
      viewportRef,
      orientation,
      setIndex: (index: number) => {
        if (!api || !Number.isFinite(index) || !Number.isInteger(index)) return;
        const nextIndex = Math.max(0, Math.min(api.scrollSnapList().length - 1, index));
        if (nextIndex === api.selectedScrollSnap() || nextIndex < 0) return;
        requestedDirection.current = nextIndex > api.selectedScrollSnap() ? 1 : -1;
        api.scrollTo(nextIndex, Boolean(reducedMotion));
      },
      next: () => {
        if (!api?.canScrollNext()) return;
        requestedDirection.current = 1;
        api.scrollNext(Boolean(reducedMotion));
      },
      prev: () => {
        if (!api?.canScrollPrev()) return;
        requestedDirection.current = -1;
        api.scrollPrev(Boolean(reducedMotion));
      },
    }),
    [state, api, viewportRef, orientation, reducedMotion],
  );
  return (
    <CarouselContext value={value}>
      {/* biome-ignore lint/a11y/useSemanticElements: Preserve the public div ref contract for this named carousel. */}
      <div
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Named carousel intentionally receives orientation-aware arrow keys.
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Citation sources"
        {...props}
        data-slot="inline-citation-carousel"
        className={cn("w-full", className)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.defaultPrevented ||
            event.altKey ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey
          )
            return;
          // Never intercept navigation from text inputs, links or nested widgets.
          if (event.target !== event.currentTarget) return;
          const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
          const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
          if (event.key === prevKey) {
            event.preventDefault();
            value.prev();
          }
          if (event.key === nextKey) {
            event.preventDefault();
            value.next();
          }
        }}
      >
        {children}
      </div>
    </CarouselContext>
  );
}
export type InlineCitationCarouselContentProps = ComponentPropsWithRef<"div">;
export function InlineCitationCarouselContent({
  className,
  ...props
}: InlineCitationCarouselContentProps) {
  const context = useContext(CarouselContext);
  if (!context) throw new Error("InlineCitationCarouselContent requires InlineCitationCarousel.");
  return (
    <div ref={context.viewportRef} className="overflow-hidden">
      <div
        {...props}
        data-slot="inline-citation-carousel-content"
        className={cn(
          "flex touch-pan-y",
          context.orientation === "vertical" && "h-full flex-col touch-pan-x",
          className,
        )}
      />
    </div>
  );
}
export type InlineCitationCarouselItemProps = useRender.ComponentProps<"div">;
export function InlineCitationCarouselItem({
  ref,
  render,
  className,
  ...props
}: InlineCitationCarouselItemProps) {
  const { direction } = useInlineCitationCarousel();
  return useRender({
    defaultTagName: "div",
    render,
    ref,
    props: {
      role: "group",
      "aria-roledescription": "slide",
      ...props,
      "data-slot": "inline-citation-carousel-item",
      "data-direction": direction === 1 ? "next" : "prev",
      className: cn("min-w-0 shrink-0 grow-0 basis-full space-y-2.5 p-3", className),
    },
  });
}
export type InlineCitationCarouselHeaderProps = ComponentPropsWithRef<"div">;
export function InlineCitationCarouselHeader({
  className,
  ...props
}: InlineCitationCarouselHeaderProps) {
  return (
    <div
      {...props}
      data-slot="inline-citation-carousel-header"
      className={cn("flex items-center gap-1 border-b border-border/60 px-2 py-1", className)}
    />
  );
}
export type InlineCitationCarouselNavProps = ComponentPropsWithRef<"div">;
export function InlineCitationCarouselNav({
  className,
  hidden,
  ...props
}: InlineCitationCarouselNavProps) {
  const { total } = useInlineCitationCarousel();
  return (
    <div
      {...props}
      hidden={hidden || total <= 1}
      data-single={total <= 1 ? "" : undefined}
      data-slot="inline-citation-carousel-nav"
      className={cn("flex w-full items-center gap-1", className)}
    />
  );
}
export type InlineCitationCarouselIndexProps = ComponentPropsWithRef<"div">;
export function InlineCitationCarouselIndex({
  className,
  children,
  ...props
}: InlineCitationCarouselIndexProps) {
  const { index, total } = useInlineCitationCarousel();
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      {...props}
      data-slot="inline-citation-carousel-index"
      className={cn(
        "ms-auto px-2 text-ai-meta font-medium tabular-nums text-muted-foreground",
        className,
      )}
    >
      {children ?? `${total ? index + 1 : 0}/${total}`}
    </div>
  );
}
export type InlineCitationCarouselPrevProps = useRender.ComponentProps<"button">;
export type InlineCitationCarouselNextProps = useRender.ComponentProps<"button">;
function CitationStep({
  ref,
  render,
  className,
  children,
  onClick,
  disabled,
  direction,
  ...props
}: InlineCitationCarouselPrevProps & { direction: "prev" | "next" }) {
  const context = useInlineCitationCarousel();
  const previous = direction === "prev";
  return useRender({
    defaultTagName: "button",
    render: render ?? <Button variant="ghost" size="sm" />,
    ref,
    props: {
      type: "button",
      "aria-label": previous ? "Previous source" : "Next source",
      ...props,
      disabled: disabled || !(previous ? context.canScrollPrev : context.canScrollNext),
      "data-slot": `inline-citation-carousel-${direction}`,
      className: cn(
        actionClass,
        "size-7 min-h-7 rounded-md p-0 text-muted-foreground coarse:min-w-11 hover:bg-secondary/60 hover:text-foreground",
        className,
      ),
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) (previous ? context.prev : context.next)();
      },
      children:
        children ??
        (previous ? (
          <ChevronLeft aria-hidden="true" className="size-3.5" strokeWidth={1.5} nonScalingStroke />
        ) : (
          <ChevronRight
            aria-hidden="true"
            className="size-3.5"
            strokeWidth={1.5}
            nonScalingStroke
          />
        )),
    },
  });
}
export function InlineCitationCarouselPrev(props: InlineCitationCarouselPrevProps) {
  return <CitationStep {...props} direction="prev" />;
}
export function InlineCitationCarouselNext(props: InlineCitationCarouselNextProps) {
  return <CitationStep {...props} direction="next" />;
}

export type InlineCitationSourceProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  title?: string;
  url?: string;
  description?: string;
};
export function InlineCitationSource({
  title,
  url,
  description,
  className,
  children,
  ...props
}: InlineCitationSourceProps) {
  const href = safeUrl(url);
  return (
    <div {...props} data-slot="inline-citation-source" className={cn("space-y-1.5", className)}>
      {title && <InlineCitationTitle>{title}</InlineCitationTitle>}
      {url &&
        (href ? (
          <a
            href={href}
            title={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-ai-meta text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-kind-focus"
          >
            {url}
          </a>
        ) : (
          <p className="truncate text-ai-meta text-muted-foreground">{url}</p>
        ))}
      {description && <InlineCitationDescription>{description}</InlineCitationDescription>}
      {children}
    </div>
  );
}
export type InlineCitationQuoteProps = ComponentPropsWithRef<"blockquote">;
export function InlineCitationQuote({ className, cite, ...props }: InlineCitationQuoteProps) {
  return (
    <blockquote
      {...props}
      cite={safeUrl(cite)}
      data-slot="inline-citation-quote"
      className={cn(
        "rounded-e-xl border-s border-foreground/15 bg-inset/60 px-2.5 py-2 text-ai-description text-muted-foreground",
        className,
      )}
    />
  );
}
export type InlineCitationNameProps = ComponentPropsWithRef<"div">;
export function InlineCitationName({ className, ...props }: InlineCitationNameProps) {
  return (
    <div
      {...props}
      data-slot="inline-citation-name"
      className={cn(
        "flex items-center gap-1.5 text-ai-meta font-medium text-muted-foreground [&>img]:size-4 [&>img]:rounded-sm",
        className,
      )}
    />
  );
}
export type InlineCitationTitleProps = ComponentPropsWithRef<"div">;
export function InlineCitationTitle({ className, ...props }: InlineCitationTitleProps) {
  return (
    <div
      {...props}
      data-slot="inline-citation-title"
      className={cn("text-ai-title break-words font-medium text-foreground", className)}
    />
  );
}
export type InlineCitationDescriptionProps = ComponentPropsWithRef<"div">;
export function InlineCitationDescription({ className, ...props }: InlineCitationDescriptionProps) {
  return (
    <div
      {...props}
      data-slot="inline-citation-description"
      className={cn("break-words text-ai-description text-muted-foreground", className)}
    />
  );
}
export type InlineCitationContentProps = ComponentPropsWithRef<"div">;
export function InlineCitationContent({ className, ...props }: InlineCitationContentProps) {
  return (
    <div
      {...props}
      data-slot="inline-citation-content"
      className={cn("text-ai-body text-foreground/85 [&>*+*]:mt-2", className)}
    />
  );
}
export type InlineCitationActionProps = ComponentPropsWithRef<"div">;
export function InlineCitationAction({ className, ...props }: InlineCitationActionProps) {
  return (
    <div
      {...props}
      data-slot="inline-citation-action"
      className={cn(
        "mt-2 flex items-center gap-1.5 border-t border-border/60 pt-2 text-ai-label font-medium text-foreground",
        className,
      )}
    />
  );
}
export type InlineCitationImageProps = Omit<ComponentPropsWithRef<"img">, "alt" | "srcSet"> & {
  alt: string;
};
export function InlineCitationImage({ className, src, alt, ...props }: InlineCitationImageProps) {
  // srcSet has its own URL grammar; explicit responsive <picture> belongs to the host.
  return (
    <img
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      {...props}
      alt={alt}
      src={safeUrl(src)}
      data-slot="inline-citation-image"
      className={cn(
        "aspect-video w-full rounded-xl object-cover outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10",
        className,
      )}
    />
  );
}
