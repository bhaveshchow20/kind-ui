"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import type { ClassValue } from "clsx";
import { CircleAlert, Clock3, Grid2x2, Image as ImageIcon, RotateCcw, X } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { actionClass, cn, safeUrl, surfaceClass } from "./utils.js";

export type GeneratedImageState = "queued" | "generating" | "complete" | "error";
export type GeneratedImageAspectRatio = "square" | "video" | "portrait" | "auto";
export type GeneratedImageOverlayPosition = "top" | "bottom" | "both";
export type GeneratedImageActionPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type ImageContext = {
  state: GeneratedImageState;
  busy: boolean;
  retry: (() => void) | undefined;
  cancel: (() => void) | undefined;
};
const GeneratedImageContext = createContext<ImageContext | null>(null);
function useGeneratedImage() {
  const context = useContext(GeneratedImageContext);
  if (!context) throw new Error("GeneratedImage parts must be used within GeneratedImage.");
  return context;
}

export function generatedImageVariants({
  aspectRatio = "square",
  className,
  class: classes,
}: {
  aspectRatio?: GeneratedImageAspectRatio | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
} = {}): string {
  return cn(
    surfaceClass,
    "group/generated-image relative isolate grid w-full overflow-hidden rounded-xl bg-inset data-[state=error]:border-destructive/25",
    "[&_[data-slot=generated-image-content]]:size-full [&_[data-slot=generated-image-content]]:object-cover [&_[data-slot=generated-image-content]]:transition-opacity [&_[data-slot=generated-image-content]]:duration-200 motion-reduce:[&_[data-slot=generated-image-content]]:transition-none",
    "data-[state=queued]:[&_[data-slot=generated-image-content]]:invisible data-[state=queued]:[&_[data-slot=generated-image-content]]:opacity-0 data-[state=queued]:[&_[data-slot=generated-image-content]]:transition-none data-[state=generating]:[&_[data-slot=generated-image-content]]:invisible data-[state=generating]:[&_[data-slot=generated-image-content]]:opacity-0 data-[state=generating]:[&_[data-slot=generated-image-content]]:transition-none data-[state=error]:[&_[data-slot=generated-image-content]]:opacity-25",
    aspectRatio === "square" && "aspect-square",
    aspectRatio === "video" && "aspect-video",
    aspectRatio === "portrait" && "aspect-[3/4]",
    aspectRatio !== "auto" &&
      "[&_[data-slot=generated-image-content]]:absolute [&_[data-slot=generated-image-content]]:inset-0",
    aspectRatio === "auto" &&
      "min-h-40 [&_[data-slot=generated-image-content]]:col-start-1 [&_[data-slot=generated-image-content]]:row-start-1 [&_[data-slot=generated-image-content]]:block [&_[data-slot=generated-image-content]]:h-auto",
    classes,
    className,
  );
}

export type GeneratedImageProps = useRender.ComponentProps<"div"> & {
  state?: GeneratedImageState | undefined;
  aspectRatio?: GeneratedImageAspectRatio | null | undefined;
  requestId?: string | undefined;
  onRetry?: (() => void | Promise<void>) | undefined;
  onCancel?: (() => void | Promise<void>) | undefined;
  onActionError?: ((error: unknown) => void) | undefined;
};

export function GeneratedImage({
  state = "complete",
  aspectRatio = "square",
  requestId,
  onRetry,
  onCancel,
  onActionError,
  render,
  ref,
  className,
  children,
  ...props
}: GeneratedImageProps) {
  const [busy, setBusy] = useState(false);
  const [actionFailed, setActionFailed] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Invalidate at commit (including unmount), before stale promise microtasks can affect a replacement canvas.
  useLayoutEffect(() => {
    generation.current += 1;
    lock.current = false;
    setBusy(false);
    setActionFailed(false);
    return () => {
      generation.current += 1;
    };
  }, [state, requestId]);
  const request = (callback: () => void | Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    const version = generation.current;
    setBusy(true);
    setActionFailed(false);
    const settle = async () => {
      try {
        await callback();
      } catch (error: unknown) {
        if (version === generation.current) {
          setActionFailed(true);
          onActionError?.(error);
        }
      } finally {
        if (version === generation.current) {
          lock.current = false;
          setBusy(false);
        }
      }
    };
    void settle();
  };
  const element = useRender({
    render,
    ref,
    defaultTagName: "div",
    props: {
      ...props,
      role: props.role ?? "group",
      "aria-label":
        props["aria-label"] ?? (props["aria-labelledby"] ? undefined : "Generated image"),
      "aria-busy": state === "queued" || state === "generating" || busy,
      "data-slot": "generated-image",
      "data-state": state,
      "data-aspect-ratio": aspectRatio,
      className: generatedImageVariants({ aspectRatio, className }),
      children: (
        <>
          {children}
          {actionFailed ? (
            <div
              role="alert"
              className="absolute inset-x-3 bottom-16 z-30 flex items-start gap-1.5 rounded-lg border border-border/60 bg-elevated px-2.5 py-2 text-ai-description text-danger-text"
            >
              <CircleAlert
                aria-hidden="true"
                nonScalingStroke
                strokeWidth={1.5}
                size={16}
                className="mt-0.5 shrink-0"
              />
              <span>Request failed. Try again.</span>
            </div>
          ) : null}
        </>
      ),
    },
  });
  return (
    <GeneratedImageContext.Provider
      value={{
        state,
        busy,
        retry: onRetry ? () => request(onRetry) : undefined,
        cancel: onCancel ? () => request(onCancel) : undefined,
      }}
    >
      {element}
    </GeneratedImageContext.Provider>
  );
}

export type GeneratedImageHeaderProps = ComponentProps<"div">;
export function GeneratedImageHeader({ className, ...props }: GeneratedImageHeaderProps) {
  return (
    <div
      {...props}
      data-slot="generated-image-header"
      className={cn(
        "absolute inset-x-3 top-3 z-20 flex min-w-0 flex-col items-start gap-1 pe-12 text-ai-description group-data-[aspect-ratio=auto]/generated-image:relative group-data-[aspect-ratio=auto]/generated-image:inset-auto group-data-[aspect-ratio=auto]/generated-image:col-start-1 group-data-[aspect-ratio=auto]/generated-image:row-start-1 group-data-[aspect-ratio=auto]/generated-image:p-3 [&>p]:max-w-[44ch] [&>p]:text-pretty [&>p]:break-words",
        className,
      )}
    />
  );
}
export type GeneratedImageTitleProps = ComponentProps<"div">;
export function GeneratedImageTitle({ className, children, ...props }: GeneratedImageTitleProps) {
  return (
    <div
      {...props}
      data-slot="generated-image-title"
      className={cn(
        "inline-flex max-w-full items-start gap-1.5 rounded-lg bg-elevated px-2 py-1 text-ai-title font-medium text-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex size-3.5 shrink-0 text-muted-foreground group-data-[state=error]/generated-image:text-danger-text"
      >
        <ImageIcon
          aria-hidden="true"
          nonScalingStroke
          strokeWidth={1.5}
          size={14}
          className="hidden group-data-[state=complete]/generated-image:block"
        />
        <Clock3
          aria-hidden="true"
          nonScalingStroke
          strokeWidth={1.5}
          size={14}
          className="hidden group-data-[state=queued]/generated-image:block"
        />
        <Grid2x2
          aria-hidden="true"
          nonScalingStroke
          strokeWidth={1.5}
          size={14}
          className="hidden group-data-[state=generating]/generated-image:block"
        />
        <CircleAlert
          aria-hidden="true"
          nonScalingStroke
          strokeWidth={1.5}
          size={14}
          className="hidden group-data-[state=error]/generated-image:block"
        />
      </span>
      <div className="min-w-0 break-words text-pretty">{children}</div>
    </div>
  );
}

export function generatedImageOverlayVariants({
  position = "top",
  className,
  class: classes,
}: {
  position?: GeneratedImageOverlayPosition | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
} = {}): string {
  return cn(
    "pointer-events-none absolute inset-x-0 z-0 transition-opacity duration-200 group-data-[state=queued]/generated-image:invisible group-data-[state=queued]/generated-image:opacity-0 group-data-[state=queued]/generated-image:transition-none group-data-[state=generating]/generated-image:invisible group-data-[state=generating]/generated-image:opacity-0 group-data-[state=generating]/generated-image:transition-none motion-reduce:transition-none",
    position === "top" && "top-0 h-1/3 bg-linear-to-b from-black/60 to-transparent",
    position === "bottom" && "bottom-0 h-1/3 bg-linear-to-t from-black/60 to-transparent",
    position === "both" && "inset-y-0 bg-linear-to-b from-black/60 via-transparent to-black/60",
    classes,
    className,
  );
}
export type GeneratedImageOverlayProps = ComponentProps<"div"> & {
  position?: GeneratedImageOverlayPosition | null | undefined;
};
export function GeneratedImageOverlay({
  position,
  className,
  ...props
}: GeneratedImageOverlayProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      data-slot="generated-image-overlay"
      className={generatedImageOverlayVariants({ position, className })}
    />
  );
}

export function generatedImageActionVariants({
  position = "top-right",
  className,
  class: classes,
}: {
  position?: GeneratedImageActionPosition | null | undefined;
  className?: ClassValue;
  class?: ClassValue;
} = {}): string {
  return cn(
    "absolute z-20 inline-flex max-w-[calc(100%_-_1.5rem)] flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-elevated p-1 text-ai-label text-foreground [&_button]:rounded-full [&_button]:text-current [&_a]:rounded-full [&_a]:text-current [&_svg]:size-4",
    position === "top-left" && "top-3 left-3",
    position === "top-right" && "top-3 right-3",
    position === "bottom-left" && "bottom-3 left-3",
    position === "bottom-right" && "bottom-3 right-3",
    classes,
    className,
  );
}
export type GeneratedImageActionProps = ComponentProps<"div"> & {
  position?: GeneratedImageActionPosition | null | undefined;
};
export function GeneratedImageAction({ position, className, ...props }: GeneratedImageActionProps) {
  const { state } = useGeneratedImage();
  if (state === "queued" || state === "generating") return null;
  return (
    <div
      {...props}
      data-slot="generated-image-action"
      className={generatedImageActionVariants({ position, className })}
    />
  );
}

export type GeneratedImageLoadingProps = ComponentProps<"div">;
export function GeneratedImageLoading({
  className,
  children,
  ...props
}: GeneratedImageLoadingProps) {
  const { state } = useGeneratedImage();
  if (state !== "generating") return null;
  return (
    <div
      {...props}
      data-slot="generated-image-loading"
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden bg-inset p-4 opacity-0 transition-opacity duration-200 group-data-[state=generating]/generated-image:opacity-100 group-data-[state=generating]/generated-image:transition-none motion-reduce:transition-none",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-surface opacity-50 motion-safe:animate-pulse"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(var(--muted-foreground)_1px,transparent_1px)] bg-size-[20px_20px] opacity-[0.035]"
      />
      {children && (
        <div className="pointer-events-auto relative z-10 flex w-full flex-col items-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
export type GeneratedImagePlaceholderProps = ComponentProps<"div">;
export function GeneratedImagePlaceholder({ className, ...props }: GeneratedImagePlaceholderProps) {
  const { state } = useGeneratedImage();
  return state === "queued" ? (
    <div
      {...props}
      data-slot="generated-image-placeholder"
      className={cn(
        "relative z-10 col-start-1 row-start-1 flex min-h-40 min-w-0 flex-col items-center justify-center gap-2 p-4 text-center text-ai-description text-muted-foreground [overflow-wrap:anywhere]",
        className,
      )}
    />
  ) : null;
}
export type GeneratedImageProgressProps = ComponentProps<"div"> & {
  value?: number | undefined;
  max?: number | undefined;
};
export function GeneratedImageProgress({
  className,
  value,
  max = 100,
  children,
  ...props
}: GeneratedImageProgressProps) {
  const { state } = useGeneratedImage();
  if (state !== "generating") return null;
  const validMax = Number.isFinite(max) && max > 0 ? max : 100;
  const progress =
    value !== undefined && Number.isFinite(value)
      ? Math.min(validMax, Math.max(0, value))
      : undefined;
  return (
    <div
      {...props}
      data-slot="generated-image-progress"
      className={cn(
        progress === undefined
          ? "contents text-ai-description text-muted-foreground"
          : "w-full max-w-56 space-y-2 text-ai-meta text-muted-foreground tabular-nums",
        className,
      )}
    >
      {children}
      {progress !== undefined ? (
        <progress
          aria-label="Image generation progress"
          max={validMax}
          value={progress}
          className="h-1.5 w-full overflow-hidden rounded-full bg-secondary accent-primary"
        />
      ) : null}
    </div>
  );
}
export type GeneratedImageErrorProps = ComponentProps<"div">;
export function GeneratedImageError({ className, ...props }: GeneratedImageErrorProps) {
  const { state } = useGeneratedImage();
  return state === "error" ? (
    <div
      {...props}
      data-slot="generated-image-error"
      className={cn(
        "relative z-10 col-start-1 row-start-1 flex min-h-40 min-w-0 flex-col items-center justify-center gap-2 bg-surface/85 p-4 text-center text-ai-description text-danger-text group-has-[[data-slot=generated-image-header]]/generated-image:pt-16 group-has-[[data-slot=generated-image-action]]/generated-image:pb-16 [overflow-wrap:anywhere]",
        className,
      )}
    />
  ) : null;
}

/** Safe image source boundary; custom/framework images remain host-owned. */
function imageUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const clean = value.trim();
  if (/^data:image\/(?:png|jpeg|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(clean)) return clean;
  const safe = safeUrl(clean);
  return safe && !/^(?:mailto:|tel:|#)/i.test(safe) ? safe : undefined;
}
export type GeneratedImageContentProps = Omit<ComponentProps<"img">, "alt" | "srcSet"> & {
  alt: string;
};
export function GeneratedImageContent({
  src,
  alt,
  loading = "lazy",
  decoding = "async",
  referrerPolicy = "no-referrer",
  ...props
}: GeneratedImageContentProps) {
  const safe = imageUrl(src);
  return (
    <img
      {...props}
      src={safe}
      alt={alt}
      loading={loading}
      decoding={decoding}
      referrerPolicy={referrerPolicy}
      data-slot="generated-image-content"
    />
  );
}

export type GeneratedImageRetryProps = ComponentProps<typeof BaseButton>;
export function GeneratedImageRetry({
  className,
  children = "Retry",
  disabled = false,
  onClick,
  ...props
}: GeneratedImageRetryProps) {
  const { state, busy, retry } = useGeneratedImage();
  if (state !== "error") return null;
  return (
    <BaseButton
      {...props}
      render={props.render ?? <Button variant="ghost" size="sm" />}
      type="button"
      disabled={disabled || busy || !retry}
      data-slot="generated-image-retry"
      className={(primitiveState) =>
        cn(
          actionClass,
          "min-h-8 gap-1 rounded-md bg-elevated px-2.5 text-ai-label text-foreground motion-reduce:transition-none",
          typeof className === "function" ? className(primitiveState) : className,
        )
      }
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) retry?.();
      }}
    >
      {children === "Retry" ? (
        <RotateCcw
          aria-hidden="true"
          nonScalingStroke
          strokeWidth={1.5}
          size={14}
          className="shrink-0"
        />
      ) : null}
      {children}
    </BaseButton>
  );
}
export type GeneratedImageCancelProps = ComponentProps<typeof BaseButton>;
export function GeneratedImageCancel({
  className,
  children = "Cancel",
  disabled = false,
  onClick,
  ...props
}: GeneratedImageCancelProps) {
  const { state, busy, cancel } = useGeneratedImage();
  if (state !== "queued" && state !== "generating") return null;
  return (
    <BaseButton
      {...props}
      render={props.render ?? <Button variant="ghost" size="sm" />}
      type="button"
      disabled={disabled || busy || !cancel}
      data-slot="generated-image-cancel"
      className={(primitiveState) =>
        cn(
          actionClass,
          "min-h-8 gap-1 rounded-md bg-elevated px-2.5 text-ai-label text-foreground motion-reduce:transition-none",
          typeof className === "function" ? className(primitiveState) : className,
        )
      }
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) cancel?.();
      }}
    >
      {children === "Cancel" ? (
        <X aria-hidden="true" nonScalingStroke strokeWidth={1.5} size={14} className="shrink-0" />
      ) : null}
      {children}
    </BaseButton>
  );
}
