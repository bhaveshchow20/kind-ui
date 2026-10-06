"use client";

import { useState } from "react";
import commands from "@/lib/installation-commands.json";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type PackageManager = keyof typeof commands;
const managers = Object.keys(commands) as PackageManager[];

export function InstallationCommands() {
  const [manager, setManager] = useState<PackageManager>("npm");
  return (
    <Tabs value={manager} onValueChange={(value) => setManager(value as PackageManager)}>
      <TabsList aria-label="Package manager">
        {managers.map((value) => (
          <TabsTrigger key={value} value={value}>
            {value}
          </TabsTrigger>
        ))}
      </TabsList>
      {managers.map((value) => (
        <TabsContent key={value} value={value}>
          <pre className="overflow-x-auto">
            <code>{commands[value]}</code>
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  );
}
