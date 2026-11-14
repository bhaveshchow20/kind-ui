"use client";

import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import {
  HoverCard,
  HoverCardContent,
  type HoverCardContentProps,
  type HoverCardProps,
  HoverCardTrigger,
  type HoverCardTriggerProps,
} from "@kind-ui/primitives/hover-card";
import type { ClassValue } from "clsx";
import {
  FileText,
  Globe,
  Image as ImageIcon,
  type LucideIcon,
  Music2,
  Paperclip,
  Video,
  X,
} from "lucide-react";
import { type ComponentProps, createContext, type ReactNode, useContext, useState } from "react";
import { actionClass, cn, safeUrl, surfaceClass } from "./utils.js";

/** Structural data contract: no AI SDK runtime or types are required. */
export type AttachmentData =
  | { type: "file"; id: string; url: string; mediaType?: string; filename?: string }
  | {
      type: "source-document";
      id: string;
      sourceId?: string;
      title?: string;
      filename?: string;
      mediaType?: string;
    };
export type AttachmentMediaCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "source"
  | "unknown";
export type AttachmentVariant = "grid" | "inline" | "list";
export type AttachmentState = "default" | "error";
export function getMediaCategory(data: AttachmentData): AttachmentMediaCategory {
  if (data.type === "source-document") return "source";
  const type = data.mediaType?.toLowerCase() ?? "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("application/") || type.startsWith("text/")) return "document";
  return "unknown";
}
export function getAttachmentLabel(data: AttachmentData): string {
  return data.type === "source-document"
    ? data.title || data.filename || "Source"
    : data.filename || (getMediaCategory(data) === "image" ? "Image" : "Attachment");
}
const AttachmentsContext = createContext<{ variant: AttachmentVariant }>({ variant: "grid" });
type AttachmentContextValue = {
  data: AttachmentData | undefined;
  variant: AttachmentVariant | null;
  mediaCategory: AttachmentMediaCategory;
  onRemove: (() => void) | undefined;
  progress: number | undefined;
  state: AttachmentState | null;
};
const AttachmentContext = createContext<AttachmentContextValue | null>(null);
export function useAttachmentsContext() {
  return useContext(AttachmentsContext);
}
export function useAttachmentContext() {
  const context = useContext(AttachmentContext);
  if (!context) throw new Error("Attachment parts must be rendered within <Attachment>.");
  return context;
}
export type AttachmentsProps = ComponentProps<"div"> & { variant?: AttachmentVariant };
export function Attachments({ variant = "grid", className, children, ...props }: AttachmentsProps) {
  return (
    <AttachmentsContext value={{ variant }}>
      <div
        data-slot="attachments"
        data-variant={variant}
        className={cn(
          "flex min-w-0 max-w-full gap-2",
          variant === "list" ? "flex-col" : "flex-wrap items-start",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AttachmentsContext>
  );
}
export function attachmentVariants({
  variant,
  layout,
  state = "default",
  class: classValue,
  className,
}: {
  variant?: AttachmentVariant | null | undefined;
  layout?: "row" | "card" | null | undefined;
  state?: AttachmentState | null | undefined;
  class?: ClassValue;
  className?: ClassValue;
} = {}) {
  const resolved =
    variant !== undefined ? variant : layout === null ? null : layout === "row" ? "list" : "grid";
  return cn(
    "group/attachment relative isolate min-w-0 text-foreground border border-border/45 bg-surface transition-colors duration-150 motion-reduce:transition-none [&:is(a,button)]:cursor-pointer [&:is(a,button):hover]:bg-secondary focus-visible:outline-none focus-visible:shadow-kind-focus",
    resolved === "grid"
      ? "size-24 shrink-0 rounded-2xl p-1"
      : resolved === "inline"
        ? "inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-xl py-1 ps-1.5 pe-2 text-ai-label"
        : resolved === "list"
          ? "flex w-full min-w-0 items-center gap-2.5 rounded-xl p-2"
          : undefined,
    state === "error" && "border-destructive/30 bg-destructive/5",
    classValue,
    className,
  );
}
export type AttachmentProps = useRender.ComponentProps<"div"> & {
  data?: AttachmentData;
  onRemove?: () => void;
  variant?: AttachmentVariant | null | undefined;
  /** Convenience mapping: row → list, card → grid. Explicit variant wins. */
  layout?: "row" | "card" | null | undefined;
  state?: AttachmentState | null | undefined;
  progress?: number;
};
export function Attachment({
  data,
  onRemove,
  variant: variantProp,
  layout,
  state = "default",
  progress,
  className,
  render,
  ref,
  ...props
}: AttachmentProps) {
  const inherited = useAttachmentsContext();
  const variant =
    variantProp !== undefined
      ? variantProp
      : layout === null
        ? null
        : layout
          ? layout === "row"
            ? "list"
            : "grid"
          : inherited.variant;
  const element = useRender({
    defaultTagName: "div",
    render,
    ref,
    props: {
      ...props,
      "data-slot": "attachment",
      "data-variant": variant,
      "data-layout": variant === null ? undefined : variant === "grid" ? "card" : "row",
      "data-state": state,
      className: attachmentVariants({ variant, state, ...(className ? { className } : {}) }),
    },
  });
  return (
    <AttachmentContext
      value={{
        data,
        onRemove,
        variant,
        state,
        progress,
        mediaCategory: data ? getMediaCategory(data) : "unknown",
      }}
    >
      {element}
    </AttachmentContext>
  );
}
const categoryIcons: Record<AttachmentMediaCategory, LucideIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music2,
  document: FileText,
  source: Globe,
  unknown: Paperclip,
};
function MediaIcon({
  category,
  className,
}: {
  category: AttachmentMediaCategory;
  className?: string;
}) {
  const Icon = categoryIcons[category];
  return (
    <Icon
      aria-hidden="true"
      strokeWidth={1.5}
      nonScalingStroke
      className={cn("size-5", className)}
    />
  );
}
function FileIdentity({
  data,
  category,
  variant,
}: {
  data: AttachmentData | undefined;
  category: AttachmentMediaCategory;
  variant: AttachmentVariant | null;
}) {
  const label = data ? getAttachmentLabel(data) : "Attachment";
  const extension = data?.filename?.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toUpperCase();
  const format =
    extension ??
    (data?.mediaType === "application/pdf"
      ? "PDF"
      : category === "source"
        ? "SOURCE"
        : category === "document"
          ? "DOC"
          : category === "unknown"
            ? "FILE"
            : category.toUpperCase());
  if (variant === "grid")
    return (
      <div className="flex size-full min-w-0 flex-col justify-between p-1.5 @max-[5rem]:items-center @max-[5rem]:justify-center @max-[5rem]:p-1">
        <span className="flex size-8 items-center justify-center text-foreground/75 group-data-[state=error]/attachment:text-danger-text">
          <MediaIcon category={category} className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 @max-[5rem]:hidden">
          <span className="block truncate text-ai-label font-medium text-foreground" title={label}>
            {label}
          </span>
          <span className="truncate text-ai-meta font-normal tracking-[0.04em] text-muted-foreground">
            {format}
          </span>
        </span>
      </div>
    );
  if (variant === "list")
    return (
      <span className="flex size-full flex-col items-center justify-center gap-0.5">
        <MediaIcon category={category} className="size-5" />
        <span className="max-w-full truncate text-ai-meta font-normal tracking-[0.04em]">
          {format}
        </span>
      </span>
    );
  return <MediaIcon category={category} className={variant === "inline" ? "size-4" : "size-5"} />;
}
export type AttachmentMediaProps = ComponentProps<"div">;
export function AttachmentMedia({ className, ...props }: AttachmentMediaProps) {
  const { variant, state } = useAttachmentContext();
  return (
    <div
      data-slot="attachment-media"
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-inset text-muted-foreground [&_[data-slot=attachment-media-img]]:size-full [&_[data-slot=attachment-media-img]]:object-cover",
        variant !== null && "@container",
        variant === "grid"
          ? "size-full rounded-[11px]"
          : variant === "inline"
            ? "size-6 rounded-lg"
            : variant === "list"
              ? "size-10 rounded-lg"
              : undefined,
        state === "error" && "bg-destructive/10 text-danger-text",
        className,
      )}
      {...props}
    />
  );
}
function PreviewMedia({
  url,
  category,
  label,
  fallback,
}: {
  url: string | undefined;
  category: AttachmentMediaCategory;
  label: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <>{fallback}</>;
  if (category === "image")
    return (
      <img
        data-slot="attachment-media-img"
        src={url}
        alt={label}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  if (category === "video")
    return (
      <video
        aria-label={label}
        className="size-full object-cover"
        src={url}
        muted
        playsInline
        preload="none"
        onError={() => setFailed(true)}
      />
    );
  return <>{fallback}</>;
}
export type AttachmentPreviewProps = AttachmentMediaProps & { fallbackIcon?: ReactNode };
export function AttachmentPreview({ fallbackIcon, children, ...props }: AttachmentPreviewProps) {
  const { data, mediaCategory, variant } = useAttachmentContext();
  const raw = data?.type === "file" ? data.url : undefined;
  const validated = safeUrl(raw);
  const url = validated && !/^(mailto:|tel:)/i.test(validated) ? validated : undefined;
  return (
    <AttachmentMedia {...props}>
      {children ?? (
        <PreviewMedia
          key={`${url}:${mediaCategory}`}
          url={url}
          category={mediaCategory}
          label={data ? getAttachmentLabel(data) : "Attachment"}
          fallback={
            fallbackIcon ?? <FileIdentity data={data} category={mediaCategory} variant={variant} />
          }
        />
      )}
    </AttachmentMedia>
  );
}
export type AttachmentInfoProps = ComponentProps<"div"> & { showMediaType?: boolean };
export function AttachmentInfo({ showMediaType = false, children, ...props }: AttachmentInfoProps) {
  const { data, variant } = useAttachmentContext();
  if (variant === "grid") return null;
  return (
    <AttachmentContent {...props}>
      {children ?? (
        <>
          <AttachmentName>{data ? getAttachmentLabel(data) : "Attachment"}</AttachmentName>
          {showMediaType && data?.mediaType && (
            <AttachmentDescription>{data.mediaType}</AttachmentDescription>
          )}
        </>
      )}
    </AttachmentContent>
  );
}
export type AttachmentRemoveProps = ComponentProps<"button"> & { label?: string };
export function AttachmentRemove({
  label,
  className,
  children,
  onClick,
  type = "button",
  ...props
}: AttachmentRemoveProps) {
  const { onRemove, variant, data } = useAttachmentContext();
  if (!onRemove) return null;
  const name = label ?? (data ? `Remove ${getAttachmentLabel(data)}` : "Remove attachment");
  return (
    <Button
      variant="ghost"
      size="sm"
      type={type}
      aria-label={name}
      title={name}
      className={cn(
        actionClass,
        "min-h-7 min-w-7 shrink-0 p-1 text-muted-foreground hover:text-foreground coarse:min-h-11 coarse:min-w-11",
        variant === "grid" &&
          "absolute end-1.5 top-1.5 border border-border/55 bg-elevated text-foreground",
        className,
      )}
      {...props}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
        if (!event.defaultPrevented) onRemove();
      }}
    >
      {children ?? <X aria-hidden="true" strokeWidth={1.5} nonScalingStroke className="size-3.5" />}
    </Button>
  );
}
export type AttachmentIconProps = ComponentProps<"span">;
export function AttachmentIcon({ className, ...props }: AttachmentIconProps) {
  return (
    <span
      data-slot="attachment-icon"
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center [&>svg]:size-5", className)}
      {...props}
    />
  );
}
export type AttachmentContentProps = ComponentProps<"div">;
export function AttachmentContent({ className, ...props }: AttachmentContentProps) {
  return (
    <div
      data-slot="attachment-content"
      className={cn("flex min-w-0 flex-1 flex-col gap-0.5 py-0.5", className)}
      {...props}
    />
  );
}
export type AttachmentNameProps = ComponentProps<"div">;
export function AttachmentName({ className, ...props }: AttachmentNameProps) {
  return (
    <div
      data-slot="attachment-name"
      className={cn(
        "min-w-0 break-words text-ai-label font-medium text-foreground [overflow-wrap:anywhere]",
        className,
      )}
      {...props}
    />
  );
}
export type AttachmentDescriptionProps = ComponentProps<"div">;
export function AttachmentDescription({ className, ...props }: AttachmentDescriptionProps) {
  const { state } = useAttachmentContext();
  return (
    <div
      data-slot="attachment-description"
      className={cn(
        "min-w-0 break-words text-ai-meta text-muted-foreground [overflow-wrap:anywhere]",
        state === "error" && "text-danger-text",
        className,
      )}
      {...props}
    />
  );
}
export type AttachmentOverlayProps = ComponentProps<"div">;
export function AttachmentOverlay({ className, ...props }: AttachmentOverlayProps) {
  return (
    <div
      data-slot="attachment-overlay"
      className={cn(
        "absolute inset-0 flex items-center justify-center rounded-[inherit] bg-foreground/60 text-background",
        className,
      )}
      {...props}
    />
  );
}
export type AttachmentProgressProps = ComponentProps<"svg"> & { label?: string };
export function AttachmentProgress({
  label = "Upload progress",
  className,
  children,
  ...props
}: AttachmentProgressProps) {
  const { progress } = useAttachmentContext();
  const value =
    progress === undefined || !Number.isFinite(progress)
      ? undefined
      : Math.min(100, Math.max(0, progress));
  const circumference = 2 * Math.PI * 10;
  return (
    <svg
      data-slot="attachment-progress"
      viewBox="0 0 24 24"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn(
        "size-6 shrink-0",
        value === undefined ? "animate-spin motion-reduce:animate-none" : "-rotate-90",
        className,
      )}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (value === undefined ? 0.75 : 1 - value / 100)}
        className="transition-[stroke-dashoffset] duration-200 ease-out motion-reduce:transition-none"
      />
      {children}
    </svg>
  );
}
export type AttachmentActionProps = ComponentProps<"div">;
export function AttachmentAction({ className, ...props }: AttachmentActionProps) {
  return (
    <div
      data-slot="attachment-action"
      className={cn("inline-flex shrink-0 items-center gap-1", className)}
      {...props}
    />
  );
}
export type AttachmentHoverCardProps = HoverCardProps;
export function AttachmentHoverCard({
  openDelay = 0,
  closeDelay = 0,
  ...props
}: AttachmentHoverCardProps) {
  return <HoverCard openDelay={openDelay} closeDelay={closeDelay} {...props} />;
}
export type AttachmentHoverCardTriggerProps = HoverCardTriggerProps;
export function AttachmentHoverCardTrigger(props: AttachmentHoverCardTriggerProps) {
  return <HoverCardTrigger {...props} />;
}
export type AttachmentHoverCardContentProps = HoverCardContentProps;
export function AttachmentHoverCardContent({
  align = "start",
  side = "bottom",
  sideOffset = 8,
  alignOffset = 0,
  collisionPadding = 8,
  className,
  ...props
}: AttachmentHoverCardContentProps) {
  return (
    <HoverCardContent
      align={align}
      side={side}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      collisionPadding={collisionPadding}
      {...props}
      className={(state) =>
        cn(
          "border-transparent p-2 text-[length:inherit] transition-opacity duration-180 ease-kind-out data-[ending-style]:duration-120 motion-safe:data-[starting-style]:scale-100 motion-safe:data-[ending-style]:scale-100",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
export type AttachmentEmptyProps = ComponentProps<"div">;
export function AttachmentEmpty({ className, children, ...props }: AttachmentEmptyProps) {
  return (
    <div
      data-slot="attachment-empty"
      className={cn(
        surfaceClass,
        "flex min-w-0 flex-col items-center gap-2 rounded-xl border-dashed px-4 py-4 text-center text-ai-label text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <span aria-hidden="true" className="flex size-8 items-center justify-center">
            <MediaIcon category="unknown" />
          </span>
          <span>No attachments</span>
        </>
      )}
    </div>
  );
}
