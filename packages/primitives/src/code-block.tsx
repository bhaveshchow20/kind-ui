"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { createContext, use, useEffect, useRef, useState } from "react";
import { Button, type ButtonProps } from "./button.js";
import { cn } from "./utils.js";

export type CodeBlockToken = {
  content: string;
  color?: string | undefined;
  bgColor?: string | undefined;
  htmlStyle?: Record<string, string> | undefined;
  htmlAttrs?: Record<string, string> | undefined;
};

export type CodeBlockProps = ComponentProps<"div"> & {
  code: string;
  language?: string | undefined;
  filename?: string | undefined;
  tokens?: CodeBlockToken[][] | undefined;
  startLine?: number | undefined;
  lineNumbers?: boolean | undefined;
  wrap?: boolean | undefined;
};

type CodeBlockContextValue = Pick<CodeBlockProps, "code" | "language" | "filename" | "tokens"> & {
  startLine: number;
  lineNumbers: boolean;
  wrap: boolean;
};

const CodeBlockContext = createContext<CodeBlockContextValue | null>(null);

function useCodeBlock() {
  const context = use(CodeBlockContext);
  if (!context) throw new Error("CodeBlock parts must be used within CodeBlock.");
  return context;
}

/** A plain or tokenized code surface. Explicit children compose the shared parts. */
export function CodeBlock({
  code,
  language,
  filename,
  tokens,
  startLine = 1,
  lineNumbers = true,
  wrap = true,
  children,
  className,
  ...props
}: CodeBlockProps) {
  const firstLine = Number.isInteger(startLine) && startLine > 0 ? startLine : 1;
  return (
    <CodeBlockContext.Provider
      value={{ code, language, filename, tokens, startLine: firstLine, lineNumbers, wrap }}
    >
      <div
        data-slot="code-block"
        data-language={language}
        className={cn(
          "min-w-0 max-w-full overflow-hidden rounded-[var(--kind-compact-radius)] border border-border/60 bg-inset text-foreground",
          className,
        )}
        {...props}
      >
        {children === undefined ? (
          <>
            <CodeBlockHeader>
              <CodeBlockLanguage />
              <CodeBlockActions>
                <CodeBlockDownloadButton />
                <CodeBlockCopyButton />
              </CodeBlockActions>
            </CodeBlockHeader>
            <CodeBlockContent />
          </>
        ) : (
          children
        )}
      </div>
    </CodeBlockContext.Provider>
  );
}

export type CodeBlockHeaderProps = ComponentProps<"div">;
export function CodeBlockHeader({ className, ...props }: CodeBlockHeaderProps) {
  return (
    <div
      data-slot="code-block-header"
      className={cn(
        "flex h-10 min-w-0 items-center justify-between gap-3 px-3 pointer-coarse:h-12",
        className,
      )}
      {...props}
    />
  );
}

export type CodeBlockLanguageProps = ComponentProps<"span">;
export function CodeBlockLanguage({ className, children, ...props }: CodeBlockLanguageProps) {
  const { language } = useCodeBlock();
  return (
    <span
      data-slot="code-block-language"
      className={cn(
        "min-w-0 truncate font-mono text-kind-description text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children === undefined ? language || "text" : children}
    </span>
  );
}

export type CodeBlockActionsProps = ComponentProps<"div">;
export function CodeBlockActions({ className, ...props }: CodeBlockActionsProps) {
  return (
    <div
      data-slot="code-block-actions"
      className={cn("flex shrink-0 items-center gap-1", className)}
      {...props}
    />
  );
}

const tokenGlobalAttributes = new Map(
  [
    "accessKey",
    "autoCapitalize",
    "autoCorrect",
    "contentEditable",
    "contextMenu",
    "dir",
    "draggable",
    "enterKeyHint",
    "hidden",
    "id",
    "inert",
    "inputMode",
    "is",
    "itemID",
    "itemProp",
    "itemRef",
    "itemScope",
    "itemType",
    "lang",
    "nonce",
    "part",
    "popover",
    "role",
    "slot",
    "spellCheck",
    "tabIndex",
    "title",
    "translate",
    "about",
    "content",
    "datatype",
    "inlist",
    "prefix",
    "property",
    "rel",
    "resource",
    "rev",
    "typeof",
    "vocab",
  ].map((name) => [name.toLowerCase(), name]),
);
const tokenBooleanAttributes = new Set(["hidden", "inert", "itemScope"]);

function tokenPresentation(token: CodeBlockToken) {
  const style: Record<string, string> = {};
  if (token.color) style["--sdm-c"] = token.color;
  if (token.bgColor) style["--sdm-tbg"] = token.bgColor;
  for (const [property, value] of Object.entries(token.htmlStyle ?? {})) {
    const name =
      property === "color"
        ? "--sdm-c"
        : property === "background-color" || property === "backgroundColor"
          ? "--sdm-tbg"
          : property.startsWith("--")
            ? property
            : property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    style[name] = value;
  }
  const attributes: Record<string, string | boolean> = {};
  for (const [name, value] of Object.entries(token.htmlAttrs ?? {})) {
    if (/^(?:data|aria)-[a-z0-9-]+$/.test(name)) {
      attributes[name] = value;
      continue;
    }
    const nativeName = tokenGlobalAttributes.get(name.toLowerCase());
    if (nativeName) {
      attributes[nativeName] = tokenBooleanAttributes.has(nativeName)
        ? value !== "false"
        : nativeName === "contentEditable" && value === "false"
          ? false
          : value;
    }
  }
  return {
    ...attributes,
    className: cn(
      "text-[var(--sdm-c,inherit)] dark:text-[var(--shiki-dark,var(--sdm-c,inherit))] bg-[var(--sdm-tbg,transparent)] dark:bg-[var(--shiki-dark-bg,var(--sdm-tbg,transparent))]",
      token.htmlAttrs?.class,
      token.htmlAttrs?.className,
    ),
    style: style as CSSProperties,
  };
}

export type CodeBlockContentProps = ComponentProps<"div"> & {
  /** Theme or syntax styles applied directly to the code surface. */
  preStyle?: CSSProperties | undefined;
};
export function CodeBlockContent({
  className,
  children,
  preStyle,
  ...props
}: CodeBlockContentProps) {
  const { code, language, tokens, startLine, lineNumbers, wrap } = useCodeBlock();
  const lines =
    tokens ??
    code
      .replace(/\n+$/, "")
      .split("\n")
      .map((content) => [{ content }]);
  const lineDigits = String(startLine + Math.max(0, lines.length - 1)).length;
  const codeStyle = {
    counterReset: `line ${startLine - 1}`,
    "--kind-code-gutter": `max(2.5rem, calc(${lineDigits}ch + 0.75rem))`,
  } as CSSProperties;
  return (
    // biome-ignore lint/a11y/useSemanticElements: Keep the public native div and its ref contract for the scroll region.
    <div
      data-slot="code-block-content"
      data-language={language}
      data-wrap={wrap}
      data-line-numbers={lineNumbers}
      tabIndex={wrap ? undefined : 0}
      role="region"
      aria-label="Code"
      className={cn(
        "min-w-0 max-w-full border-t border-border/60 bg-background text-kind-label focus-visible:outline-none focus-visible:shadow-kind-focus",
        wrap ? "overflow-hidden" : "overflow-x-auto overscroll-x-contain",
        className,
      )}
      {...props}
    >
      {children === undefined ? (
        <pre
          data-slot="code-block-pre"
          style={preStyle}
          className={cn(
            "m-0 bg-[var(--sdm-bg,transparent)] text-[var(--sdm-fg,inherit)] dark:bg-[var(--shiki-dark-bg,var(--sdm-bg,transparent))] dark:text-[var(--shiki-dark,var(--sdm-fg,inherit))] px-3 py-3 font-mono text-kind-label leading-6",
            wrap
              ? "whitespace-pre-wrap [overflow-wrap:anywhere]"
              : "min-w-full w-max whitespace-pre",
          )}
        >
          <code className="block font-[inherit] [counter-increment:line_0]" style={codeStyle}>
            {(lines.length ? lines : [[]]).map((line, lineIndex) => (
              <span
                // Lines deliberately retain position identity while code streams in.
                // biome-ignore lint/suspicious/noArrayIndexKey: A line is a positional code row.
                key={lineIndex}
                className={cn(
                  "block relative min-h-[1lh]",
                  lineNumbers &&
                    "ps-[var(--kind-code-gutter)] [counter-increment:line] before:absolute before:start-0 before:top-0 before:w-[calc(var(--kind-code-gutter)-0.75rem)] before:select-none before:text-right before:font-mono before:text-muted-foreground/60 before:tabular-nums before:content-[counter(line)]",
                )}
              >
                {line.map((token, tokenIndex) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Tokens have no stable identity beyond their position.
                  <span key={tokenIndex} {...tokenPresentation(token)}>
                    {token.content}
                  </span>
                ))}
              </span>
            ))}
          </code>
        </pre>
      ) : (
        children
      )}
    </div>
  );
}

const actionClassName =
  "size-7 min-h-7 min-w-7 rounded-md p-0 text-muted-foreground [&_svg]:size-3.5 pointer-coarse:size-11 pointer-coarse:min-h-11 pointer-coarse:min-w-11";

function ActionIcon({ kind }: { kind: "copy" | "check" | "download" }) {
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
      ) : kind === "check" ? (
        <path d="m5 12 4 4L19 6" />
      ) : (
        <path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4" />
      )}
    </svg>
  );
}

function actionError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

export type CodeBlockCopyButtonProps = Omit<ButtonProps, "onCopy" | "onError"> & {
  onCopy?: (() => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
  timeout?: number | undefined;
  copiedChildren?: ReactNode;
  copiedLabel?: string | undefined;
};

export function CodeBlockCopyButton({
  children,
  copiedChildren,
  copiedLabel = "Copied to clipboard",
  timeout = 2000,
  onCopy,
  onError,
  onClick,
  className,
  disabled,
  ...props
}: CodeBlockCopyButtonProps) {
  const { code } = useCodeBlock();
  const [feedback, setFeedback] = useState<{ code: string; state: "copied" | "error" } | null>(
    null,
  );
  const latestCode = useRef(code);
  latestCode.current = code;
  const request = useRef(0);
  const mounted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current += 1;
      clearTimeout(timer.current);
    };
  }, []);
  // Code changes invalidate pending clipboard writes and previous feedback.
  // biome-ignore lint/correctness/useExhaustiveDependencies: This is an explicit reset when the source code changes.
  useEffect(() => {
    request.current += 1;
    clearTimeout(timer.current);
    setFeedback(null);
  }, [code]);
  const state = feedback?.code === code ? feedback.state : undefined;
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Copy Code"
        data-slot="code-block-copy-button"
        data-state={state ?? "idle"}
        contentKey={state === "copied" ? "copied" : "copy"}
        {...props}
        disabled={disabled}
        className={(buttonState) =>
          cn(actionClassName, typeof className === "function" ? className(buttonState) : className)
        }
        onClick={async (event) => {
          onClick?.(event);
          if (event.defaultPrevented || disabled) return;
          const currentRequest = ++request.current;
          const currentCode = code;
          clearTimeout(timer.current);
          setFeedback(null);
          const isCurrent = () =>
            mounted.current &&
            request.current === currentRequest &&
            latestCode.current === currentCode;
          try {
            if (!navigator.clipboard?.writeText) throw new Error("Clipboard is unavailable.");
            await navigator.clipboard.writeText(currentCode);
          } catch (error) {
            if (!isCurrent()) return;
            setFeedback({ code: currentCode, state: "error" });
            onError?.(actionError(error));
            return;
          }
          if (!isCurrent()) return;
          setFeedback({ code: currentCode, state: "copied" });
          timer.current = setTimeout(
            () => {
              if (isCurrent()) setFeedback(null);
            },
            Math.max(0, timeout),
          );
          onCopy?.();
        }}
      >
        {state === "copied"
          ? (copiedChildren ?? <ActionIcon kind="check" />)
          : (children ?? <ActionIcon kind="copy" />)}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied" ? copiedLabel : state === "error" ? "Unable to copy code" : ""}
      </span>
    </>
  );
}

const languageExtensions: Readonly<Record<string, string>> = {
  javascript: "js",
  javascriptreact: "jsx",
  typescript: "ts",
  typescriptreact: "tsx",
  python: "py",
  ruby: "rb",
  rust: "rs",
  golang: "go",
  csharp: "cs",
  "c#": "cs",
  "c++": "cpp",
  shell: "sh",
  shellscript: "sh",
  bash: "sh",
  zsh: "sh",
  powershell: "ps1",
  pwsh: "ps1",
  kotlin: "kt",
  markdown: "md",
  plaintext: "txt",
  text: "txt",
  objectivec: "m",
  "objective-c": "m",
  dockerfile: "dockerfile",
  makefile: "makefile",
};
const codeFileExtensions = new Set([
  "js",
  "jsx",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "mts",
  "cts",
  "py",
  "rb",
  "rs",
  "go",
  "cs",
  "c",
  "h",
  "cpp",
  "hpp",
  "cc",
  "swift",
  "kt",
  "kts",
  "java",
  "sh",
  "ps1",
  "bat",
  "php",
  "pl",
  "r",
  "lua",
  "ex",
  "exs",
  "erl",
  "scala",
  "clj",
  "cljs",
  "fs",
  "fsx",
  "hs",
  "m",
  "mm",
  "sql",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "xml",
  "svg",
  "json",
  "jsonc",
  "yaml",
  "yml",
  "toml",
  "ini",
  "md",
  "mdx",
  "tex",
  "vue",
  "svelte",
  "graphql",
  "gql",
  "proto",
  "diff",
  "txt",
  "dockerfile",
  "makefile",
]);

function codeDownloadFilename(filename: string | undefined, language: string | undefined) {
  if (filename) return filename;
  const normalized = language?.trim().toLowerCase() ?? "";
  const alias = Object.hasOwn(languageExtensions, normalized)
    ? languageExtensions[normalized]
    : undefined;
  const extension = alias ?? (codeFileExtensions.has(normalized) ? normalized : "txt");
  return `file.${extension}`;
}

export type CodeBlockDownloadButtonProps = Omit<ButtonProps, "onError"> & {
  filename?: string | undefined;
  onDownload?: (() => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
};

export function CodeBlockDownloadButton({
  filename,
  onDownload,
  onError,
  onClick,
  children,
  className,
  disabled,
  ...props
}: CodeBlockDownloadButtonProps) {
  const context = useCodeBlock();
  const [failed, setFailed] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: A new code sample clears the previous download failure.
  useEffect(() => setFailed(false), [context.code]);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Download file"
        data-slot="code-block-download-button"
        {...props}
        disabled={disabled}
        className={(buttonState) =>
          cn(actionClassName, typeof className === "function" ? className(buttonState) : className)
        }
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || disabled) return;
          setFailed(false);
          let url: string | undefined;
          try {
            url = URL.createObjectURL(
              new Blob([context.code], { type: "text/plain;charset=utf-8" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = codeDownloadFilename(filename || context.filename, context.language);
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
          onDownload?.();
        }}
      >
        {children ?? <ActionIcon kind="download" />}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {failed ? "Unable to download code" : ""}
      </span>
    </>
  );
}
