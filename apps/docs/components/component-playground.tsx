"use client";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Copy } from "lucide-react";
import { type ReactNode, useCallback, useId, useState } from "react";
import type { ComponentBundleData } from "@/lib/component-bundles.server.mjs";
import { promptFor } from "@/lib/example-files.mjs";
import { PreviewCode } from "./preview-code";
import { previews } from "./previews";
import { Button } from "./ui/button";

export type ComponentId = keyof typeof previews;
export type ComponentBundle = ComponentBundleData & { id: ComponentId };
export function ComponentPlayground({
  bundle,
  sourceCode,
  variantCode,
  fixedVariant,
  instance,
}: {
  bundle: ComponentBundle;
  sourceCode?: ReactNode;
  variantCode?: Record<string, ReactNode>;
  fixedVariant?: string;
  instance?: string;
}) {
  const { id } = bundle;
  const [variant, setVariant] = useState(fixedVariant ?? bundle.defaultVariant);
  const options = Object.entries(bundle.variants ?? {}).filter(([value]) => value !== "loading");
  const controlId = useId();
  const [status, setStatus] = useState("");
  const Preview = previews[id];
  const inertSelectBackground = useCallback((content: HTMLDivElement | null) => {
    if (!content || !document.body.contains(content)) return;
    const siblings: Array<{ node: HTMLElement; inert: boolean }> = [];
    let current: HTMLElement = content;
    while (current.parentElement) {
      for (const sibling of current.parentElement.children) {
        if (sibling === current || !(sibling instanceof HTMLElement)) continue;
        siblings.push({ node: sibling, inert: sibling.inert });
        sibling.inert = true;
      }
      current = current.parentElement;
      if (current === document.body) break;
    }
    return () => {
      for (const { node, inert } of siblings) node.inert = inert;
    };
  }, []);
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(
        new CustomEvent("kind-ui-copy", { detail: label === "Prompt" ? "prompt" : "code" }),
      );
      setStatus(`${label} copied`);
    } catch {
      setStatus("Clipboard unavailable. Select the code to copy.");
    }
  }
  return (
    <>
      <PreviewCode
        title={bundle.title}
        className="line-workbench"
        data-component={
          instance ? `${id}-${instance}` : fixedVariant === "loading" ? `${id}-loading` : id
        }
        data-state={fixedVariant === "loading" ? "loading" : "ready"}
        id={
          instance
            ? `example-${id}-${instance}`
            : fixedVariant
              ? `example-${id}-${fixedVariant}`
              : id !== bundle.family
                ? `example-${id}`
                : "component-preview"
        }
        controls={
          <>
            {!fixedVariant && options.length > 1 && (
              <Select.Root
                {...(variant === undefined ? {} : { value: variant })}
                onValueChange={setVariant}
              >
                <Select.Trigger
                  id={controlId}
                  aria-label={bundle.variantControl}
                  className="line-variant-trigger"
                >
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown size={14} aria-hidden="true" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content
                    ref={inertSelectBackground}
                    position="popper"
                    sideOffset={6}
                    className="select-content"
                  >
                    <Select.Viewport>
                      {options.map(([value, option]) => (
                        <Select.Item key={value} value={value} className="select-item">
                          <Select.ItemText>{option.label}</Select.ItemText>
                          <Select.ItemIndicator>
                            <Check size={14} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            )}
            <div className="playground-actions">
              <Button
                variant="ghost"
                size="sm"
                className="copy-prompt"
                aria-label={status === "Prompt copied" ? "Copied" : "Copy prompt"}
                onClick={() => copy(promptFor(bundle, {}, variant), "Prompt")}
              >
                {status === "Prompt copied" ? <Check size={14} /> : <Copy size={14} />}
                <span>{status === "Prompt copied" ? "Copied" : "Copy prompt"}</span>
              </Button>
            </div>
          </>
        }
        preview={
          <div className="chart-example not-prose">
            <Preview {...(variant === undefined ? {} : { variant })} />
          </div>
        }
        code={variant && variantCode ? variantCode[variant] : sourceCode}
      />
      <span role="status" className="sr-only">
        {status}
      </span>
    </>
  );
}
