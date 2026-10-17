"use client";

import { Button } from "@kind-ui/primitives/button";
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  type ComboboxProps,
  ComboboxSeparator,
  ComboboxStatus,
} from "@kind-ui/primitives/combobox";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
} from "@kind-ui/primitives/dialog";
import type { ClassValue } from "clsx";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type RefObject,
  use,
  useCallback,
  useRef,
  useState,
} from "react";
import { actionClass, cn, safeUrl } from "./utils.js";

export interface ModelSelectorVariantProps {
  variant?: "default" | "plain" | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
}
/** Variant styling without requiring a class-variance-authority runtime. */
export function modelSelectorVariants({
  variant = "default",
  className,
  class: extraClass,
}: ModelSelectorVariantProps = {}) {
  return cn(
    "flex min-w-0 flex-col gap-0.5 p-1 text-foreground",
    variant === "default" && "kind-surface rounded-2xl bg-elevated",
    extraClass,
    className,
  );
}

export type ModelSelectorProps<Value> = Omit<
  ComboboxProps<Value, false>,
  "inline" | "open" | "defaultOpen" | "onOpenChange" | "modal"
> &
  Pick<ComponentProps<"div">, "className" | "ref" | "id" | "style" | "aria-label" | "aria-busy"> & {
    variant?: "default" | "plain";
  };

/** Inline, single-selection model picker. Query and selection are independent. */
export function ModelSelector<Value = string>({
  className,
  variant = "default",
  autoHighlight = true,
  ref,
  id,
  style,
  "aria-label": label,
  "aria-busy": busy,
  children,
  ...props
}: ModelSelectorProps<Value>) {
  return (
    <Combobox<Value> {...props} id={id} inline open autoHighlight={autoHighlight}>
      {/* biome-ignore lint/a11y/useSemanticElements: Preserve the public div ref contract for this named control group. */}
      <div
        ref={ref}
        style={style}
        role="group"
        aria-label={label}
        aria-busy={busy}
        data-slot="model-selector"
        data-variant={variant}
        className={modelSelectorVariants({
          variant,
          ...(className === undefined ? {} : { className }),
        })}
      >
        {children}
      </div>
    </Combobox>
  );
}

const ModelSelectorDialogContext = createContext<RefObject<HTMLElement | null> | null>(null);

export type ModelSelectorDialogProps = DialogProps;
/** Optional modal owner. Compose Content > ModelSelector inside it. */
export function ModelSelectorDialog(props: ModelSelectorDialogProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  return (
    <ModelSelectorDialogContext value={triggerRef}>
      <Dialog {...props} />
    </ModelSelectorDialogContext>
  );
}

export type ModelSelectorTriggerProps = ComponentProps<typeof DialogTrigger>;
export function ModelSelectorTrigger({
  className,
  children,
  render,
  ref,
  ...props
}: ModelSelectorTriggerProps) {
  const triggerRef = use(ModelSelectorDialogContext);
  const attach = useCallback(
    (node: HTMLButtonElement | null) => {
      if (triggerRef) triggerRef.current = node;
      const cleanup = typeof ref === "function" ? ref(node) : undefined;
      if (ref && typeof ref !== "function") ref.current = node;
      if (!node) return;
      return () => {
        if (triggerRef) triggerRef.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref, triggerRef],
  );
  return (
    <DialogTrigger
      ref={attach}
      data-slot="model-selector-trigger"
      render={render ?? <Button variant="ghost" size="sm" />}
      className={(state) =>
        cn(
          actionClass,
          "min-h-9 max-w-full gap-1.5 rounded-[10px] border border-border/60 bg-surface px-2.5 text-ai-label font-medium hover:bg-secondary/50 [&_[data-slot=model-selector-item-text]]:flex-initial",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden="true"
        focusable="false"
        nonScalingStroke
        strokeWidth={1.5}
        className="ms-0.5 size-3.5 shrink-0 text-muted-foreground"
      />
    </DialogTrigger>
  );
}

export type ModelSelectorContentProps = Omit<ComponentProps<typeof DialogPopup>, "title"> & {
  title?: ReactNode;
  description?: ReactNode;
  showClose?: boolean;
  portalProps?: ComponentProps<typeof DialogPortal>;
};
export function ModelSelectorContent({
  title = "Model selector",
  description,
  showClose = true,
  portalProps,
  className,
  children,
  ...props
}: ModelSelectorContentProps) {
  const triggerRef = use(ModelSelectorDialogContext);
  return (
    <DialogPortal themeSource={triggerRef} {...portalProps}>
      <DialogBackdrop className="fixed inset-0 z-50 bg-foreground/15 backdrop-blur-sm transition-opacity duration-180 ease-kind-out data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-120" />
      <DialogPopup
        data-slot="model-selector-content"
        className={(state) =>
          cn(
            "fixed start-auto left-1/2 top-[18vh] z-50 block max-h-[75dvh] w-[min(30rem,calc(100vw-2rem))] max-w-none -translate-x-1/2 translate-y-0 gap-0 rtl:-translate-x-1/2 motion-safe:data-[starting-style]:scale-100 motion-safe:data-[ending-style]:scale-100 overflow-y-auto rounded-2xl border border-transparent bg-elevated p-1 text-foreground shadow-kind-float outline-none transition-[opacity,translate] duration-180 ease-kind-out data-starting-style:translate-y-1 data-starting-style:opacity-0 data-ending-style:translate-y-1 data-ending-style:opacity-0 data-ending-style:duration-120 motion-reduce:transition-opacity motion-reduce:data-starting-style:translate-y-0 motion-reduce:data-ending-style:translate-y-0",
            typeof className === "function" ? className(state) : className,
          )
        }
        {...props}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {description != null && (
          <DialogDescription className="sr-only">{description}</DialogDescription>
        )}
        {children}
        {showClose && (
          <DialogClose
            render={<Button variant="ghost" size="sm" />}
            className={cn(
              actionClass,
              "mt-1 w-full rounded-[10px] border-t border-transparent text-ai-description font-medium text-muted-foreground hover:bg-secondary/40",
            )}
            aria-label="Close model selector"
          >
            Close
          </DialogClose>
        )}
      </DialogPopup>
    </DialogPortal>
  );
}

export type ModelSelectorInputProps = ComponentProps<typeof ComboboxInput>;
export function ModelSelectorInput({
  className,
  "aria-label": label = "Search models",
  placeholder = "Search models…",
  ...props
}: ModelSelectorInputProps) {
  return (
    <div data-slot="model-selector-search" className="relative min-w-0">
      <Search
        aria-hidden="true"
        focusable="false"
        nonScalingStroke
        strokeWidth={1.5}
        className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <ComboboxInput
        data-slot="model-selector-input"
        aria-label={label}
        placeholder={placeholder}
        className={(state) =>
          cn(
            "h-9 w-full rounded-md border-0 bg-transparent pe-2.5 ps-8 text-ai-prose text-foreground outline-none placeholder:text-placeholder placeholder:text-ai-label disabled:opacity-50 pointer-coarse:min-h-11 sm:text-ai-label focus-visible:outline-none focus-visible:shadow-kind-focus",
            typeof className === "function" ? className(state) : className,
          )
        }
        {...props}
      />
    </div>
  );
}

export type ModelSelectorListProps<Value = string> = Omit<
  ComponentProps<typeof ComboboxList>,
  "children"
> & {
  children?: ReactNode | ((item: Value, index: number) => ReactNode);
};
export function ModelSelectorList<Value = string>({
  className,
  ...props
}: ModelSelectorListProps<Value>) {
  return (
    <ComboboxList
      data-slot="model-selector-list"
      aria-label="Models"
      className={(state) =>
        cn(
          "max-h-80 scroll-py-1 overflow-y-auto overscroll-contain p-0.5 outline-none empty:p-0 [scrollbar-width:thin]",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

export type ModelSelectorEmptyProps = ComponentProps<typeof ComboboxEmpty>;
export function ModelSelectorEmpty({
  className,
  children = "No models found.",
  ...props
}: ModelSelectorEmptyProps) {
  return (
    <ComboboxEmpty
      data-slot="model-selector-empty"
      className={(state) =>
        cn(
          "px-4 py-6 text-center text-ai-label text-muted-foreground empty:p-0",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    >
      {children}
    </ComboboxEmpty>
  );
}

export type ModelSelectorGroupProps = ComponentProps<typeof ComboboxGroup> & {
  heading?: ReactNode;
};
export function ModelSelectorGroup({ heading, children, ...props }: ModelSelectorGroupProps) {
  return (
    <ComboboxGroup data-slot="model-selector-group" {...props}>
      {heading != null && <ModelSelectorGroupLabel>{heading}</ModelSelectorGroupLabel>}
      {children}
    </ComboboxGroup>
  );
}

export type ModelSelectorGroupLabelProps = ComponentProps<typeof ComboboxGroupLabel>;
export function ModelSelectorGroupLabel({ className, ...props }: ModelSelectorGroupLabelProps) {
  return (
    <ComboboxGroupLabel
      data-slot="model-selector-group-label"
      className={(state) =>
        cn(
          "px-2 pb-1 pt-2 text-ai-meta font-medium text-muted-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

export type ModelSelectorCollectionProps<Value = string> = {
  children: (item: Value, index: number) => ReactNode;
};
export function ModelSelectorCollection<Value = string>(
  props: ModelSelectorCollectionProps<Value>,
) {
  return <ComboboxCollection {...props} />;
}

export type ModelSelectorItemProps<Value = string> = Omit<
  ComponentProps<typeof ComboboxItem>,
  "value" | "onSelect"
> & {
  value: Value;
  /** Selection event for both keyboard and pointer activation. */
  onSelect?: (value: Value) => void;
};
export function ModelSelectorItem<Value = string>({
  className,
  onClick,
  onSelect,
  value,
  ...props
}: ModelSelectorItemProps<Value>) {
  return (
    <ComboboxItem
      data-slot="model-selector-item"
      value={value}
      className={(state) =>
        cn(
          "flex min-h-9 cursor-default select-none items-center gap-2 rounded-lg px-2 py-1 text-ai-label text-foreground outline-none data-highlighted:bg-secondary/60 data-selected:bg-secondary/60 data-selected:font-medium [&[data-selected][data-highlighted]]:bg-secondary data-disabled:pointer-events-none data-disabled:opacity-45 pointer-coarse:min-h-11",
          typeof className === "function" ? className(state) : className,
        )
      }
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !event.baseUIHandlerPrevented) onSelect?.(value);
      }}
      {...props}
    />
  );
}

export type ModelSelectorSeparatorProps = ComponentProps<typeof ComboboxSeparator>;
export function ModelSelectorSeparator({ className, ...props }: ModelSelectorSeparatorProps) {
  return (
    <ComboboxSeparator
      data-slot="model-selector-separator"
      className={(state) =>
        cn(
          "mx-2 my-1.5 h-px bg-border/50",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

export type ModelSelectorStatusProps = ComponentProps<typeof ComboboxStatus>;
/** Host-owned loading, partial results, or failure message; never invents availability. */
export function ModelSelectorStatus({ className, ...props }: ModelSelectorStatusProps) {
  return (
    <ComboboxStatus
      data-slot="model-selector-status"
      className={(state) =>
        cn(
          "px-3 py-2 text-ai-description text-muted-foreground empty:p-0",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

export type ModelSelectorItemIndicatorProps = ComponentProps<typeof ComboboxItemIndicator>;
export function ModelSelectorItemIndicator({
  className,
  children = (
    <Check
      aria-hidden="true"
      focusable="false"
      nonScalingStroke
      strokeWidth={1.5}
      className="size-4"
    />
  ),
  ...props
}: ModelSelectorItemIndicatorProps) {
  return (
    <ComboboxItemIndicator
      data-slot="model-selector-item-indicator"
      aria-hidden="true"
      className={(state) =>
        cn(
          "ms-auto inline-flex size-5 shrink-0 items-center justify-center text-foreground",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    >
      {children}
    </ComboboxItemIndicator>
  );
}

export type ModelSelectorItemIconProps = ComponentProps<"span">;
export function ModelSelectorItemIcon({ className, ...props }: ModelSelectorItemIconProps) {
  return (
    <span
      data-slot="model-selector-item-icon"
      aria-hidden="true"
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-4 [&>img]:size-4",
        className,
      )}
      {...props}
    />
  );
}
export type ModelSelectorItemTextProps = ComponentProps<"span">;
export function ModelSelectorItemText({ className, ...props }: ModelSelectorItemTextProps) {
  return (
    <span
      data-slot="model-selector-item-text"
      className={cn("min-w-0 flex-1 truncate text-start text-ai-label font-medium", className)}
      {...props}
    />
  );
}
export type ModelSelectorNameProps = ModelSelectorItemTextProps;
export const ModelSelectorName = ModelSelectorItemText;

export type ModelSelectorItemMetaProps = ComponentProps<"span">;
export function ModelSelectorItemMeta({ className, ...props }: ModelSelectorItemMetaProps) {
  return (
    <span
      data-slot="model-selector-item-meta"
      className={cn(
        "ms-auto shrink-0 text-ai-description tabular-nums text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
export type ModelSelectorShortcutProps = ComponentProps<"kbd">;
/** Visual hint only; the host registers actual application shortcuts. */
export function ModelSelectorShortcut({ className, ...props }: ModelSelectorShortcutProps) {
  return (
    <kbd
      data-slot="model-selector-shortcut"
      className={cn(
        "ms-auto shrink-0 rounded-md border border-border/60 bg-surface px-1.5 py-0.5 font-mono text-ai-meta font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export type ModelSelectorLogoProps = Omit<ComponentProps<"img">, "src" | "alt"> & {
  provider: string;
  /** Explicit asset source. Kind never fetches a provider logo implicitly. */
  src?: string;
  alt?: string;
};
export function ModelSelectorLogo({
  provider,
  src,
  alt,
  className,
  width = 16,
  height = 16,
  onError,
  ...props
}: ModelSelectorLogoProps) {
  const url = safeUrl(src);
  const [failedUrl, setFailedUrl] = useState<string>();
  const fallback = !url || failedUrl === url;
  const initial =
    provider
      .trim()
      .match(/[a-z0-9]/i)?.[0]
      ?.toUpperCase() ?? "?";
  // A neutral monogram keeps the icon slot stable without inventing a brand mark
  // or requesting an asset from an implicit remote source.
  const monogram = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#777780"/><text x="12" y="16.5" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="white">${initial}</text></svg>`)}`;
  return (
    <img
      data-slot="model-selector-logo"
      data-fallback={fallback || undefined}
      alt={alt ?? (fallback ? provider || "Unknown provider" : `${provider} logo`)}
      src={fallback ? monogram : url}
      width={width}
      height={height}
      className={cn("size-4 shrink-0 object-contain", className)}
      {...props}
      onError={(event) => {
        onError?.(event);
        if (!event.defaultPrevented && !fallback) setFailedUrl(url);
      }}
    />
  );
}
export type ModelSelectorLogoGroupProps = ComponentProps<"div">;
export function ModelSelectorLogoGroup({ className, ...props }: ModelSelectorLogoGroupProps) {
  return (
    <div
      data-slot="model-selector-logo-group"
      className={cn(
        "flex shrink-0 items-center -space-x-1 [&>img]:rounded-full [&>img]:bg-background [&>img]:ring-1 [&>img]:ring-border/60",
        className,
      )}
      {...props}
    />
  );
}
