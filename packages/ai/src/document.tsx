"use client";

import type { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import {
  Collapsible,
  CollapsiblePreviewContent,
  CollapsibleTrigger,
} from "@kind-ui/primitives/collapsible";
import { FileText } from "lucide-react";
import {
  type ComponentProps,
  cloneElement,
  createContext,
  isValidElement,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useId,
  useRef,
} from "react";
import { cn, surfaceClass, useControllable } from "./utils.js";

interface DocumentContextValue {
  open: boolean;
  collapsedHeight: number;
  contentId: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
}
const DocumentContext = createContext<DocumentContextValue | null>(null);
function useDocumentContext(): DocumentContextValue {
  const context = useContext(DocumentContext);
  if (!context) throw new Error("Document parts require <Document>.");
  return context;
}
export type DocumentProps = ComponentProps<"div"> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  collapsedHeight?: number;
  /** Optional explicit ID shared by the content and every trigger. */
  contentId?: string;
};
export function Document({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  collapsedHeight = 200,
  contentId: explicitContentId,
  className,
  children,
  ...props
}: DocumentProps) {
  const [open, setOpen] = useControllable(controlledOpen, defaultOpen, onOpenChange);
  const generatedId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <DocumentContext.Provider
      value={{
        open,
        contentId: explicitContentId ?? generatedId,
        collapsedHeight: Number.isFinite(collapsedHeight) ? Math.max(0, collapsedHeight) : 200,
        triggerRef,
      }}
    >
      <Collapsible
        {...props}
        open={open}
        onOpenChange={setOpen}
        data-slot="document"
        data-open={open || undefined}
        className={cn(surfaceClass, "flex min-w-0 flex-col rounded-2xl", className)}
      >
        {children}
      </Collapsible>
    </DocumentContext.Provider>
  );
}
export type DocumentHeaderProps = ComponentProps<"header">;
export function DocumentHeader({ className, children, ...props }: DocumentHeaderProps) {
  return (
    <header
      {...props}
      data-slot="document-header"
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-2 border-b border-border/60 px-3 py-1 coarse:min-h-11",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex size-5 shrink-0 items-center justify-center text-muted-foreground"
      >
        <FileText
          aria-hidden="true"
          focusable="false"
          nonScalingStroke
          strokeWidth={1.5}
          className="size-4"
        />
      </span>
      {children}
    </header>
  );
}
export type DocumentTitleProps = ComponentProps<"div">;
export function DocumentTitle({ className, ...props }: DocumentTitleProps) {
  return (
    <div
      {...props}
      data-slot="document-title"
      className={cn(
        "min-w-0 flex-[1_1_8rem] text-ai-title font-medium text-foreground [overflow-wrap:anywhere]",
        className,
      )}
    />
  );
}
export type DocumentActionProps = ComponentProps<"div">;
export function DocumentAction({ className, ...props }: DocumentActionProps) {
  return (
    <div
      {...props}
      data-slot="document-action"
      className={cn("ms-auto flex max-w-full flex-wrap items-center gap-1", className)}
    />
  );
}
export type DocumentTriggerProps = useRender.ComponentProps<"button", { open: boolean }>;
/** Native toggle; custom render retains consumer visual ownership. */
export function DocumentTrigger({
  children,
  render,
  className,
  ref,
  onClick,
  disabled,
  ...props
}: DocumentTriggerProps) {
  const context = useDocumentContext();
  const setTriggerRef = useCallback(
    (element: HTMLButtonElement | null) => {
      context.triggerRef.current = element;
      if (typeof ref === "function") {
        const cleanup = ref(element);
        if (typeof cleanup === "function")
          return () => {
            context.triggerRef.current = null;
            cleanup();
          };
      } else if (ref) ref.current = element;
    },
    [ref, context.triggerRef],
  );
  return (
    <CollapsibleTrigger
      {...props}
      ref={setTriggerRef}
      render={
        typeof render === "function" ? (
          (triggerProps, state) => {
            const renderProps = { ...triggerProps, disabled };
            return render(renderProps, state);
          }
        ) : isValidElement<ComponentProps<"button">>(render) ? (
          cloneElement(render, {
            disabled: "disabled" in render.props ? render.props.disabled : disabled,
          })
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="min-h-0 justify-start rounded-none border-0 bg-transparent p-0 font-[inherit] text-[inherit] leading-[inherit] shadow-none"
          />
        )
      }
      className={cn(
        !render &&
          "inline-flex min-h-7 items-center justify-center gap-1.5 rounded-md px-2 py-0.5 text-ai-label font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground disabled:opacity-45 coarse:min-h-11 focus-visible:outline-none focus-visible:shadow-kind-focus",
        className,
      )}
      type="button"
      disabled={disabled}
      data-slot="document-trigger"
      data-open={context.open || undefined}
      aria-label={props["aria-label"] ?? (context.open ? "Collapse document" : "Expand document")}
      aria-expanded={context.open}
      aria-controls={context.contentId}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) event.preventBaseUIHandler();
      }}
    >
      {children === undefined && !render
        ? context.open
          ? "Collapse document"
          : "Expand document"
        : children}
    </CollapsibleTrigger>
  );
}
export type DocumentContentProps = Omit<ComponentProps<"div">, "id"> & {
  /** Text for assistive technology while the clipped preview is inert. */
  previewDescription?: ReactNode;
};
/** Always-visible preview; collapsed interactive content is inert while any content is clipped. */
export function DocumentContent({
  className,
  children,
  style,
  ref,
  previewDescription = "Document preview. Expand the document to read and interact with the full content.",
  tabIndex = -1,
  onFocusCapture,
  onBlurCapture,
  ...props
}: DocumentContentProps) {
  const { open, collapsedHeight, contentId, triggerRef } = useDocumentContext();
  return (
    <CollapsiblePreviewContent
      {...props}
      id={contentId}
      ref={ref}
      open={open}
      previewHeight={collapsedHeight}
      returnFocusRef={triggerRef}
      previewDescription={previewDescription}
      contentClassName="space-y-2.5 px-3 pb-3 pt-2.5"
      tabIndex={tabIndex}
      onFocusCapture={onFocusCapture}
      onBlurCapture={onBlurCapture}
      data-slot="document-content"
      className={cn(
        "group/document-content relative min-w-0 overflow-hidden rounded-b-2xl bg-background text-ai-body [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:shadow-kind-focus",
        className,
      )}
      style={style}
      overlay={
        <div
          aria-hidden="true"
          data-slot="document-fade"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent opacity-0 transition-opacity duration-150 motion-reduce:transition-none group-data-[clipped]/document-content:opacity-100"
        />
      }
    >
      {children}
    </CollapsiblePreviewContent>
  );
}
