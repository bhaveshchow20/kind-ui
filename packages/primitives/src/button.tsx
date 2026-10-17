"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import type { ComponentProps, Key, ReactNode, Ref } from "react";
import { useReducedMotion } from "./use-reduced-motion.js";
import { cn } from "./utils.js";

const variants = {
  default:
    "border-transparent bg-primary focus-visible:bg-primary-hover text-primary-foreground shadow-[var(--kind-action-shadow)] not-data-disabled:hover:bg-primary-hover not-data-disabled:active:bg-primary-pressed",
  secondary:
    "border-transparent bg-secondary focus-visible:bg-secondary-hover text-secondary-foreground not-data-disabled:hover:bg-secondary-hover not-data-disabled:active:bg-secondary-pressed",
  outline:
    "border-border bg-transparent focus-visible:bg-accent text-foreground not-data-disabled:hover:bg-secondary not-data-disabled:active:bg-secondary-pressed",
  link: "border-transparent bg-transparent focus-visible:bg-accent text-link underline-offset-4 not-data-disabled:hover:underline",
  ghost:
    "border-transparent focus-visible:bg-accent text-foreground not-data-disabled:hover:bg-secondary not-data-disabled:active:bg-secondary-pressed",
  destructive:
    "border-transparent bg-destructive focus-visible:bg-destructive-hover text-destructive-foreground not-data-disabled:hover:bg-destructive-hover not-data-disabled:active:bg-destructive-pressed",
};

const sizes = {
  sm: "min-h-9 gap-1.5 rounded-[var(--kind-compact-radius)] px-3.5 py-1.5 text-sm leading-5 coarse:min-h-11 [&_svg]:size-4",
  md: "min-h-[var(--kind-control-height)] gap-2 px-5 py-2.5",
  lg: "min-h-12 gap-2.5 px-6 py-3",
  "icon-sm": "size-9 p-0 coarse:size-11",
  "icon-md": "size-[var(--kind-control-height)] p-0",
  "icon-lg": "size-12 p-0",
};

type ButtonStyleProps = {
  variant?: keyof typeof variants | undefined;
  size?: keyof typeof sizes | undefined;
};

export type ButtonProps = Omit<ComponentProps<typeof BaseButton>, "focusableWhenDisabled"> &
  ButtonStyleProps & {
    /** Crossfade complex children when this changes. Text changes animate automatically. */
    contentKey?: Key | undefined;
    /** Styled count badge. Zero is displayed; omit to hide. */
    count?: number | undefined;
    /** Visual keyboard hint. The consumer registers the shortcut. */
    shortcut?: string | undefined;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
    /** Prevents activation; shows a circle, or a pill with loadingText. */
    loading?: boolean | undefined;
    /** Optional visible label beside the spinner while loading. */
    loadingText?: string | undefined;
  };

/** Visual recipe for semantic links; Base UI Button retains action semantics. */
export function buttonVariants({ variant = "default", size = "md" }: ButtonStyleProps = {}) {
  return cn(
    "relative inline-flex max-w-full min-w-0 shrink-0 touch-manipulation select-none items-center justify-center rounded-[var(--kind-action-radius)] border font-sans text-center text-[length:var(--kind-body-size)] leading-[var(--kind-body-leading)] font-medium [overflow-wrap:anywhere] transition-[background-color,box-shadow,filter] duration-[var(--kind-feedback-duration)] ease-out focus-visible:outline-none focus-visible:shadow-kind-focus forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight] forced-colors:focus-visible:outline-offset-3 data-disabled:cursor-not-allowed data-disabled:not-aria-busy:opacity-45 aria-invalid:border-destructive aria-invalid:outline-destructive motion-reduce:transition-none forced-colors:border-[ButtonText] forced-colors:shadow-none [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
    variants[variant],
    sizes[size],
  );
}

const layoutTransition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const };

type NativeButtonRendererProps = Omit<
  ComponentProps<"button">,
  "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
> & {
  nativeOnAnimationStart?: ComponentProps<"button">["onAnimationStart"];
  nativeOnDrag?: ComponentProps<"button">["onDrag"];
  nativeOnDragStart?: ComponentProps<"button">["onDragStart"];
  nativeOnDragEnd?: ComponentProps<"button">["onDragEnd"];
};

// Keep native event handlers separate from animation and gesture callbacks.
function NativeButtonRenderer({
  nativeOnAnimationStart,
  nativeOnDrag,
  nativeOnDragStart,
  nativeOnDragEnd,
  ...props
}: NativeButtonRendererProps) {
  return (
    <button
      {...props}
      onAnimationStart={nativeOnAnimationStart}
      onDrag={nativeOnDrag}
      onDragStart={nativeOnDragStart}
      onDragEnd={nativeOnDragEnd}
    />
  );
}

const MotionButtonRenderer = motion.create(NativeButtonRenderer);

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-slot="button-spinner"
      className="motion-safe:animate-spin"
    >
      <circle cx="12" cy="12" r="8" strokeDasharray="35 15" />
    </svg>
  );
}

function ButtonContent({
  ref,
  children,
  reducedMotion,
  className,
}: {
  ref?: Ref<HTMLSpanElement> | undefined;
  children: ReactNode;
  reducedMotion: boolean | null;
  className?: string | undefined;
}) {
  const present = useIsPresent();
  return (
    <motion.span
      ref={ref}
      data-slot="button-content"
      layout={reducedMotion ? false : "size"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.12, layout: layoutTransition }}
      aria-hidden={!present || undefined}
      className={cn(
        "inline-flex w-full min-w-0 [align-items:inherit] [justify-content:inherit] [flex-wrap:inherit] [flex-direction:inherit] gap-[inherit] motion-reduce:transform-none!",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}

export function Button({
  className,
  variant = "default",
  size = "md",
  children,
  count,
  shortcut,
  leadingIcon,
  trailingIcon,
  loading = false,
  loadingText,
  contentKey,
  render,
  disabled,
  onAnimationStart,
  onDrag,
  onDragStart,
  onDragEnd,
  ...props
}: ButtonProps) {
  const reducedMotion = useReducedMotion();
  const pending = loading;
  const labelKey =
    contentKey ??
    (typeof children === "string" || typeof children === "number" ? children : "content");
  const iconOnly = size.startsWith("icon");
  const showLoadingText = pending && !!loadingText && !iconOnly;
  const spinnerOnly = pending && !showLoadingText;
  const circleSize =
    size === "sm" || size === "icon-sm"
      ? "icon-sm"
      : size === "lg" || size === "icon-lg"
        ? "icon-lg"
        : "icon-md";
  const idleContent = (
    <>
      {leadingIcon && (
        <span data-slot="button-leading-icon" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      {children}
      {trailingIcon && (
        <span data-slot="button-trailing-icon" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
      {count !== undefined && (
        <span
          data-slot="button-count"
          className={cn(
            "inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-foreground/10 px-1.5 text-xs leading-5 tabular-nums",
            size.startsWith("icon") &&
              "absolute -end-1 -top-1 bg-foreground text-background ring-2 ring-background",
          )}
        >
          {count}
        </span>
      )}
      {shortcut && (
        <kbd
          data-slot="button-shortcut"
          className="shrink-0 rounded bg-foreground/10 px-1.5 font-sans text-xs leading-5"
        >
          {shortcut}
        </kbd>
      )}
    </>
  );
  return (
    <BaseButton
      data-slot="button"
      data-variant={variant}
      data-size={size}
      {...props}
      onAnimationStart={render ? onAnimationStart : undefined}
      onDrag={render ? onDrag : undefined}
      onDragStart={render ? onDragStart : undefined}
      onDragEnd={render ? onDragEnd : undefined}
      data-loading={pending || undefined}
      disabled={disabled || pending}
      focusableWhenDisabled={pending}
      aria-busy={pending || props["aria-busy"]}
      render={
        render ?? (
          <MotionButtonRenderer
            nativeOnAnimationStart={onAnimationStart}
            nativeOnDrag={onDrag}
            nativeOnDragStart={onDragStart}
            nativeOnDragEnd={onDragEnd}
            initial={false}
            layout={reducedMotion ? false : "size"}
            animate={{ scale: 1 }}
            whileTap={
              !reducedMotion &&
              !disabled &&
              !pending &&
              props["aria-disabled"] !== true &&
              props["aria-disabled"] !== "true"
                ? { scale: 0.96, transition: { duration: 0.08, ease: "easeOut" } }
                : {}
            }
            transition={{
              layout: layoutTransition,
              scale: reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 460, damping: 18, mass: 0.6 },
            }}
          />
        )
      }
      className={(buttonState) =>
        cn(
          buttonVariants({ variant, size: spinnerOnly ? circleSize : size }),
          "motion-reduce:transform-none!",
          spinnerOnly && "rounded-full",
          showLoadingText && "inline-grid",
          typeof className === "function" ? className(buttonState) : className,
        )
      }
    >
      {showLoadingText && (
        <span
          aria-hidden="true"
          className="pointer-events-none col-start-1 row-start-1 inline-flex min-w-0 [align-items:inherit] [justify-content:inherit] [flex-wrap:inherit] [flex-direction:inherit] gap-[inherit] opacity-0"
        >
          {idleContent}
        </span>
      )}
      <AnimatePresence initial={false} mode="popLayout">
        <ButtonContent
          key={pending ? "loading" : `content:${String(labelKey)}`}
          reducedMotion={reducedMotion}
          className={showLoadingText ? "col-start-1 row-start-1" : undefined}
        >
          {!pending ? (
            idleContent
          ) : (
            <>
              <Spinner />
              <span
                data-slot={showLoadingText ? "button-loading-text" : undefined}
                className={spinnerOnly || iconOnly ? "sr-only" : undefined}
              >
                {loadingText || children}
              </span>
            </>
          )}
        </ButtonContent>
      </AnimatePresence>
    </BaseButton>
  );
}
