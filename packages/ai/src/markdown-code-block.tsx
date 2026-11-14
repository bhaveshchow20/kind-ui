"use client";

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  CodeBlockHeader,
  CodeBlockLanguage,
} from "@kind-ui/primitives/code-block";
import {
  type ComponentProps,
  type CSSProperties,
  cloneElement,
  createElement,
  isValidElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type CodeHighlighterPlugin,
  defaultTranslations,
  type ExtraProps,
  StreamdownContext,
  useIsCodeFenceIncomplete,
} from "streamdown";
import { MarkdownRenderContext } from "./markdown-context.js";

export { MarkdownRenderContext as MarkdownCodeBlockContext } from "./markdown-context.js";

type HighlightResult = NonNullable<ReturnType<CodeHighlighterPlugin["highlight"]>>;
type HighlightLanguage = Parameters<CodeHighlighterPlugin["supportsLanguage"]>[0];
type CodeChildProps = ComponentProps<"code"> &
  ExtraProps & {
    "data-block"?: string;
  };

function sourceText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (isValidElement<{ children?: ReactNode }>(children))
    return sourceText(children.props.children);
  return "";
}

/** Adapts ordinary parsed fences; custom renderers retain their existing ownership. */
export function MarkdownCodePre({ children }: ComponentProps<"pre">) {
  const configuration = useContext(MarkdownRenderContext);
  const incomplete = useIsCodeFenceIncomplete();
  if (!isValidElement<CodeChildProps>(children)) return <>{children}</>;
  const props = children.props;
  const language = props.className?.match(/language-([^\s]+)/)?.[1] ?? "";
  const renderer = configuration.plugins?.renderers?.some(({ language: languages }) =>
    typeof languages === "string" ? languages === language : languages.includes(language),
  );
  const CustomCode = configuration.components?.code;
  if (typeof CustomCode === "string") {
    const { node: _node, ...nativeProps } = props;
    return createElement(CustomCode, { ...nativeProps, "data-block": "true" });
  }
  if (CustomCode) return <CustomCode {...props} data-block="true" />;
  if (renderer || (language === "mermaid" && configuration.plugins?.mermaid))
    return cloneElement(children, { "data-block": "true" });
  const metadata = props.node?.properties?.metastring;
  const start = typeof metadata === "string" ? metadata.match(/startLine=(\d+)/)?.[1] : undefined;
  const startLine = start ? Number.parseInt(start, 10) : 1;
  return (
    <MarkdownFence
      code={sourceText(props.children)}
      language={language}
      startLine={Number.isSafeInteger(startLine) && startLine >= 1 ? startLine : 1}
      className={props.className}
      incomplete={incomplete}
    />
  );
}

function MarkdownFence({
  code,
  language,
  startLine,
  className,
  incomplete,
}: {
  code: string;
  language: string;
  startLine: number;
  className: string | undefined;
  incomplete: boolean;
}) {
  const configuration = useContext(MarkdownRenderContext);
  const context = useContext(StreamdownContext);
  const plugin = configuration.plugins?.code;
  const themes = context.shikiTheme;
  const source = code.replace(/\n+$/, "");
  const [highlight, setHighlight] = useState<{
    source: string;
    language: string;
    plugin: CodeHighlighterPlugin;
    themes: typeof themes;
    result: HighlightResult;
  } | null>(null);
  useEffect(() => {
    // Unknown languages remain readable plaintext. The plugin's own language
    // guard validates its narrower language type before requesting highlighting.
    if (!plugin) return;
    let active = true;
    const accept = (result: HighlightResult) => {
      if (active) setHighlight({ source, language, plugin, themes, result });
    };
    try {
      if (!plugin.supportsLanguage(language as HighlightLanguage)) return;
      const result = plugin.highlight(
        { code: source, language: language as HighlightLanguage, themes },
        accept,
      );
      if (result) accept(result);
    } catch {
      // A failed optional highlighter must leave the original code usable.
    }
    return () => {
      active = false;
    };
  }, [source, language, plugin, themes]);
  const result =
    highlight?.source === source &&
    highlight.language === language &&
    highlight.plugin === plugin &&
    highlight.themes === themes
      ? highlight.result
      : undefined;
  const contentStyle = useMemo(() => {
    const style: Record<string, string> = {};
    const declarations = (source: string) => {
      for (const declaration of source.split(";")) {
        const separator = declaration.indexOf(":");
        if (separator < 0) continue;
        const key = declaration.slice(0, separator).trim();
        const property =
          key === "color"
            ? "--sdm-fg"
            : key === "background-color"
              ? "--sdm-bg"
              : key.startsWith("--")
                ? key
                : key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
        if (property) style[property] = declaration.slice(separator + 1).trim();
      }
    };
    for (const [name, value] of [
      ["--sdm-bg", result?.bg],
      ["--sdm-fg", result?.fg],
    ]) {
      if (!name || !value) continue;
      // Theme values may carry appended custom-property declarations.
      const separator = value.indexOf(";");
      style[name] = separator < 0 ? value : value.slice(0, separator);
      if (separator >= 0) declarations(value.slice(separator + 1));
    }
    if (result?.rootStyle) declarations(result.rootStyle);
    return style as CSSProperties;
  }, [result]);
  const controls = configuration.controls ?? context.controls;
  const codeControls = typeof controls === "boolean" ? controls : controls.code;
  const copy = typeof codeControls === "boolean" ? codeControls : codeControls?.copy !== false;
  const download =
    typeof codeControls === "boolean" ? codeControls : codeControls?.download !== false;
  const disabled = configuration.isAnimating ?? context.isAnimating;
  const labels = { ...defaultTranslations, ...configuration.translations };
  const CopyIcon = configuration.icons?.CopyIcon;
  const CheckIcon = configuration.icons?.CheckIcon;
  const DownloadIcon = configuration.icons?.DownloadIcon;
  return (
    <CodeBlock
      code={code}
      language={language}
      startLine={startLine}
      tokens={result?.tokens}
      data-incomplete={incomplete || undefined}
      className="my-4"
    >
      <CodeBlockHeader>
        <CodeBlockLanguage>{language}</CodeBlockLanguage>
        {(copy || download) && (
          <CodeBlockActions>
            {download && (
              <CodeBlockDownloadButton disabled={disabled} aria-label={labels.downloadFile}>
                {DownloadIcon ? <DownloadIcon aria-hidden="true" /> : undefined}
              </CodeBlockDownloadButton>
            )}
            {copy && (
              <CodeBlockCopyButton
                disabled={disabled}
                aria-label={labels.copyCode}
                copiedLabel={labels.copied}
                copiedChildren={CheckIcon ? <CheckIcon aria-hidden="true" /> : undefined}
              >
                {CopyIcon ? <CopyIcon aria-hidden="true" /> : undefined}
              </CodeBlockCopyButton>
            )}
          </CodeBlockActions>
        )}
      </CodeBlockHeader>
      <CodeBlockContent className={className} preStyle={contentStyle} />
    </CodeBlock>
  );
}
