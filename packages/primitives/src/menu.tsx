"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentPropsWithRef, RefAttributes } from "react";
import { Button } from "./button.js";
import { cn } from "./utils.js";

export type MenuProps<Payload = unknown> = BaseMenu.Root.Props<Payload>;
export const Menu = BaseMenu.Root;

const triggerClass =
  "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:shadow-kind-focus disabled:pointer-events-none disabled:opacity-45 aria-disabled:opacity-45 motion-reduce:transition-none";
export type MenuTriggerProps<Payload = unknown> = BaseMenu.Trigger.Props<Payload> &
  RefAttributes<HTMLElement>;
export function MenuTrigger<Payload = unknown>({
  className,
  render,
  ...props
}: MenuTriggerProps<Payload>) {
  return (
    <BaseMenu.Trigger
      data-slot="menu-trigger"
      {...props}
      render={render ?? <Button variant="ghost" size="sm" />}
      className={(state) =>
        cn(triggerClass, typeof className === "function" ? className(state) : className)
      }
    />
  );
}

export type MenuPortalProps = ComponentPropsWithRef<typeof BaseMenu.Portal>;
export const MenuPortal = BaseMenu.Portal;
export type MenuPositionerProps = ComponentPropsWithRef<typeof BaseMenu.Positioner>;
export function MenuPositioner({ className, ...props }: MenuPositionerProps) {
  return (
    <BaseMenu.Positioner
      data-slot="menu-positioner"
      {...props}
      className={(state) =>
        cn("z-50", typeof className === "function" ? className(state) : className)
      }
    />
  );
}
export type MenuPopupProps = ComponentPropsWithRef<typeof BaseMenu.Popup>;
export function MenuPopup({ className, ...props }: MenuPopupProps) {
  return (
    <BaseMenu.Popup
      data-slot="menu-popup"
      {...props}
      className={(state) =>
        cn(
          "min-w-44 rounded-xl p-1 border border-border/60 bg-elevated text-foreground shadow-kind-float outline-none origin-(--transform-origin) transition-[opacity,transform,scale] duration-150 ease-out motion-safe:data-[starting-style]:scale-97 data-[starting-style]:opacity-0 motion-safe:data-[ending-style]:scale-97 data-[ending-style]:opacity-0 data-[instant]:transition-none motion-reduce:transform-none motion-reduce:scale-100 motion-reduce:transition-none",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}

export type MenuContentProps = MenuPopupProps &
  Pick<
    MenuPositionerProps,
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
  Pick<MenuPortalProps, "container" | "keepMounted"> & {
    positionerProps?: MenuPositionerProps;
    portalProps?: MenuPortalProps;
  };
/** A portalled, positioned surface. Use the individual parts for custom markup. */
export function MenuContent({
  side = "bottom",
  align = "start",
  sideOffset = 6,
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
}: MenuContentProps) {
  return (
    <MenuPortal container={container} keepMounted={keepMounted} {...portalProps}>
      <MenuPositioner
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
        <MenuPopup data-slot="menu-content" {...props} />
      </MenuPositioner>
    </MenuPortal>
  );
}

export type MenuItemProps = ComponentPropsWithRef<typeof BaseMenu.Item>;
const itemClass =
  "flex min-h-8 cursor-default items-center gap-2 rounded-lg px-2.5 py-1.5 text-start text-sm outline-none data-[highlighted]:bg-inset data-[disabled]:pointer-events-none data-[disabled]:opacity-40 pointer-coarse:min-h-11 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";
export function MenuItem({ className, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item
      data-slot="menu-item"
      {...props}
      className={(state) =>
        cn(itemClass, typeof className === "function" ? className(state) : className)
      }
    />
  );
}
export type MenuCheckboxItemProps = ComponentPropsWithRef<typeof BaseMenu.CheckboxItem>;
export function MenuCheckboxItem({ className, ...props }: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem
      data-slot="menu-checkbox-item"
      {...props}
      className={(state) =>
        cn(itemClass, typeof className === "function" ? className(state) : className)
      }
    />
  );
}
export type MenuRadioGroupProps = ComponentPropsWithRef<typeof BaseMenu.RadioGroup>;
export const MenuRadioGroup = BaseMenu.RadioGroup;
export type MenuRadioItemProps = ComponentPropsWithRef<typeof BaseMenu.RadioItem>;
export function MenuRadioItem({ className, ...props }: MenuRadioItemProps) {
  return (
    <BaseMenu.RadioItem
      data-slot="menu-radio-item"
      {...props}
      className={(state) =>
        cn(itemClass, typeof className === "function" ? className(state) : className)
      }
    />
  );
}
export type MenuCheckboxItemIndicatorProps = ComponentPropsWithRef<
  typeof BaseMenu.CheckboxItemIndicator
>;
export function MenuCheckboxItemIndicator(props: MenuCheckboxItemIndicatorProps) {
  return <BaseMenu.CheckboxItemIndicator data-slot="menu-checkbox-item-indicator" {...props} />;
}
export type MenuRadioItemIndicatorProps = ComponentPropsWithRef<typeof BaseMenu.RadioItemIndicator>;
export function MenuRadioItemIndicator(props: MenuRadioItemIndicatorProps) {
  return <BaseMenu.RadioItemIndicator data-slot="menu-radio-item-indicator" {...props} />;
}
export type MenuSeparatorProps = ComponentPropsWithRef<typeof BaseMenu.Separator>;
export function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  return (
    <BaseMenu.Separator
      data-slot="menu-separator"
      {...props}
      className={(state) =>
        cn("my-1 h-px bg-border/60", typeof className === "function" ? className(state) : className)
      }
    />
  );
}
