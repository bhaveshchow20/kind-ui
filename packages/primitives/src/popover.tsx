"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentPropsWithRef, RefAttributes } from "react";
import { Button } from "./button.js";
import { cn } from "./utils.js";

export type PopoverProps<Payload = unknown> = BasePopover.Root.Props<Payload>;
export const Popover = BasePopover.Root;

const triggerClass =
  "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:shadow-kind-focus disabled:pointer-events-none disabled:opacity-45 aria-disabled:opacity-45 motion-reduce:transition-none";
export type PopoverTriggerProps<Payload = unknown> = BasePopover.Trigger.Props<Payload> &
  RefAttributes<HTMLElement>;
export function PopoverTrigger<Payload = unknown>({
  className,
  render,
  ...props
}: PopoverTriggerProps<Payload>) {
  return (
    <BasePopover.Trigger
      data-slot="popover-trigger"
      {...props}
      render={render ?? <Button variant="ghost" size="sm" />}
      className={(state) =>
        cn(triggerClass, typeof className === "function" ? className(state) : className)
      }
    />
  );
}

export type PopoverPortalProps = ComponentPropsWithRef<typeof BasePopover.Portal>;
export const PopoverPortal = BasePopover.Portal;
export type PopoverPositionerProps = ComponentPropsWithRef<typeof BasePopover.Positioner>;
export function PopoverPositioner({ className, ...props }: PopoverPositionerProps) {
  return (
    <BasePopover.Positioner
      data-slot="popover-positioner"
      {...props}
      className={(state) =>
        cn("z-50", typeof className === "function" ? className(state) : className)
      }
    />
  );
}
export type PopoverPopupProps = ComponentPropsWithRef<typeof BasePopover.Popup>;
export function PopoverPopup({ className, ...props }: PopoverPopupProps) {
  return (
    <BasePopover.Popup
      data-slot="popover-popup"
      {...props}
      className={(state) =>
        cn(
          "rounded-2xl border border-border/60 bg-elevated text-foreground shadow-kind-float outline-none origin-(--transform-origin) transition-[opacity,transform,scale] duration-150 ease-out motion-safe:data-[starting-style]:scale-97 data-[starting-style]:opacity-0 motion-safe:data-[ending-style]:scale-97 data-[ending-style]:opacity-0 data-[instant]:transition-none motion-reduce:transform-none motion-reduce:scale-100 motion-reduce:transition-none",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type PopoverContentProps = PopoverPopupProps &
  Pick<
    PopoverPositionerProps,
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
  Pick<PopoverPortalProps, "container" | "keepMounted"> & {
    positionerProps?: PopoverPositionerProps;
    portalProps?: PopoverPortalProps;
  };
/** A portalled, positioned surface. Use the individual parts for custom markup. */
export function PopoverContent({
  side = "bottom",
  align = "center",
  sideOffset = 8,
  alignOffset,
  anchor,
  positionMethod,
  collisionBoundary,
  collisionPadding,
  collisionAvoidance,
  sticky,
  arrowPadding,
  disableAnchorTracking,
  container,
  keepMounted,
  positionerProps,
  portalProps,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPortal container={container} keepMounted={keepMounted} {...portalProps}>
      <PopoverPositioner
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
        <PopoverPopup data-slot="popover-content" {...props} />
      </PopoverPositioner>
    </PopoverPortal>
  );
}

export type PopoverCloseProps = ComponentPropsWithRef<typeof BasePopover.Close>;
export function PopoverClose({ className, render, ...props }: PopoverCloseProps) {
  return (
    <BasePopover.Close
      data-slot="popover-close"
      {...props}
      render={render ?? <Button variant="ghost" size="sm" />}
      className={(state) =>
        cn(triggerClass, typeof className === "function" ? className(state) : className)
      }
    />
  );
}
export type PopoverTitleProps = ComponentPropsWithRef<typeof BasePopover.Title>;
export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <BasePopover.Title
      data-slot="popover-title"
      {...props}
      className={(state) =>
        cn(
          "text-sm font-medium text-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type PopoverDescriptionProps = ComponentPropsWithRef<typeof BasePopover.Description>;
export function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      data-slot="popover-description"
      {...props}
      className={(state) =>
        cn(
          "text-sm text-muted-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
