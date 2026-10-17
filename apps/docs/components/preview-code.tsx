"use client";

import { type ReactNode, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

/** The shared Preview/Code frame retains measured previews while code is selected. */
export function PreviewCode({
  title,
  preview,
  code,
  controls,
  className = "",
  ...props
}: {
  title: string;
  preview: ReactNode;
  code: ReactNode;
  controls?: ReactNode;
  className?: string;
  id?: string;
  "data-component"?: string;
  "data-state"?: string;
}) {
  const [tab, setTab] = useState("preview");
  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className={`component-workbench ${className}`}
      {...props}
    >
      <div className="playground-header">
        <TabsList aria-label={`${title} component`} className="preview-tabs">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        {controls}
      </div>
      <TabsContent
        value="preview"
        forceMount
        aria-hidden={tab !== "preview"}
        data-inactive={tab !== "preview"}
        inert={tab !== "preview"}
        className="preview-panel"
      >
        {preview}
      </TabsContent>
      <TabsContent value="code" forceMount hidden={tab !== "code"} className="code-files">
        {code}
      </TabsContent>
    </Tabs>
  );
}
