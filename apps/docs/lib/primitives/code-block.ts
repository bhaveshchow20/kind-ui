import type { ApiRow } from "@/components/api-table";

export const api = {
  CodeBlock: [
    {
      name: "code",
      type: "string",
      default: "Required",
      description: "Source text used for rendering, copying and downloading.",
    },
    {
      name: "language",
      type: "string",
      default: "—",
      description: "Language label and fallback download extension; does not run a highlighter.",
    },
    {
      name: "filename",
      type: "string",
      default: "—",
      description: "Default filename for the download action.",
    },
    {
      name: "tokens",
      type: "CodeBlockToken[][]",
      default: "—",
      description: "Precomputed lines of syntax tokens; replaces plain-text rendering.",
    },
    {
      name: "startLine",
      type: "number",
      default: "1",
      description: "First line number. Invalid or nonpositive integers fall back to 1.",
    },
    {
      name: "lineNumbers",
      type: "boolean",
      default: "true",
      description: "Show the line-number gutter.",
    },
    {
      name: "wrap",
      type: "boolean",
      default: "true",
      description: "Wrap long lines; false enables a focusable horizontal scroll region.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "Header, actions and content",
      description:
        "Explicit parts replace the automatic composition; null intentionally renders none.",
    },
    {
      name: "className / ref",
      type: "string / Ref<HTMLDivElement>",
      default: "—",
      description: "Style or access the native outer div. Native div attributes are supported.",
    },
  ],
  CodeBlockHeader: [
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Header contents, usually a language label and actions.",
    },
    {
      name: "className / ref",
      type: "string / Ref<HTMLDivElement>",
      default: "—",
      description: "Style or access the header div; native div attributes are supported.",
    },
  ],
  CodeBlockLanguage: [
    {
      name: "children",
      type: "ReactNode",
      default: 'language or "text"',
      description: "Override the visible label, for example with a filename.",
    },
    {
      name: "className / ref",
      type: "string / Ref<HTMLSpanElement>",
      default: "—",
      description: "Style or access the native label span.",
    },
  ],
  CodeBlockActions: [
    {
      name: "children",
      type: "ReactNode",
      default: "—",
      description: "Copy, download or consumer-owned actions in a compact row.",
    },
    {
      name: "className / ref",
      type: "string / Ref<HTMLDivElement>",
      default: "—",
      description: "Style or access the native action div.",
    },
  ],
  CodeBlockContent: [
    {
      name: "children",
      type: "ReactNode",
      default: "Rendered code",
      description: "Override the generated pre/code contents.",
    },
    {
      name: "preStyle",
      type: "CSSProperties",
      default: "—",
      description: "Styles applied to the generated pre, including highlighter theme variables.",
    },
    {
      name: "aria-label",
      type: "string",
      default: '"Code"',
      description: "Accessible name for the scroll region.",
    },
    {
      name: "className / ref",
      type: "string / Ref<HTMLDivElement>",
      default: "—",
      description: "Style or access the content region; native div attributes are supported.",
    },
  ],
  CodeBlockCopyButton: [
    {
      name: "onCopy",
      type: "() => void",
      default: "—",
      description: "Called after a successful clipboard write for the current code.",
    },
    {
      name: "onError",
      type: "(error: Error) => void",
      default: "—",
      description: "Called if copying fails or the Clipboard API is unavailable.",
    },
    {
      name: "timeout",
      type: "number",
      default: "2000",
      description: "Duration of copied feedback in milliseconds.",
    },
    {
      name: "children / copiedChildren",
      type: "ReactNode",
      default: "Copy / check icons",
      description: "Contents for idle and copied states.",
    },
    {
      name: "copiedLabel",
      type: "string",
      default: '"Copied to clipboard"',
      description: "Live announcement after a successful copy.",
    },
    {
      name: "disabled / loading",
      type: "boolean",
      default: "false",
      description: "Prevent activation using the Button contract.",
    },
    {
      name: "Button props",
      type: "ButtonProps except onCopy and onError",
      default: 'variant="ghost", size="icon-sm"',
      description: "Also accepts Button styling, render, refs and event handlers.",
    },
  ],
  CodeBlockDownloadButton: [
    {
      name: "filename",
      type: "string",
      default: "CodeBlock filename or file.<extension>",
      description:
        "Override the download filename. The fallback extension follows language or uses txt.",
    },
    {
      name: "onDownload",
      type: "() => void",
      default: "—",
      description: "Called after starting the browser download.",
    },
    {
      name: "onError",
      type: "(error: Error) => void",
      default: "—",
      description: "Called when creating or starting the download fails.",
    },
    {
      name: "children",
      type: "ReactNode",
      default: "Download icon",
      description: "Override the button contents.",
    },
    {
      name: "disabled / loading",
      type: "boolean",
      default: "false",
      description: "Prevent activation using the Button contract.",
    },
    {
      name: "Button props",
      type: "ButtonProps except onError",
      default: 'variant="ghost", size="icon-sm"',
      description: "Also accepts Button styling, render, refs and event handlers.",
    },
  ],
  CodeBlockToken: [
    {
      name: "content",
      type: "string",
      default: "Required",
      description: "Literal token text; rendered as text rather than HTML.",
    },
    {
      name: "color / bgColor",
      type: "string",
      default: "Inherited / transparent",
      description: "Token foreground and background colors.",
    },
    {
      name: "htmlStyle",
      type: "Record<string, string>",
      default: "—",
      description: "Highlighter styles, including custom properties and dark-theme variables.",
    },
    {
      name: "htmlAttrs",
      type: "Record<string, string>",
      default: "—",
      description:
        "Supported global, class, data and aria attributes; event handlers are not forwarded.",
    },
  ],
} satisfies Record<string, ApiRow[]>;
