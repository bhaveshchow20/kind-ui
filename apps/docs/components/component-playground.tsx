"use client";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Copy, Download } from "lucide-react";
import dynamic from "next/dynamic";
import { memo, type ReactNode, useCallback, useId, useState } from "react";
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
  line: dynamic(() => import("@/examples/line/example").then((m) => memo(m.VisitorTrendChart)), {
    loading: Loading,
    ssr: false,
  }),
  "line-smooth": dynamic(
    () => import("@/examples/line-smooth/example").then((m) => memo(m.VisitorCurveChart)),
    { loading: Loading, ssr: false },
  ),
  "line-comparison": dynamic(
    () => import("@/examples/line-comparison/example").then((m) => memo(m.RevenueComparisonChart)),
    { loading: Loading, ssr: false },
  ),
  "line-step": dynamic(() => import("@/examples/line-step/example").then((m) => memo(m.Example)), {
    loading: Loading,
    ssr: false,
  }),
  "line-markers": dynamic(
    () => import("@/examples/line-markers/example").then((m) => memo(m.ResponseTimeChart)),
    { loading: Loading, ssr: false },
  ),
  "line-paper": dynamic(
    () => import("@/examples/line-paper/example").then((m) => memo(m.MaterialLineChart)),
    { loading: Loading, ssr: false },
  ),
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
const componentsLine = { Curve: components["line-smooth"], Material: components["line-paper"] };
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
  compactLine = false,
}: {
  bundle: ComponentBundle;
  sourceCode?: ReactNode;
  variantCode?: Record<string, ReactNode>;
  compactLine?: boolean;
}) {
  const { id } = bundle;
  const [variant, setVariant] = useState(bundle.defaultVariant);
  const controlId = useId();
  const [settings, setSettings] = useState(bundle.settings);
  const onChange = useCallback((next: Record<string, unknown>) => setSettings(next), []);
  const [file, setFile] = useState(`src/examples/${id}/example.tsx`);
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState("preview");
  const files: Record<string, string> = filesFor(bundle, settings, variant);
  const Preview = components[id];
  const dataAlternative = bundle.dataAlternative;
  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied`);
    } catch {
      setStatus(
        compactLine
          ? "Clipboard unavailable. Select the code to copy."
          : "Clipboard unavailable. Select the code to copy, or download the example.",
      );
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
      setStatus("Curated example downloaded");
    } catch {
      setStatus("Could not download the example. Try again after the package asset loads.");
    }
  }
  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className={`component-workbench${compactLine ? " line-workbench" : ""}`}
      data-component={id}
      id={compactLine && id !== "line" ? `example-${id}` : "component-preview"}
    >
      <div className="playground-header">
        <TabsList aria-label={`${bundle.title} component`} className="preview-tabs">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          {!compactLine && <TabsTrigger value="usage">Usage</TabsTrigger>}
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        {compactLine && bundle.variants && (
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
            onClick={() => copy(promptFor(bundle, settings, location.origin, variant), "Prompt")}
          >
            {status === "Prompt copied" ? <Check size={14} /> : <Copy size={14} />}
            <span>{status === "Prompt copied" ? "Copied" : "Copy prompt"}</span>
          </Button>
          {!compactLine && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Download example"
              title="Download complete example"
              onClick={download}
            >
              <Download size={15} />
            </Button>
          )}
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
        {compactLine ? (
          <>
            <div className="chart-example">
              {id === "line-smooth" ? (
                <componentsLine.Curve curve={variant as "monotone" | "linear" | "stepAfter"} />
              ) : id === "line-paper" ? (
                <componentsLine.Material
                  material={variant as "plain" | "paper" | "clay" | "glow"}
                />
              ) : (
                <Preview />
              )}
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
                  {dataAlternative.rows.map((row) => (
                    <tr key={row.period}>
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
          </>
        ) : (
          <Preview onSettingsChange={onChange} />
        )}
      </TabsContent>
      {!compactLine && (
        <TabsContent value="usage" forceMount hidden={tab !== "usage"} className="usage-panel">
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
          {!compactLine && (
            <>
              <h2>Example settings</h2>
              <p>Code, downloads and prompts use this composition and current legend visibility.</p>
              {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable code requires keyboard access. */}
              <pre tabIndex={0}>
                <code>{files[`src/examples/${id}/settings.ts`]}</code>
              </pre>
            </>
          )}
        </TabsContent>
      )}
      {compactLine ? (
        <TabsContent value="code" forceMount hidden={tab !== "code"} className="code-files">
          {variant && variantCode ? variantCode[variant] : sourceCode}
        </TabsContent>
      ) : (
        <TabsContent value="code" forceMount hidden={tab !== "code"} className="code-files">
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
          <div
            className="source-code"
            {...(compactLine
              ? { tabIndex: 0, role: "region", "aria-label": `${bundle.title} code` }
              : {})}
          >
            {sourceCode && file === `src/examples/${id}/example.tsx` ? (
              sourceCode
            ) : (
              /* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable code requires keyboard access. */
              <pre tabIndex={0}>
                <code>{files[file]}</code>
              </pre>
            )}
          </div>
          {!compactLine && (
            <p className="code-caption">
              Complete example source with public imports. The composition and current visibility
              are in settings.ts.
            </p>
          )}
        </TabsContent>
      )}
      <span role="status" className="sr-only">
        {status}
      </span>
    </Tabs>
  );
}
