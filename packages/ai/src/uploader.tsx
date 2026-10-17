"use client";

import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import { Upload } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  Fragment,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { actionClass, cn, safeUrl } from "./utils.js";

export type UploadError = { code: string; message: string };
export type UploadItem = {
  id: string;
  name: string;
  size?: number;
  type?: string;
  status: "pending" | "uploading" | "success" | "error" | "canceled";
  progress: number;
  file?: File;
  previewUrl?: string;
  preview?: string;
  result?: unknown;
  error?: UploadError;
};
export type UploaderFn = (input: {
  id: string;
  file: File;
  signal: AbortSignal;
  onProgress: (progress: number) => void;
}) => Promise<unknown>;
export type UploaderContextValue = {
  items: UploadItem[];
  open: () => void;
  add: (files: File[] | FileList) => void;
  start: (id?: string) => void;
  cancel: (id: string) => void;
  retry: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  accept: string | undefined;
  multiple: boolean;
  maxFiles: number | undefined;
  disabled: boolean;
};
const UploaderContext = createContext<UploaderContextValue | null>(null);
export function useUploader(): UploaderContextValue {
  const value = useContext(UploaderContext);
  if (!value) throw new Error("Uploader parts must be rendered within <Uploader>.");
  return value;
}
export type UploaderProps = {
  /** Omit to collect files locally. A transport is invoked only when explicitly provided. */
  uploader?: UploaderFn;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  autoUpload?: boolean;
  disabled?: boolean;
  items?: UploadItem[];
  defaultItems?: UploadItem[];
  onItemsChange?: (items: UploadItem[]) => void;
  onProgress?: (id: string, progress: number) => void;
  onSuccess?: (item: UploadItem) => void;
  onError?: (item: UploadItem) => void;
  children?: ReactNode;
};
function validateFile(
  file: File,
  accept: string | undefined,
  maxSize: number | undefined,
): UploadError | undefined {
  if (maxSize !== undefined && file.size > Math.max(0, maxSize))
    return { code: "max_size", message: `File exceeds ${Math.max(0, maxSize)} bytes.` };
  const tokens =
    accept
      ?.toLowerCase()
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
  if (
    tokens.length &&
    !tokens.some((token) =>
      token.startsWith(".")
        ? file.name.toLowerCase().endsWith(token)
        : token.endsWith("/*")
          ? file.type.toLowerCase().startsWith(token.slice(0, -1))
          : file.type.toLowerCase() === token,
    )
  )
    return { code: "accept", message: "File type is not accepted." };
  return undefined;
}
function uploadError(value: unknown): UploadError {
  if (typeof value === "object" && value !== null)
    return {
      code: "code" in value && typeof value.code === "string" ? value.code : "upload_failed",
      message:
        "message" in value && typeof value.message === "string" ? value.message : "Upload failed.",
    };
  return { code: "upload_failed", message: typeof value === "string" ? value : "Upload failed." };
}
function imageUrl(value: string | undefined) {
  const url = safeUrl(value);
  return url && !/^(mailto:|tel:)/i.test(url) ? url : undefined;
}
function cleanItem(
  item: UploadItem,
  status: UploadItem["status"],
  progress = item.progress,
): UploadItem {
  const { error: _error, ...rest } = item;
  return { ...rest, status, progress };
}
export function Uploader(props: UploaderProps) {
  const {
    items: controlled,
    defaultItems = [],
    children,
    multiple = true,
    autoUpload = true,
    disabled = false,
    accept,
    maxFiles,
  } = props;
  const [internal, setInternal] = useState<UploadItem[]>(defaultItems);
  const items = controlled ?? internal;
  const latest = useRef(props);
  latest.current = props;
  const itemsRef = useRef(items);
  const previousItems = useRef(items);
  if (previousItems.current !== items) {
    previousItems.current = items;
    itemsRef.current = items;
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  const requests = useRef(new Map<string, { controller: AbortController; file: File }>());
  const blobs = useRef(new Map<string, { file: File; url: string }>());
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [liveProgress, setLiveProgress] = useState<Record<string, number>>({});
  const progressRef = useRef<Record<string, number>>({});
  const mutate = useCallback((updater: (current: UploadItem[]) => UploadItem[]) => {
    const current = itemsRef.current;
    const next = updater(current);
    if (next === current || !mounted.current) return;
    itemsRef.current = next;
    if (latest.current.items === undefined) setInternal(next);
    latest.current.onItemsChange?.(next);
  }, []);
  const stopRequest = useCallback((id: string) => {
    const request = requests.current.get(id);
    requests.current.delete(id);
    request?.controller.abort();
  }, []);
  const forgetProgress = useCallback((ids: string[]) => {
    const next = { ...progressRef.current };
    for (const id of ids) delete next[id];
    progressRef.current = next;
    if (mounted.current) setLiveProgress(next);
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const request of requests.current.values()) request.controller.abort();
      requests.current.clear();
      for (const blob of blobs.current.values()) URL.revokeObjectURL(blob.url);
      blobs.current.clear();
    };
  }, []);
  const run = useCallback(
    async (id: string) => {
      const current = itemsRef.current.find((item) => item.id === id);
      const transport = latest.current.uploader;
      if (
        !mounted.current ||
        !current?.file ||
        !transport ||
        latest.current.disabled ||
        requests.current.has(id)
      )
        return;
      if (current.status !== "pending" && current.status !== "uploading") return;
      const file = current.file;
      const validation = validateFile(file, latest.current.accept, latest.current.maxSize);
      if (validation) {
        const failed = { ...current, status: "error" as const, error: validation };
        mutate((values) => values.map((item) => (item.id === id ? failed : item)));
        latest.current.onError?.(failed);
        return;
      }
      const controller = new AbortController();
      const request = { controller, file };
      requests.current.set(id, request);
      const active = () =>
        mounted.current &&
        !controller.signal.aborted &&
        requests.current.get(id) === request &&
        itemsRef.current.some(
          (item) =>
            item.id === id &&
            item.file === file &&
            (item.status === "uploading" || item.status === "pending"),
        );
      mutate((values) =>
        values.map((item) => (item.id === id ? cleanItem(item, "uploading", 0) : item)),
      );
      forgetProgress([id]);
      try {
        const result = await transport({
          id,
          file,
          signal: controller.signal,
          onProgress: (reported) => {
            if (!active() || !Number.isFinite(reported)) return;
            const progress = Math.min(100, Math.max(0, reported));
            progressRef.current = { ...progressRef.current, [id]: progress };
            setLiveProgress(progressRef.current);
            latest.current.onProgress?.(id, progress);
          },
        });
        if (!active()) return;
        const item = itemsRef.current.find((value) => value.id === id);
        if (!item) return;
        const remote =
          typeof result === "object" &&
          result !== null &&
          "url" in result &&
          typeof result.url === "string"
            ? imageUrl(result.url)
            : undefined;
        const completed: UploadItem = {
          ...cleanItem(item, "success", 100),
          result,
          ...(remote ? { previewUrl: remote } : {}),
        };
        requests.current.delete(id);
        forgetProgress([id]);
        mutate((values) => values.map((value) => (value.id === id ? completed : value)));
        latest.current.onSuccess?.(completed);
      } catch (error) {
        if (!active()) return;
        const item = itemsRef.current.find((value) => value.id === id);
        if (!item) return;
        const failed: UploadItem = {
          ...item,
          status: "error",
          progress: progressRef.current[id] ?? item.progress,
          error: uploadError(error),
        };
        requests.current.delete(id);
        forgetProgress([id]);
        mutate((values) => values.map((value) => (value.id === id ? failed : value)));
        latest.current.onError?.(failed);
      } finally {
        if (requests.current.get(id) === request) requests.current.delete(id);
      }
    },
    [mutate, forgetProgress],
  );
  const start = useCallback(
    (id?: string) => {
      if (id !== undefined) {
        void run(id);
        return;
      }
      for (const item of itemsRef.current) if (item.status === "pending") void run(item.id);
    },
    [run],
  );
  const add = useCallback(
    (files: File[] | FileList) => {
      if (!mounted.current || latest.current.disabled) return;
      const incoming = Array.from(files);
      if (!incoming.length) return;
      const config = latest.current;
      const replace = config.maxFiles === 1;
      const current = replace ? [] : itemsRef.current;
      const cap =
        config.maxFiles === undefined ? Infinity : Math.max(0, Math.floor(config.maxFiles));
      let liveCount = current.filter(
        (item) => item.status !== "error" && item.status !== "canceled",
      ).length;
      const added = incoming.map((file, index): UploadItem => {
        let error = validateFile(file, config.accept, config.maxSize);
        if (!error && ((config.multiple === false && index > 0) || liveCount >= cap))
          error = { code: "max_files", message: "The attachment limit has been reached." };
        if (!error) liveCount += 1;
        return {
          id: globalThis.crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          status: error ? "error" : "pending",
          progress: 0,
          ...(error ? { error } : {}),
        };
      });
      if (replace) {
        for (const item of itemsRef.current) stopRequest(item.id);
        forgetProgress(itemsRef.current.map((item) => item.id));
      }
      mutate((values) => (replace ? added : [...values, ...added]));
      for (const item of added) if (item.status === "error") config.onError?.(item);
    },
    [mutate, stopRequest, forgetProgress],
  );
  const cancel = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((value) => value.id === id);
      if (!item || (item.status !== "pending" && item.status !== "uploading")) return;
      stopRequest(id);
      const progress = progressRef.current[id] ?? item.progress;
      forgetProgress([id]);
      mutate((values) =>
        values.map((value) => (value.id === id ? cleanItem(value, "canceled", progress) : value)),
      );
    },
    [mutate, stopRequest, forgetProgress],
  );
  const retry = useCallback(
    (id: string) => {
      if (!mounted.current || latest.current.disabled) return;
      const item = itemsRef.current.find((value) => value.id === id);
      if (!item?.file || (item.status !== "error" && item.status !== "canceled")) return;
      const limit = latest.current.maxFiles;
      const liveCount = itemsRef.current.filter(
        (value) => value.id !== id && value.status !== "error" && value.status !== "canceled",
      ).length;
      if (limit !== undefined && liveCount >= Math.max(0, Math.floor(limit))) {
        const failed: UploadItem = {
          ...item,
          status: "error",
          error: { code: "max_files", message: "The attachment limit has been reached." },
        };
        mutate((values) => values.map((value) => (value.id === id ? failed : value)));
        latest.current.onError?.(failed);
        return;
      }
      stopRequest(id);
      forgetProgress([id]);
      mutate((values) =>
        values.map((value) => (value.id === id ? cleanItem(value, "pending", 0) : value)),
      );
      // Retry is an explicit upload action even when automatic uploads are disabled.
      void run(id);
    },
    [mutate, stopRequest, forgetProgress, run],
  );
  const remove = useCallback(
    (id: string) => {
      stopRequest(id);
      forgetProgress([id]);
      mutate((values) => values.filter((item) => item.id !== id));
    },
    [mutate, stopRequest, forgetProgress],
  );
  const clear = useCallback(() => {
    for (const id of requests.current.keys()) stopRequest(id);
    forgetProgress(Object.keys(progressRef.current));
    mutate(() => []);
  }, [mutate, stopRequest, forgetProgress]);
  const open = useCallback(() => {
    if (!latest.current.disabled) inputRef.current?.click();
  }, []);
  useEffect(() => {
    const valid = new Map(items.map((item) => [item.id, item]));
    const staleProgress: string[] = [];
    for (const [id, request] of requests.current) {
      const item = valid.get(id);
      if (
        !item ||
        item.file !== request.file ||
        (item.status !== "pending" && item.status !== "uploading")
      ) {
        stopRequest(id);
        staleProgress.push(id);
      }
    }
    const next: Record<string, string> = {};
    for (const [id, blob] of blobs.current) {
      if (valid.get(id)?.file !== blob.file) {
        URL.revokeObjectURL(blob.url);
        blobs.current.delete(id);
      }
    }
    for (const item of items) {
      if (item.file?.type.toLowerCase().startsWith("image/") && item.status !== "error") {
        let blob = blobs.current.get(item.id);
        if (!blob) {
          blob = { file: item.file, url: URL.createObjectURL(item.file) };
          blobs.current.set(item.id, blob);
        }
        next[item.id] = blob.url;
      }
    }
    setPreviews((previous) =>
      Object.keys(previous).length === Object.keys(next).length &&
      Object.entries(next).every(([id, url]) => previous[id] === url)
        ? previous
        : next,
    );
    const removed = Object.keys(progressRef.current).filter((id) => {
      const item = valid.get(id);
      return (
        !item ||
        (item.status !== "pending" && item.status !== "uploading") ||
        staleProgress.includes(id)
      );
    });
    if (removed.length) forgetProgress(removed);
    if (autoUpload && !disabled && props.uploader)
      for (const item of items)
        if (
          item.status === "pending" ||
          (item.status === "uploading" && !requests.current.has(item.id))
        )
          void run(item.id);
  }, [items, autoUpload, disabled, props.uploader, run, stopRequest, forgetProgress]);
  const merged = useMemo(
    () =>
      items.map((item) => {
        const { preview: _preview, ...rest } = item;
        const preview = imageUrl(item.previewUrl) ?? previews[item.id];
        return {
          ...rest,
          progress: liveProgress[item.id] ?? item.progress,
          ...(preview ? { preview } : {}),
        };
      }),
    [items, previews, liveProgress],
  );
  return (
    <UploaderContext
      value={{
        items: merged,
        open,
        add,
        start,
        cancel,
        retry,
        remove,
        clear,
        accept,
        multiple,
        maxFiles,
        disabled,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        hidden
        onChange={(event) => {
          if (event.currentTarget.files) add(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
      />
      {children}
    </UploaderContext>
  );
}
export type UploaderTriggerProps = useRender.ComponentProps<"button">;
export function UploaderTrigger({
  render,
  ref,
  className,
  onClick,
  disabled,
  ...props
}: UploaderTriggerProps) {
  const uploader = useUploader();
  return useRender({
    defaultTagName: "button",
    render: render ?? <Button variant="ghost" size="sm" />,
    ref,
    props: {
      type: "button",
      ...props,
      "data-slot": "uploader-trigger",
      disabled: disabled || uploader.disabled,
      className: cn(
        actionClass,
        "min-h-8 min-w-8 gap-1.5 rounded-lg border border-border/55 bg-elevated px-2.5 text-ai-label font-medium text-foreground [&>svg]:size-4 [&>svg]:shrink-0 coarse:min-w-11",
        className,
      ),
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled && !uploader.disabled) uploader.open();
      },
    },
  });
}
export type UploaderDropzoneProps = ComponentProps<"div"> & {
  disabled?: boolean;
  paste?: boolean;
  label?: string;
};
export function UploaderDropzone({
  className,
  children,
  disabled = false,
  paste = true,
  label = "Add attachments",
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onPaste,
  onKeyDown,
  ...props
}: UploaderDropzoneProps) {
  const uploader = useUploader();
  const inactive = disabled || uploader.disabled;
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  return (
    // biome-ignore lint/a11y/useSemanticElements: Preserve the public div/ref composition contract; this named group can wrap a composer rather than only form controls.
    <div
      data-slot="uploader-dropzone"
      role="group"
      data-drag-over={!inactive && over ? "" : undefined}
      aria-label={label}
      aria-disabled={inactive || undefined}
      tabIndex={inactive ? undefined : 0}
      className={cn(
        "relative min-w-0 rounded-2xl border border-transparent bg-inset p-4 text-start text-ai-label text-foreground transition-colors duration-150 data-[drag-over]:bg-primary/5 data-[drag-over]:shadow-kind-focus aria-disabled:opacity-50 aria-[invalid=true]:border-destructive/30 aria-[invalid=true]:bg-destructive/5 data-[state=error]:border-destructive/30 data-[state=error]:bg-destructive/5 motion-reduce:transition-none focus-visible:outline-none focus-visible:shadow-kind-focus",
        className,
      )}
      {...props}
      onDragEnter={(event) => {
        onDragEnter?.(event);
        if (event.defaultPrevented || inactive || !event.dataTransfer.types.includes("Files"))
          return;
        event.preventDefault();
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (event.defaultPrevented || inactive || !event.dataTransfer.types.includes("Files"))
          return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event);
        if (event.defaultPrevented) return;
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setOver(false);
      }}
      onDrop={(event) => {
        onDrop?.(event);
        depth.current = 0;
        setOver(false);
        if (event.defaultPrevented || inactive || !event.dataTransfer.files.length) return;
        event.preventDefault();
        uploader.add(event.dataTransfer.files);
      }}
      onPaste={(event) => {
        onPaste?.(event);
        if (event.defaultPrevented || inactive || !paste || !event.clipboardData.files.length)
          return;
        event.preventDefault();
        uploader.add(event.clipboardData.files);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          !inactive &&
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          uploader.open();
        }
      }}
    >
      {children ?? (
        <div className="mx-auto flex max-w-sm flex-col items-center gap-2.5 text-center">
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center text-muted-foreground"
          >
            <Upload
              aria-hidden="true"
              focusable="false"
              strokeWidth={1.5}
              nonScalingStroke
              className="size-5"
            />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-ai-title font-medium">Drop files here</p>
            <p className="text-ai-description text-muted-foreground">
              Choose files from your device or drag them into this area.
            </p>
          </div>
          <UploaderTrigger disabled={inactive}>Choose files</UploaderTrigger>
        </div>
      )}
    </div>
  );
}
export type UploaderListProps = Omit<ComponentProps<"div">, "children"> & {
  children: (
    item: UploadItem,
    actions: { cancel: () => void; retry: () => void; remove: () => void; start: () => void },
  ) => ReactNode;
};
export function UploaderList({ children, className, ...props }: UploaderListProps) {
  const { items, cancel, retry, remove, start } = useUploader();
  return (
    <div
      data-slot="uploader-list"
      className={cn("flex min-w-0 flex-col gap-1.5 text-ai-label text-foreground", className)}
      {...props}
    >
      {items.map((item) => (
        <Fragment key={item.id}>
          {children(item, {
            cancel: () => cancel(item.id),
            retry: () => retry(item.id),
            remove: () => remove(item.id),
            start: () => start(item.id),
          })}
        </Fragment>
      ))}
    </div>
  );
}
export type UploaderAttachOptions = { drop?: boolean; paste?: boolean };
export function useUploaderAttach(
  target: RefObject<HTMLElement | null>,
  { drop = true, paste = true }: UploaderAttachOptions = {},
): { isDragOver: boolean } {
  const uploader = useUploader();
  const latest = useRef(uploader);
  latest.current = uploader;
  const [isDragOver, setOver] = useState(false);
  useEffect(() => {
    const element = target.current;
    if (!element) return;
    setOver(false);
    let depth = 0;
    const enter = (event: DragEvent) => {
      if (
        event.defaultPrevented ||
        latest.current.disabled ||
        !event.dataTransfer?.types.includes("Files")
      )
        return;
      event.preventDefault();
      depth += 1;
      setOver(true);
    };
    const over = (event: DragEvent) => {
      if (
        !event.defaultPrevented &&
        !latest.current.disabled &&
        event.dataTransfer?.types.includes("Files")
      ) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }
    };
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (!depth) setOver(false);
    };
    const receive = (event: DragEvent) => {
      depth = 0;
      setOver(false);
      if (event.defaultPrevented || latest.current.disabled || !event.dataTransfer?.files.length)
        return;
      event.preventDefault();
      latest.current.add(event.dataTransfer.files);
    };
    const clipboard = (event: ClipboardEvent) => {
      if (event.defaultPrevented || latest.current.disabled || !event.clipboardData?.files.length)
        return;
      event.preventDefault();
      latest.current.add(event.clipboardData.files);
    };
    if (drop) {
      element.addEventListener("dragenter", enter);
      element.addEventListener("dragover", over);
      element.addEventListener("dragleave", leave);
      element.addEventListener("drop", receive);
    }
    if (paste) element.addEventListener("paste", clipboard);
    return () => {
      element.removeEventListener("dragenter", enter);
      element.removeEventListener("dragover", over);
      element.removeEventListener("dragleave", leave);
      element.removeEventListener("drop", receive);
      element.removeEventListener("paste", clipboard);
    };
  }, [target, drop, paste]);
  return { isDragOver: !uploader.disabled && isDragOver };
}
export type CreateXhrUploaderOptions = {
  url: string;
  method?: string;
  field?: string;
  headers?: Record<string, string> | (() => Record<string, string>);
  withCredentials?: boolean;
  timeout?: number;
};
/** Creates a transport; no network request occurs until the returned function is called. */
export function createXhrUploader({
  url,
  method = "POST",
  field = "file",
  headers,
  withCredentials = false,
  timeout = 0,
}: CreateXhrUploaderOptions): UploaderFn {
  return ({ file, signal, onProgress }) =>
    new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Upload canceled.", "AbortError"));
        return;
      }
      const endpoint = safeUrl(url);
      if (!endpoint || /^(blob:|mailto:|tel:|#)/i.test(endpoint)) {
        reject(
          Object.assign(new Error("A relative or HTTP(S) upload endpoint is required."), {
            code: "invalid_url",
          }),
        );
        return;
      }
      const xhr = new XMLHttpRequest();
      let settled = false;
      const abort = () => {
        xhr.abort();
        finish(false, new DOMException("Upload canceled.", "AbortError"));
      };
      const finish = (ok: boolean, value: unknown) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", abort);
        xhr.onload = null;
        xhr.onerror = null;
        xhr.onabort = null;
        xhr.ontimeout = null;
        xhr.upload.onprogress = null;
        if (ok) resolve(value);
        else reject(value);
      };
      try {
        xhr.open(method, endpoint, true);
        xhr.withCredentials = withCredentials;
        xhr.timeout = Math.max(0, timeout);
        for (const [name, value] of Object.entries(
          typeof headers === "function" ? headers() : (headers ?? {}),
        ))
          xhr.setRequestHeader(name, value);
        xhr.upload.onprogress = (event) => {
          if (!settled && event.lengthComputable && event.total > 0)
            onProgress((event.loaded / event.total) * 100);
        };
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            finish(
              false,
              Object.assign(new Error(`HTTP ${xhr.status}`), { code: `http_${xhr.status}` }),
            );
            return;
          }
          let response: unknown;
          try {
            response = JSON.parse(xhr.responseText);
          } catch {
            response = { body: xhr.responseText };
          }
          finish(true, response);
        };
        xhr.onerror = () =>
          finish(false, Object.assign(new Error("Network error."), { code: "network" }));
        xhr.onabort = () => finish(false, new DOMException("Upload canceled.", "AbortError"));
        xhr.ontimeout = () =>
          finish(false, Object.assign(new Error("Upload timed out."), { code: "timeout" }));
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) {
          abort();
          return;
        }
        const body = new FormData();
        body.append(field, file);
        xhr.send(body);
      } catch (error) {
        finish(false, error);
      }
    });
}
