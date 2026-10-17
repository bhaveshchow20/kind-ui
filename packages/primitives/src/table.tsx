"use client";

import type { ComponentProps, ReactNode, Ref, RefObject } from "react";
import { createContext, use, useCallback, useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "./button.js";
import {
  Dialog,
  DialogBackdrop,
  type DialogBackdropProps,
  DialogClose,
  DialogPopup,
  type DialogPopupProps,
  DialogPortal,
  type DialogPortalProps,
  type DialogProps,
  DialogTitle,
  DialogTrigger,
  type DialogTriggerProps,
} from "./dialog.js";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "./menu.js";
import { cn } from "./utils.js";

export type TableData = { headers: string[]; rows: string[][] };
export type TableCopyFormat = "markdown" | "csv" | "tsv";
export type TableDownloadFormat = "csv" | "markdown";

/** Read rendered text at the time an action is invoked, including rich cell children. */
export function extractTableData(table: HTMLTableElement): TableData {
  return {
    headers: Array.from(
      table.querySelectorAll("thead th"),
      (cell) => cell.textContent?.trim() ?? "",
    ),
    rows: Array.from(table.querySelectorAll("tbody tr"), (row) =>
      Array.from(row.querySelectorAll("th,td"), (cell) => cell.textContent?.trim() ?? ""),
    ),
  };
}

export function tableDataToCSV({ headers, rows }: TableData): string {
  const encodeCell = (value: string) =>
    /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return [...(headers.length ? [headers] : []), ...rows]
    .map((row) => row.map(encodeCell).join(","))
    .join("\n");
}

export function tableDataToTSV({ headers, rows }: TableData): string {
  const encodeCell = (value: string) =>
    value.replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
  return [...(headers.length ? [headers] : []), ...rows]
    .map((row) => row.map(encodeCell).join("\t"))
    .join("\n");
}

export function tableDataToMarkdown({ headers, rows }: TableData): string {
  if (!headers.length) return "";
  const encodeCell = (value: string) => value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
  const line = (row: string[]) => `| ${row.map(encodeCell).join(" | ")} |`;
  return [
    line(headers),
    line(headers.map(() => "---")),
    ...rows.map((row) =>
      line([...row, ...Array<string>(Math.max(0, headers.length - row.length)).fill("")]),
    ),
  ].join("\n");
}

export type TableLabels = {
  copy: string;
  download: string;
  fullscreen: string;
  exitFullscreen: string;
  view: string;
  copied: string;
  copyError: string;
  downloadError: string;
  markdown: string;
  csv: string;
  tsv: string;
  copyMarkdown: string;
  copyCsv: string;
  copyTsv: string;
  downloadCsv: string;
  downloadMarkdown: string;
};
const defaultLabels: TableLabels = {
  copy: "Copy table",
  download: "Download table",
  fullscreen: "View fullscreen",
  exitFullscreen: "Exit fullscreen",
  view: "Table view",
  copied: "Copied to clipboard",
  copyError: "Unable to copy table",
  downloadError: "Unable to download table",
  markdown: "Markdown",
  csv: "CSV",
  tsv: "TSV",
  copyMarkdown: "Copy table as Markdown",
  copyCsv: "Copy table as CSV",
  copyTsv: "Copy table as TSV",
  downloadCsv: "Download table as CSV",
  downloadMarkdown: "Download table as Markdown",
};
type TableContextValue = { root: RefObject<HTMLDivElement | null>; labels: TableLabels };
const TableContext = createContext<TableContextValue | null>(null);
function useTable() {
  const context = use(TableContext);
  if (!context) throw new Error("Table controls must be used within TableContainer.");
  return context;
}
function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") return ref(value);
  else if (ref) ref.current = value;
}
export type TableContainerProps = ComponentProps<"div"> & {
  labels?: Partial<TableLabels> | undefined;
};
export function TableContainer({
  labels,
  ref,
  className,
  children,
  ...props
}: TableContainerProps) {
  const root = useRef<HTMLDivElement>(null);
  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      root.current = element;
      const cleanup = setRef(ref, element);
      if (!element) return;
      return () => {
        root.current = null;
        if (typeof cleanup === "function") cleanup();
        else setRef(ref, null);
      };
    },
    [ref],
  );
  return (
    <TableContext.Provider value={{ root, labels: { ...defaultLabels, ...labels } }}>
      <div
        data-slot="table-container"
        ref={attach}
        className={cn(
          "min-w-0 max-w-full rounded-md border border-border/60 bg-background text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </TableContext.Provider>
  );
}
export type TableProps = ComponentProps<"table">;
export function Table({ className, ...props }: TableProps) {
  return (
    <table
      data-slot="table"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Safari requires a focus target for keyboard scrolling of the surrounding viewport.
      tabIndex={0}
      className={cn(
        "w-full caption-bottom border-collapse text-start text-[13px] leading-6 focus-visible:outline-none focus-visible:shadow-kind-focus",
        className,
      )}
      {...props}
    />
  );
}
export type TableHeaderProps = ComponentProps<"thead">;
export function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead data-slot="table-header" className={cn("bg-secondary/45", className)} {...props} />;
}
export type TableBodyProps = ComponentProps<"tbody">;
export function TableBody({ className, ...props }: TableBodyProps) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-b-0", className)}
      {...props}
    />
  );
}
export type TableFooterProps = ComponentProps<"tfoot">;
export function TableFooter({ className, ...props }: TableFooterProps) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-border/60 bg-secondary/45 font-medium [&_tr:last-child]:border-b-0",
        className,
      )}
      {...props}
    />
  );
}
export type TableRowProps = ComponentProps<"tr">;
export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr data-slot="table-row" className={cn("border-b border-border/60", className)} {...props} />
  );
}
export type TableHeadProps = ComponentProps<"th">;
export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn("px-3 py-1.5 text-start align-top font-medium", className)}
      {...props}
    />
  );
}
export type TableCellProps = ComponentProps<"td">;
export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      className={cn("px-3 py-1.5 text-start align-top", className)}
      {...props}
    />
  );
}
export type TableCaptionProps = ComponentProps<"caption">;
export function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("px-3 py-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
export type TableToolbarProps = ComponentProps<"div">;
export function TableToolbar({ className, ...props }: TableToolbarProps) {
  return (
    <div
      data-slot="table-toolbar"
      className={cn("flex min-w-0 items-center justify-end gap-0.5 px-1 py-1", className)}
      {...props}
    />
  );
}
export type TableViewportProps = ComponentProps<"div">;
export function TableViewport({ className, ...props }: TableViewportProps) {
  return (
    <div
      data-slot="table-viewport"
      className={cn(
        "min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-[inherit]",
        className,
      )}
      {...props}
    />
  );
}
const actionClassName =
  "size-7 min-h-7 min-w-7 rounded-md p-0 text-muted-foreground [&_svg]:size-3.5 pointer-coarse:size-11 pointer-coarse:min-h-11 pointer-coarse:min-w-11";
function TableIcon({ kind }: { kind: "copy" | "download" | "fullscreen" | "close" | "check" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "copy" ? (
        <>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </>
      ) : kind === "download" ? (
        <path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4" />
      ) : kind === "fullscreen" ? (
        <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
      ) : kind === "check" ? (
        <path d="m5 12 4 4L19 6" />
      ) : (
        <path d="m6 6 12 12M6 18 18 6" />
      )}
    </svg>
  );
}
function currentTable(context: TableContextValue) {
  const table = context.root.current?.querySelector("table");
  if (!table) throw new Error("No table is available.");
  return table;
}
function actionError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}
function useTableMenuFocus() {
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  return {
    trigger,
    popup,
    onOpenChange: (nextOpen: boolean, details: { reason: string }) => {
      const target = trigger.current;
      const active = target?.ownerDocument.activeElement;
      // Return focus before the closing menu becomes inert. This prevents its
      // enclosing dialog from queuing a competing focus reset after removal.
      if (
        !nextOpen &&
        ["escape-key", "item-press"].includes(details.reason) &&
        active &&
        popup.current?.contains(active)
      )
        target?.focus({ preventScroll: true });
    },
  };
}
function serialize(table: HTMLTableElement, format: TableCopyFormat) {
  const data = extractTableData(table);
  return format === "csv"
    ? tableDataToCSV(data)
    : format === "tsv"
      ? tableDataToTSV(data)
      : tableDataToMarkdown(data);
}
export type TableCopyMenuProps = Omit<ButtonProps, "onCopy" | "onError"> & {
  onCopy?: ((format: TableCopyFormat) => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
  timeout?: number | undefined;
  copiedChildren?: ReactNode;
};
export function TableCopyMenu({
  children,
  copiedChildren,
  onCopy,
  onError,
  timeout = 2000,
  className,
  disabled,
  onClick,
  ...props
}: TableCopyMenuProps) {
  const context = useTable();
  const focus = useTableMenuFocus();
  const [feedback, setFeedback] = useState<{
    table: HTMLTableElement | null;
    snapshot: string;
    state: "copied" | "error";
  } | null>(null);
  const request = useRef(0);
  const mounted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current++;
      clearTimeout(timer.current);
    };
  }, []);
  // DOM mutations invalidate feedback even when rich children update independently of this control.
  useEffect(() => {
    const root = context.root.current;
    if (!root || typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(() => {
      if (
        feedback?.table &&
        (context.root.current?.querySelector("table") !== feedback.table ||
          feedback.table.outerHTML !== feedback.snapshot)
      ) {
        request.current++;
        clearTimeout(timer.current);
        setFeedback(null);
      }
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
    return () => observer.disconnect();
  }, [context.root, feedback]);
  async function copy(format: TableCopyFormat) {
    if (
      disabled ||
      props.loading ||
      props["aria-disabled"] === true ||
      props["aria-disabled"] === "true"
    )
      return;
    const currentRequest = ++request.current;
    clearTimeout(timer.current);
    setFeedback(null);
    let table: HTMLTableElement;
    let snapshot: string;
    try {
      table = currentTable(context);
      snapshot = table.outerHTML;
    } catch (error) {
      setFeedback({ table: null, snapshot: "", state: "error" });
      onError?.(actionError(error));
      return;
    }
    const isCurrent = () =>
      mounted.current &&
      request.current === currentRequest &&
      context.root.current?.querySelector("table") === table &&
      table.outerHTML === snapshot;
    try {
      const text = serialize(table, format);
      if (
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard?.write &&
        (typeof ClipboardItem.supports !== "function" || ClipboardItem.supports("text/html"))
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([text], { type: "text/plain" }),
            "text/html": new Blob([snapshot], { type: "text/html" }),
          }),
        ]);
      } else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error("Clipboard is unavailable.");
    } catch (error) {
      if (!isCurrent()) return;
      setFeedback({ table, snapshot, state: "error" });
      onError?.(actionError(error));
      return;
    }
    if (!isCurrent()) return;
    setFeedback({ table, snapshot, state: "copied" });
    timer.current = setTimeout(
      () => {
        if (isCurrent()) setFeedback(null);
      },
      Math.max(0, timeout),
    );
    onCopy?.(format);
  }
  const state = feedback?.state;
  return (
    <>
      <Menu onOpenChange={focus.onOpenChange}>
        <MenuTrigger
          ref={focus.trigger}
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={context.labels.copy}
              title={context.labels.copy}
              {...props}
            />
          }
          data-slot="table-copy-menu"
          data-state={state ?? "idle"}
          disabled={disabled}
          className={(state) =>
            cn(actionClassName, typeof className === "function" ? className(state) : className)
          }
          onClick={onClick}
        >
          {state === "copied"
            ? (copiedChildren ?? <TableIcon kind="check" />)
            : (children ?? <TableIcon kind="copy" />)}
        </MenuTrigger>
        <MenuContent ref={focus.popup} align="end" container={context.root}>
          <MenuItem
            aria-label={context.labels.copyMarkdown}
            disabled={disabled}
            onClick={() => void copy("markdown")}
          >
            {context.labels.markdown}
          </MenuItem>
          <MenuItem
            aria-label={context.labels.copyCsv}
            disabled={disabled}
            onClick={() => void copy("csv")}
          >
            {context.labels.csv}
          </MenuItem>
          <MenuItem
            aria-label={context.labels.copyTsv}
            disabled={disabled}
            onClick={() => void copy("tsv")}
          >
            {context.labels.tsv}
          </MenuItem>
        </MenuContent>
      </Menu>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied"
          ? context.labels.copied
          : state === "error"
            ? context.labels.copyError
            : ""}
      </span>
    </>
  );
}
export type TableDownloadMenuProps = Omit<ButtonProps, "onError"> & {
  filename?: string | undefined;
  onDownload?: ((format: TableDownloadFormat) => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
};
export function TableDownloadMenu({
  filename = "table",
  onDownload,
  onError,
  children,
  className,
  disabled,
  onClick,
  ...props
}: TableDownloadMenuProps) {
  const context = useTable();
  const focus = useTableMenuFocus();
  const [failed, setFailed] = useState(false);
  function download(format: TableDownloadFormat) {
    if (
      disabled ||
      props.loading ||
      props["aria-disabled"] === true ||
      props["aria-disabled"] === "true"
    )
      return;
    setFailed(false);
    let url: string | undefined;
    try {
      const table = currentTable(context);
      url = URL.createObjectURL(
        new Blob([serialize(table, format)], {
          type: format === "csv" ? "text/csv" : "text/markdown",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.${format === "csv" ? "csv" : "md"}`;
      document.body.append(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
    } catch (error) {
      setFailed(true);
      onError?.(actionError(error));
      return;
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
    onDownload?.(format);
  }
  return (
    <>
      <Menu onOpenChange={focus.onOpenChange}>
        <MenuTrigger
          ref={focus.trigger}
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={context.labels.download}
              title={context.labels.download}
              {...props}
            />
          }
          data-slot="table-download-menu"
          disabled={disabled}
          className={(state) =>
            cn(actionClassName, typeof className === "function" ? className(state) : className)
          }
          onClick={onClick}
        >
          {children ?? <TableIcon kind="download" />}
        </MenuTrigger>
        <MenuContent ref={focus.popup} align="end" container={context.root}>
          <MenuItem
            aria-label={context.labels.downloadCsv}
            disabled={disabled}
            onClick={() => download("csv")}
          >
            {context.labels.csv}
          </MenuItem>
          <MenuItem
            aria-label={context.labels.downloadMarkdown}
            disabled={disabled}
            onClick={() => download("markdown")}
          >
            {context.labels.markdown}
          </MenuItem>
        </MenuContent>
      </Menu>
      <span className="sr-only" role="status" aria-live="polite">
        {failed ? context.labels.downloadError : ""}
      </span>
    </>
  );
}
export type TableFullscreenProps<Payload = unknown> = DialogProps<Payload>;
export const TableFullscreen = Dialog;
export type TableFullscreenTriggerProps = DialogTriggerProps;
export function TableFullscreenTrigger({
  children,
  className,
  render,
  ...props
}: TableFullscreenTriggerProps) {
  const { labels } = useTable();
  return (
    <DialogTrigger
      data-slot="table-fullscreen-trigger"
      aria-label={labels.fullscreen}
      title={labels.fullscreen}
      render={render ?? <Button type="button" variant="ghost" size="icon-sm" />}
      {...props}
      className={(state) =>
        cn(actionClassName, typeof className === "function" ? className(state) : className)
      }
    >
      {children ?? <TableIcon kind="fullscreen" />}
    </DialogTrigger>
  );
}
export type TableFullscreenContentProps = DialogPopupProps & {
  label?: ReactNode;
  closeLabel?: string | undefined;
  closeChildren?: ReactNode;
  portalProps?: DialogPortalProps | undefined;
  backdropProps?: DialogBackdropProps | undefined;
};
export function TableFullscreenContent({
  label,
  closeLabel,
  closeChildren,
  portalProps,
  backdropProps,
  ref,
  children,
  className,
  ...props
}: TableFullscreenContentProps) {
  const context = useTable();
  const root = useRef<HTMLDivElement>(null);
  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      root.current = element;
      const cleanup = setRef(ref, element);
      if (!element) return;
      return () => {
        root.current = null;
        if (typeof cleanup === "function") cleanup();
        else setRef(ref, null);
      };
    },
    [ref],
  );
  return (
    <DialogPortal themeSource={context.root} {...portalProps}>
      <DialogBackdrop data-slot="table-fullscreen-backdrop" {...backdropProps} />
      <TableContext.Provider value={{ root, labels: context.labels }}>
        <DialogPopup
          data-slot="table-fullscreen-content"
          ref={attach}
          {...props}
          className={(state) =>
            cn(
              "fixed inset-4 start-4 top-4 z-50 flex min-h-0 min-w-0 max-h-none w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-background text-foreground shadow-kind-float outline-none p-0 sm:inset-8 sm:start-8 sm:top-8 rtl:translate-x-0 [&_[data-slot=table-header]]:sticky [&_[data-slot=table-header]]:top-0 [&_[data-slot=table-header]]:z-10",
              typeof className === "function" ? className(state) : className,
            )
          }
        >
          <div
            data-slot="table-fullscreen-header"
            className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-2"
          >
            <DialogTitle className="text-sm font-medium">
              {label ?? context.labels.view}
            </DialogTitle>
            <DialogClose
              aria-label={closeLabel ?? context.labels.exitFullscreen}
              title={closeLabel ?? context.labels.exitFullscreen}
              render={<Button type="button" variant="ghost" size="icon-sm" />}
              className={actionClassName}
            >
              {closeChildren ?? <TableIcon kind="close" />}
            </DialogClose>
          </div>
          {children}
        </DialogPopup>
      </TableContext.Provider>
    </DialogPortal>
  );
}
