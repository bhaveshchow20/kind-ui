"use client";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Copy } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { promptFor } from "@/lib/example-files.mjs";
import { previews } from "./previews";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export type ComponentId = keyof typeof previews;
export interface ComponentBundle {
  id: ComponentId;
  title: string;
  family: string;
  files: Record<string, string>;
  packageStatus: string;
  localPackage: boolean;
  version: string;
  acceptance: string;
  variants?: Record<string, { label: string; source: string }>;
  variantControl?: string;
  defaultVariant?: string;
  dataAlternative?: {
    caption: string;
    columns: Record<string, string>;
    rows: Record<string, string | number>[];
  };
}
export function ComponentPlayground({
  bundle,
  sourceCode,
  variantCode,
}: {
  bundle: ComponentBundle;
  sourceCode?: ReactNode;
  variantCode?: Record<string, ReactNode>;
}) {
  const { id } = bundle;
  const [variant, setVariant] = useState(bundle.defaultVariant);
  const controlId = useId();
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState("preview");
  const Preview = previews[id];
  const dataAlternative = bundle.dataAlternative;
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied`);
    } catch {
      setStatus("Clipboard unavailable. Select the code to copy.");
    }
  }
  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className="component-workbench line-workbench"
      data-component={id}
      id={id !== bundle.family ? `example-${id}` : "component-preview"}
    >
      <div className="playground-header">
        <TabsList aria-label={`${bundle.title} component`} className="preview-tabs">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        {bundle.variants && (
          <Select.Root value={variant} onValueChange={setVariant}>
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
              <Select.Content position="popper" sideOffset={6} className="select-content">
                <Select.Viewport>
                  {Object.entries(bundle.variants).map(([value, option]) => (
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
            onClick={() => copy(promptFor(bundle, {}, location.origin, variant), "Prompt")}
          >
            {status === "Prompt copied" ? <Check size={14} /> : <Copy size={14} />}
            <span>{status === "Prompt copied" ? "Copied" : "Copy prompt"}</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="preview"
        forceMount
        aria-hidden={tab !== "preview"}
        data-inactive={tab !== "preview"}
        inert={tab !== "preview"}
        className="preview-panel"
      >
        <div className="chart-example not-prose">
          <Preview variant={variant} />
        </div>
        {dataAlternative && (
          <table className="sr-only" aria-label={`${bundle.title} data`}>
            <caption>{dataAlternative.caption}</caption>
            <thead>
              <tr>
                {Object.values(dataAlternative.columns).map((label) => (
                  <th scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataAlternative.rows.map((row, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Build-time snapshot order is fixed; preserve duplicate observations.
                <tr key={index}>
                  {Object.keys(dataAlternative.columns).map((key, index) =>
                    index === 0 ? (
                      <th scope="row" key={key}>
                        {row[key]}
                      </th>
                    ) : (
                      <td key={key}>{row[key]}</td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TabsContent>
      <TabsContent value="code" forceMount hidden={tab !== "code"} className="code-files">
        {variant && variantCode ? variantCode[variant] : sourceCode}
      </TabsContent>
      <span role="status" className="sr-only">
        {status}
      </span>
    </Tabs>
  );
}
