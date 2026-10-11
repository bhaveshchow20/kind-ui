"use client";
import {
  CodeBlock,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
  Pre,
} from "fumadocs-ui/components/codeblock";
import { Step, Steps } from "fumadocs-ui/components/steps";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { docRoute } from "@/lib/routing.mjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type Item = { name: string; dependencies: string[] };
const managers = ["npm", "pnpm", "yarn", "bun"] as const;

function InstallCommands({ item, manual = false }: { item: Item; manual?: boolean }) {
  const packages = item.dependencies.join(" ");
  const commands = manual
    ? {
        npm: `npm install ${packages}`,
        pnpm: `pnpm add ${packages}`,
        yarn: `yarn add ${packages}`,
        bun: `bun add ${packages}`,
      }
    : {
        npm: `npx shadcn@latest add @kind-ui/${item.name}`,
        pnpm: `pnpm dlx shadcn@latest add @kind-ui/${item.name}`,
        yarn: `yarn dlx shadcn@latest add @kind-ui/${item.name}`,
        bun: `bunx --bun shadcn@latest add @kind-ui/${item.name}`,
      };
  return (
    <CodeBlockTabs defaultValue="npm" className="install-command">
      <CodeBlockTabsList aria-label="Package manager">
        {managers.map((manager) => (
          <CodeBlockTabsTrigger key={manager} value={manager}>
            {manager}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {managers.map((manager) => (
        <CodeBlockTab key={manager} value={manager}>
          <CodeBlock>
            <Pre>
              <code>{commands[manager]}</code>
            </Pre>
          </CodeBlock>
        </CodeBlockTab>
      ))}
    </CodeBlockTabs>
  );
}

export function ChartInstallation({
  item,
  sourceFiles,
  example,
}: {
  item: Item;
  sourceFiles: ReactNode;
  example: ReactNode;
}) {
  const [tab, setTab] = useState("cli");
  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      data-installation={item.name}
      className="chart-installation component-workbench"
    >
      <div className="playground-header">
        <TabsList aria-label={`${item.name} installation`} className="preview-tabs">
          <TabsTrigger value="cli">CLI</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="cli">
        <InstallCommands item={item} />
        <p>
          For a new project, start with the{" "}
          <Link href={docRoute("/docs/installation/#cli-setup")}>installation guide</Link>.
        </p>
      </TabsContent>
      <TabsContent value="manual">
        <Steps>
          <Step>
            <h3>Install dependencies</h3>
            <InstallCommands item={item} manual />
          </Step>
          <Step>
            <h3>Copy the component source</h3>
            <p>
              Create these files in your source directory. Keep your existing edits to shared files.
            </p>
            {sourceFiles}
          </Step>
          <Step>
            <h3>Use the component</h3>
            {example}
            <p>
              Replace the sample data with your own. The imports use @/ for your source directory;
              adjust them if your alias differs.
            </p>
          </Step>
        </Steps>
      </TabsContent>
    </Tabs>
  );
}
