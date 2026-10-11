"use client";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { useEffect, useState } from "react";
import { publicPath } from "@/lib/routing.mjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type Item = { name: string; dependencies: string[]; files: { target: string; content: string }[] };
function Code({ title, children }: { title: string; children: string }) {
  return (
    <CodeBlock title={title}>
      <Pre>
        <code>{children}</code>
      </Pre>
    </CodeBlock>
  );
}
export function ChartInstallation({ item }: { item: Item }) {
  const [tab, setTab] = useState("cli");
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(location.origin), []);
  const mapping = JSON.stringify(
    { registries: { "@kind-ui": `${origin || "<docs-origin>"}${publicPath("/r/{name}.json")}` } },
    null,
    2,
  );
  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      data-installation={item.name}
      className="chart-installation"
    >
      <TabsList aria-label={`${item.name} installation`}>
        <TabsTrigger value="cli">CLI</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
      </TabsList>
      <TabsContent value="cli">
        <ol>
          <li>
            <p>Initialize shadcn in your React project if needed.</p>
            <Code title="Terminal">npx shadcn@latest init</Code>
          </li>
          <li>
            <p>
              Merge this registry mapping into <code>components.json</code> once.
            </p>
            <Code title="components.json">{mapping}</Code>
            <p>
              The namespace is configured in your project. Global directory registration is pending.
            </p>
          </li>
          <li>
            <p>Install the component and its dependencies.</p>
            <Code title="Terminal">{`npx shadcn@latest add @kind-ui/${item.name}`}</Code>
          </li>
        </ol>
      </TabsContent>
      <TabsContent value="manual">
        <ol>
          <li>
            <p>Install the npm core and its supported peers.</p>
            <Code title="Terminal">{`npm install ${item.dependencies.join(" ")}`}</Code>
          </li>
          <li>
            <p>
              Copy these files into your source directory. Keep your existing edits to shared files.
            </p>
            {item.files.map((file) => (
              <Code title={file.target} key={file.target}>
                {file.content}
              </Code>
            ))}
          </li>
          <li>
            <p>
              Import the local component as shown in Usage. The examples use @/ for your source
              directory; adjust the import if your alias differs. Both paths install the same files.
            </p>
          </li>
        </ol>
      </TabsContent>
    </Tabs>
  );
}
