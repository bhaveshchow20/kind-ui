"use client";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Copy, Download } from "lucide-react";
import dynamic from "next/dynamic";
import { memo, type ReactNode, useCallback, useState } from "react";
import { filesFor, promptFor } from "@/lib/example-files.mjs";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

function Loading() {
  return (
    <p className="component-loading" role="status">
      Loading chart…
    </p>
  );
}
const components = {
  line: dynamic(() => import("@/examples/line/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  area: dynamic(() => import("@/examples/area/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  bar: dynamic(() => import("@/examples/bar/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  combo: dynamic(() => import("@/examples/combo/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  donut: dynamic(() => import("@/examples/donut/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  scatter: dynamic(() => import("@/examples/scatter/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  radar: dynamic(() => import("@/examples/radar/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  "radial-bar": dynamic(
    () => import("@/examples/radial-bar/example").then((m) => memo(m.Example)),
    {
      loading: Loading,
      ssr: false,
    },
  ),
  histogram: dynamic(() => import("@/examples/histogram/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  "box-plot": dynamic(() => import("@/examples/box-plot/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  waterfall: dynamic(() => import("@/examples/waterfall/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  sankey: dynamic(() => import("@/examples/sankey/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  heatmap: dynamic(() => import("@/examples/heatmap/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
};
export type ComponentId = keyof typeof components;
export interface ComponentBundle {
  id: ComponentId;
  title: string;
  settings: Record<string, unknown>;
  files: Record<string, string>;
  packageStatus: string;
  localPackage: boolean;
  version: string;
  acceptance: string;
}
export function ComponentPlayground({
  bundle,
  sourceCode,
}: {
  bundle: ComponentBundle;
  sourceCode?: ReactNode;
}) {
  const { id } = bundle;
  const [settings, setSettings] = useState(bundle.settings);
  const onChange = useCallback((next: Record<string, unknown>) => setSettings(next), []);
  const [file, setFile] = useState(`src/examples/${id}/example.tsx`);
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState("preview");
  const files: Record<string, string> = filesFor(bundle, settings);
  const Preview = components[id];
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied`);
    } catch {
      setStatus("Clipboard unavailable. Select the code to copy, or download the example.");
    }
  }
  async function download() {
    try {
      const { strToU8, zipSync } = await import("fflate");
      const entries: Record<string, Uint8Array> = Object.fromEntries(
        Object.entries(files).map(([name, body]) => [name, strToU8(body)]),
      );
      if (bundle.localPackage) {
        const response = await fetch("/examples/package/kind-ui-charts-0.0.0.tgz");
        if (!response.ok) throw new Error("Package download failed");
        entries["vendor/kind-ui-charts-0.0.0.tgz"] = new Uint8Array(await response.arrayBuffer());
      }
      const bytes = zipSync(entries);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `kind-ui-${id}-example.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Example downloaded with the selected settings");
    } catch {
      setStatus("Could not download the example. Try again after the package asset loads.");
    }
  }
  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className="component-workbench"
      data-component={id}
      id="component-preview"
    >
      <div className="playground-header">
        <TabsList aria-label={`${bundle.title} example`} className="preview-tabs">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <div className="playground-actions">
          <Button
            variant="ghost"
            size="sm"
            className="copy-prompt"
            onClick={() => copy(promptFor(bundle, settings, location.origin), "Prompt")}
          >
            {status === "Prompt copied" ? <Check size={14} /> : <Copy size={14} />}
            <span>{status === "Prompt copied" ? "Copied" : "Copy prompt"}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Download example"
            title="Download complete example"
            onClick={download}
          >
            <Download size={15} />
          </Button>
        </div>
      </div>
      <TabsContent value="preview" forceMount hidden={tab !== "preview"} className="preview-panel">
        <Preview onSettingsChange={onChange} />
      </TabsContent>
      <TabsContent value="usage" className="usage-panel">
        <h2>Run the example</h2>
        <p>Download the complete example, then run:</p>
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable code requires keyboard access. */}
        <pre tabIndex={0}>
          <code>{"npm ci\nnpm run dev\n# Verify with npm run build"}</code>
        </pre>
        <p className="package-note">
          This preview uses the included, unpublished package. The ZIP contains its exact tarball,
          dependencies, styles and data.
        </p>
        <h2>Use the component</h2>
        <div className="inline-code-action">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copy usage"
            onClick={() => copy(files["src/main.tsx"], "Usage")}
          >
            <Copy size={14} />
          </Button>
        </div>
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable code requires keyboard access. */}
        <pre tabIndex={0}>
          <code>{files["src/main.tsx"]}</code>
        </pre>
        <h2>Selected settings</h2>
        <p>Code, downloads and prompts use the options selected in Preview.</p>
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable code requires keyboard access. */}
        <pre tabIndex={0}>
          <code>{files[`src/examples/${id}/settings.ts`]}</code>
        </pre>
      </TabsContent>
      <TabsContent value="code" className="code-files">
        <div className="code-file-header">
          <Select.Root value={file} onValueChange={setFile}>
            <Select.Trigger aria-label="Source file" className="file-picker">
              <Select.Value />
              <ChevronDown size={14} />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                position="popper"
                sideOffset={6}
                className="select-content file-select"
              >
                <Select.Viewport>
                  {Object.keys(files).map((name) => (
                    <Select.Item key={name} value={name} className="select-item">
                      <Select.ItemText>{name}</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check size={14} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copy file"
            onClick={() => copy(files[file], "File")}
          >
            {status === "File copied" ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
        <div className="source-code">
          {sourceCode && file === `src/examples/${id}/example.tsx` ? (
            sourceCode
          ) : (
            /* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable code requires keyboard access. */
            <pre tabIndex={0}>
              <code>{files[file]}</code>
            </pre>
          )}
        </div>
        <p className="code-caption">
          Complete example source with public imports. Selected options are in settings.ts.
        </p>
      </TabsContent>
      <span role="status" className="sr-only">
        {status}
      </span>
    </Tabs>
  );
}
