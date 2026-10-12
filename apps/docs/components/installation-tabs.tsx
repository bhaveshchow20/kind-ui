"use client";

import { type ReactNode, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function InstallationTabs({
  id,
  cli,
  manual,
}: {
  id: string;
  cli: ReactNode;
  manual: ReactNode;
}) {
  const [method, setMethod] = useState("cli");
  return (
    <Tabs
      className="component-workbench"
      value={method}
      onValueChange={setMethod}
      data-chart-installation={id}
    >
      <div className="playground-header">
        <TabsList aria-label="Installation method" className="preview-tabs">
          <TabsTrigger value="cli">CLI</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="cli">{cli}</TabsContent>
      <TabsContent value="manual">{manual}</TabsContent>
    </Tabs>
  );
}
