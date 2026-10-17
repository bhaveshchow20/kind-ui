"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentPropsWithRef, CSSProperties, Ref, RefAttributes, RefObject } from "react";
import { useCallback, useLayoutEffect, useState } from "react";
import { Button } from "./button.js";
import { cn } from "./utils.js";

export type DialogProps<Payload = unknown> = BaseDialog.Root.Props<Payload>;
export const Dialog = BaseDialog.Root;

export type DialogTriggerProps<Payload = unknown> = BaseDialog.Trigger.Props<Payload> &
  RefAttributes<HTMLElement>;
export function DialogTrigger<Payload = unknown>({
  render,
  ...props
}: DialogTriggerProps<Payload>) {
  return (
    <BaseDialog.Trigger
      data-slot="dialog-trigger"
      {...props}
      render={render ?? <Button variant="outline" size="sm" />}
    />
  );
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") return ref(value);
  if (ref) ref.current = value;
}
export type DialogPortalProps = ComponentPropsWithRef<typeof BaseDialog.Portal> & {
  /** Inherit a local host's theme when the portal renders outside that host. */
  themeSource?: RefObject<HTMLElement | null> | HTMLElement | null | undefined;
};
export function DialogPortal({ themeSource, ref, style, className, ...props }: DialogPortalProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      setElement(node);
      const cleanup = setRef(ref, node);
      if (!node) return;
      return () => {
        setElement(null);
        if (typeof cleanup === "function") cleanup();
        else setRef(ref, null);
      };
    },
    [ref],
  );
  const [theme, setTheme] = useState<{ style: CSSProperties; dark: boolean }>({
    style: {},
    dark: false,
  });
  useLayoutEffect(() => {
    const source = themeSource && ("current" in themeSource ? themeSource.current : themeSource);
    if (!element || !source) {
      setTheme({ style: {}, dark: false });
      return;
    }
    function inheritTheme() {
      if (!source) return;
      const computed = getComputedStyle(source);
      const inherited: CSSProperties & Record<`--${string}`, string> = {
        colorScheme: computed.colorScheme,
        fontFamily: computed.fontFamily,
      };
      for (const property of computed) {
        if (property.startsWith("--")) {
          inherited[property as `--${string}`] = computed.getPropertyValue(property);
        }
      }
      setTheme({ style: inherited, dark: !!source.closest(".dark") });
    }
    inheritTheme();
    const observer = new MutationObserver(inheritTheme);
    for (let ancestor: HTMLElement | null = source; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme"],
      });
    }
    return () => observer.disconnect();
  }, [element, themeSource]);
  return (
    <BaseDialog.Portal
      data-slot="dialog-portal"
      {...props}
      ref={attach}
      // Inheritance is a default. Native render props retain their own merge priority.
      style={(state) => ({
        ...theme.style,
        ...(typeof style === "function" ? style(state) : style),
      })}
      className={(state) =>
        cn(theme.dark && "dark", typeof className === "function" ? className(state) : className)
      }
    />
  );
}

export type DialogBackdropProps = ComponentPropsWithRef<typeof BaseDialog.Backdrop>;
export function DialogBackdrop({ className, ...props }: DialogBackdropProps) {
  return (
    <BaseDialog.Backdrop
      data-slot="dialog-backdrop"
      {...props}
      className={(state) =>
        cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type DialogPopupProps = ComponentPropsWithRef<typeof BaseDialog.Popup>;
export function DialogPopup({ className, ...props }: DialogPopupProps) {
  return (
    <BaseDialog.Popup
      data-slot="dialog-popup"
      {...props}
      className={(state) =>
        cn(
          "fixed start-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-border/60 bg-elevated p-6 text-foreground shadow-kind-float outline-none transition-[opacity,scale] duration-150 ease-out motion-safe:data-[starting-style]:scale-97 data-[starting-style]:opacity-0 motion-safe:data-[ending-style]:scale-97 data-[ending-style]:opacity-0 motion-reduce:scale-100 motion-reduce:transition-none rtl:translate-x-1/2",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type DialogTitleProps = ComponentPropsWithRef<typeof BaseDialog.Title>;
export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      {...props}
      className={(state) =>
        cn("text-base font-medium", typeof className === "function" ? className(state) : className)
      }
    />
  );
}
export type DialogDescriptionProps = ComponentPropsWithRef<typeof BaseDialog.Description>;
export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <BaseDialog.Description
      data-slot="dialog-description"
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
export type DialogCloseProps = ComponentPropsWithRef<typeof BaseDialog.Close>;
export function DialogClose({ render, ...props }: DialogCloseProps) {
  return (
    <BaseDialog.Close
      data-slot="dialog-close"
      {...props}
      render={render ?? <Button variant="ghost" size="sm" />}
    />
  );
}

export type DialogContentProps = DialogPopupProps &
  Pick<DialogPortalProps, "container" | "keepMounted" | "themeSource"> & {
    portalProps?: DialogPortalProps | undefined;
    backdropProps?: DialogBackdropProps | undefined;
  };
/** A portalled modal surface. Compose the individual parts for a custom layout. */
export function DialogContent({
  container,
  keepMounted,
  themeSource,
  portalProps,
  backdropProps,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal
      container={container}
      keepMounted={keepMounted}
      themeSource={themeSource}
      {...portalProps}
    >
      <DialogBackdrop {...backdropProps} />
      <DialogPopup data-slot="dialog-content" {...props} />
    </DialogPortal>
  );
}
