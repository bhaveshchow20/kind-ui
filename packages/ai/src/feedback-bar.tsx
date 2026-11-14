"use client";
import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import { X } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  isValidElement,
  type MouseEvent,
  type ReactNode,
  useContext,
} from "react";
import { actionClass, cn, useControllable } from "./utils.js";

const FeedbackContext = createContext<((open: boolean) => void) | null>(null);
export type FeedbackBarProps = useRender.ComponentProps<"div"> & {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
};
export function FeedbackBar({
  open,
  defaultOpen = true,
  onOpenChange,
  render,
  className,
  ...props
}: FeedbackBarProps) {
  const [visible, setVisible] = useControllable(open, defaultOpen, onOpenChange);
  const element = useRender({
    defaultTagName: "div",
    render,
    props: {
      ...props,
      "data-slot": "feedback-bar",
      className: cn(
        "kind-surface inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl bg-surface p-1.5 ps-2.5 text-ai-label text-foreground",
        className,
      ),
    },
  });
  return visible ? <FeedbackContext value={setVisible}>{element}</FeedbackContext> : null;
}
export type FeedbackBarIconProps = ComponentProps<"span">;
export function FeedbackBarIcon({ className, ...props }: FeedbackBarIconProps) {
  return (
    <span
      aria-hidden="true"
      {...props}
      data-slot="feedback-bar-icon"
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0",
        className,
      )}
    />
  );
}
export type FeedbackBarContentProps = ComponentProps<"div">;
export function FeedbackBarContent({ className, ...props }: FeedbackBarContentProps) {
  return (
    <div
      {...props}
      data-slot="feedback-bar-content"
      className={cn(
        "min-w-0 flex-[1_1_8rem] break-words py-0.5 text-ai-label font-medium [&>p+p]:mt-0.5 [&>p+p]:text-ai-description [&>p+p]:font-normal [&>p+p]:text-muted-foreground [&_small]:block [&_small]:text-ai-description [&_small]:font-normal [&_small]:text-muted-foreground",
        className,
      )}
    />
  );
}
export type FeedbackBarActionProps = ComponentProps<"div">;
export function FeedbackBarAction({ className, ...props }: FeedbackBarActionProps) {
  return (
    <div
      {...props}
      data-slot="feedback-bar-action"
      className={cn(
        "inline-flex max-w-full shrink-0 flex-wrap items-center gap-0.5 p-0.5",
        className,
      )}
    />
  );
}
export type FeedbackBarDismissProps = useRender.ComponentProps<"button">;
export function FeedbackBarDismiss({
  onClick,
  render,
  children,
  className,
  ...props
}: FeedbackBarDismissProps) {
  const setOpen = useContext(FeedbackContext);
  if (!setOpen) throw new Error("FeedbackBarDismiss requires FeedbackBar");
  const renderHasChildren =
    isValidElement<{ children?: ReactNode }>(render) && render.props.children !== undefined;
  return useRender({
    defaultTagName: "button",
    render: render ?? <Button variant="ghost" size="sm" />,
    props: {
      type: "button",
      "aria-label": "Dismiss feedback",
      ...props,
      ...(children !== undefined
        ? { children }
        : !renderHasChildren
          ? {
              children: (
                <X
                  aria-hidden="true"
                  focusable="false"
                  strokeWidth={1.5}
                  nonScalingStroke
                  className="size-3.5"
                />
              ),
            }
          : {}),
      "data-slot": "feedback-bar-dismiss",
      className: cn(
        actionClass,
        "ms-auto min-h-7 min-w-7 rounded-lg p-1.5 text-muted-foreground hover:text-foreground coarse:min-w-11",
        className,
      ),
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(false);
      },
    },
  });
}
