"use client";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid as mermaidPlugin } from "@streamdown/mermaid";
import { type ComponentProps, useMemo } from "react";
import { defaultRehypePlugins, Streamdown, type StreamdownProps } from "streamdown";
import { MarkdownCodePre } from "./markdown-code-block.js";
import { MarkdownRenderContext } from "./markdown-context.js";
import { markdownTableComponents } from "./markdown-table.js";
import { cn, safeUrl } from "./utils.js";
export type MarkdownProps = Omit<
  ComponentProps<"div">,
  keyof StreamdownProps | "children" | "onAnimationStart" | "onAnimationEnd" | "dir"
> &
  StreamdownProps & { children: string; streaming?: boolean | undefined };
const defaultUrlTransform = (url: string) => safeUrl(url) ?? "";
const defaultPlugins = { cjk, code, math, mermaid: mermaidPlugin };
/** Streaming Markdown boundary; custom plugins/components are trusted application code. */
export function Markdown({
  children,
  streaming = false,
  className,
  ref,
  components,
  mode = "streaming",
  dir,
  BlockComponent,
  parseMarkdownIntoBlocksFn,
  parseIncompleteMarkdown = true,
  normalizeHtmlIndentation,
  shikiTheme,
  mermaid,
  controls,
  isAnimating = streaming,
  animated = false,
  caret,
  plugins = defaultPlugins,
  remend,
  linkSafety,
  allowedTags,
  literalTagContent,
  translations,
  icons,
  prefix,
  onAnimationStart,
  onAnimationEnd,
  skipHtml = true,
  allowedElements,
  disallowedElements,
  allowElement,
  unwrapDisallowed,
  urlTransform = defaultUrlTransform,
  rehypePlugins,
  remarkPlugins,
  remarkRehypeOptions,
  ...props
}: MarkdownProps) {
  const renderConfiguration = useMemo(
    () => ({ plugins, components, translations, icons, controls, isAnimating }),
    [plugins, components, translations, icons, controls, isAnimating],
  );
  const effectiveComponents = useMemo(
    () => ({ pre: MarkdownCodePre, ...markdownTableComponents, ...components }),
    [components],
  );
  const effectiveRehypePlugins =
    rehypePlugins ??
    Object.entries(defaultRehypePlugins)
      .filter(([name]) => name === "sanitize" || (!skipHtml && name === "raw"))
      .map(([, plugin]) => plugin);
  const options = {
    components: effectiveComponents,
    mode,
    dir,
    BlockComponent,
    parseMarkdownIntoBlocksFn,
    parseIncompleteMarkdown,
    normalizeHtmlIndentation,
    shikiTheme,
    mermaid,
    controls,
    isAnimating,
    animated,
    caret,
    plugins,
    remend,
    linkSafety,
    allowedTags,
    literalTagContent,
    translations,
    icons,
    prefix,
    onAnimationStart,
    onAnimationEnd,
    skipHtml,
    allowedElements,
    disallowedElements,
    allowElement,
    unwrapDisallowed,
    urlTransform,
    rehypePlugins: effectiveRehypePlugins,
    remarkPlugins,
    remarkRehypeOptions,
  };
  // Avoid explicit undefineds at third-party exact-optional boundaries.
  const defined = Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as StreamdownProps;
  return (
    <div
      {...props}
      ref={ref}
      data-slot="markdown"
      data-streaming={isAnimating || undefined}
      className={cn(
        "min-w-0 max-w-[72ch] break-words text-ai-body text-foreground",
        "[&_p]:my-2.5 [&_p]:text-pretty [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:font-semibold",
        "[&_h1]:mb-2.5 [&_h1]:mt-5 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:leading-[1.3] [&_h1]:tracking-[-0.015em] [&_h1]:text-pretty [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:leading-[1.4] [&_h2]:tracking-[-0.01em] [&_h2]:text-pretty [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[0.9375rem] [&_h3]:font-semibold [&_h3]:leading-[1.5] [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-ai-body [&_h4]:font-semibold [&_h5]:my-3 [&_h5]:text-ai-body [&_h5]:font-semibold [&_h6]:my-3 [&_h6]:text-ai-body [&_h6]:font-semibold [&_h6]:text-muted-foreground",
        "[&_ul]:my-2.5 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-2.5 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:my-1 [&_li]:ps-0.5 [&_li]:marker:text-muted-foreground [&_li>ul]:my-2 [&_li>ol]:my-2 [&_li>p]:my-2 [&_li>input]:me-2 [&_li>input]:accent-primary",
        "[&_blockquote]:my-4 [&_blockquote]:border-s-2 [&_blockquote]:border-border/70 [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground [&_blockquote_p]:my-2 [&_hr]:my-5 [&_hr]:border-border/60",
        "[&_:is(a,[data-streamdown=link])]:rounded-sm [&_:is(a,[data-streamdown=link])]:text-link [&_:is(a,[data-streamdown=link])]:underline [&_:is(a,[data-streamdown=link])]:decoration-link/40 [&_:is(a,[data-streamdown=link])]:underline-offset-4 [&_:is(a,[data-streamdown=link])]:hover:decoration-link [&_:is(a,[data-streamdown=link])]:focus-visible:bg-secondary [&_:is(a,[data-streamdown=link])]:focus-visible:outline-none [&_:is(a,[data-streamdown=link])]:focus-visible:shadow-kind-focus",
        "[&_[data-streamdown=inline-code]]:font-mono [&_[data-streamdown=inline-code]]:rounded-md [&_[data-streamdown=inline-code]]:bg-inset [&_[data-streamdown=inline-code]]:px-1.5 [&_[data-streamdown=inline-code]]:py-0.5 [&_[data-streamdown=inline-code]]:text-ai-label [&_[data-streamdown=inline-code]]:font-medium",
        "[&_img]:my-5 [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img]:outline [&_img]:outline-1 [&_img]:-outline-offset-1 [&_img]:outline-black/10 dark:[&_img]:outline-white/10 [&_figcaption]:mt-2 [&_figcaption]:text-ai-description [&_figcaption]:text-muted-foreground",

        className,
      )}
    >
      <MarkdownRenderContext.Provider value={renderConfiguration}>
        <Streamdown {...defined} className="space-y-2.5">
          {children}
        </Streamdown>
      </MarkdownRenderContext.Provider>
    </div>
  );
}
