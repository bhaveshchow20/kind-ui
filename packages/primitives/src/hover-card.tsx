"use client";

import { PreviewCard as BaseHoverCard } from "@base-ui/react/preview-card";
import {
  type ComponentPropsWithRef,
  createContext,
  type ReactNode,
  type RefAttributes,
  useContext,
} from "react";
import { cn } from "./utils.js";

const HoverDelayContext = createContext({ openDelay: 600, closeDelay: 300 });
export type HoverCardProps<Payload = unknown> = BaseHoverCard.Root.Props<Payload> & {
  openDelay?: number | undefined;
  closeDelay?: number | undefined;
};
/** Supplementary link previews; keep their information available at the link destination. */
export function HoverCard<Payload = unknown>({
  openDelay = 600,
  closeDelay = 300,
  children,
  ...props
}: HoverCardProps<Payload>) {
  const wrap = (content: ReactNode) => (
    <HoverDelayContext value={{ openDelay, closeDelay }}>{content}</HoverDelayContext>
  );
  return (
    <BaseHoverCard.Root {...props}>
      {typeof children === "function" ? (payload) => wrap(children(payload)) : wrap(children)}
    </BaseHoverCard.Root>
  );
}

export type HoverCardTriggerProps<Payload = unknown> = BaseHoverCard.Trigger.Props<Payload> &
  RefAttributes<HTMLElement>;
/** Uses the native anchor, focus and pointer preview behavior. */
export function HoverCardTrigger<Payload = unknown>({
  delay,
  closeDelay,
  className,
  ...props
}: HoverCardTriggerProps<Payload>) {
  const defaults = useContext(HoverDelayContext);
  return (
    <BaseHoverCard.Trigger
      data-slot="hover-card-trigger"
      delay={delay ?? defaults.openDelay}
      closeDelay={closeDelay ?? defaults.closeDelay}
      {...props}
      className={(state) =>
        cn(
          "rounded-sm focus-visible:outline-none focus-visible:shadow-kind-focus",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type HoverCardPortalProps = ComponentPropsWithRef<typeof BaseHoverCard.Portal>;
export const HoverCardPortal = BaseHoverCard.Portal;
export type HoverCardPositionerProps = ComponentPropsWithRef<typeof BaseHoverCard.Positioner>;
export function HoverCardPositioner({ className, ...props }: HoverCardPositionerProps) {
  return (
    <BaseHoverCard.Positioner
      data-slot="hover-card-positioner"
      {...props}
      className={(state) =>
        cn("z-50", typeof className === "function" ? className(state) : className)
      }
    />
  );
}
export type HoverCardPopupProps = ComponentPropsWithRef<typeof BaseHoverCard.Popup>;
export function HoverCardPopup({ className, ...props }: HoverCardPopupProps) {
  return (
    <BaseHoverCard.Popup
      data-slot="hover-card-popup"
      {...props}
      className={(state) =>
        cn(
          "max-w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-elevated p-4 text-sm text-foreground shadow-kind-float outline-none origin-(--transform-origin) transition-[opacity,transform,scale] duration-150 ease-out motion-safe:data-[starting-style]:scale-97 data-[starting-style]:opacity-0 motion-safe:data-[ending-style]:scale-97 data-[ending-style]:opacity-0 data-[instant]:transition-none motion-reduce:transform-none motion-reduce:scale-100 motion-reduce:transition-none",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type HoverCardContentProps = HoverCardPopupProps &
  Pick<
    HoverCardPositionerProps,
    | "side"
    | "align"
    | "sideOffset"
    | "alignOffset"
    | "anchor"
    | "positionMethod"
    | "collisionBoundary"
    | "collisionPadding"
    | "collisionAvoidance"
    | "sticky"
    | "arrowPadding"
    | "disableAnchorTracking"
  > &
  Pick<HoverCardPortalProps, "container" | "keepMounted"> & {
    positionerProps?: HoverCardPositionerProps | undefined;
    portalProps?: HoverCardPortalProps | undefined;
  };
/** Use container for a local theme boundary; individual parts allow custom markup. */
export function HoverCardContent({
  side = "bottom",
  align = "center",
  sideOffset = 8,
  alignOffset,
  anchor,
  positionMethod,
  collisionBoundary,
  collisionPadding = 8,
  collisionAvoidance,
  sticky,
  arrowPadding,
  disableAnchorTracking,
  container,
  keepMounted,
  positionerProps,
  portalProps,
  ...props
}: HoverCardContentProps) {
  return (
    <HoverCardPortal container={container} keepMounted={keepMounted} {...portalProps}>
      <HoverCardPositioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        anchor={anchor}
        positionMethod={positionMethod}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
        collisionAvoidance={collisionAvoidance}
        sticky={sticky}
        arrowPadding={arrowPadding}
        disableAnchorTracking={disableAnchorTracking}
        {...positionerProps}
      >
        <HoverCardPopup data-slot="hover-card-content" {...props} />
      </HoverCardPositioner>
    </HoverCardPortal>
  );
}
