"use client";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { publicPath } from "@/lib/routing.mjs";

const DistributionContext = createContext({
  distribution: "npm",
  setDistribution: (_value: string) => {},
  origin: "",
});
export function DistributionProvider({ children }: { children: ReactNode }) {
  const [distribution, setDistribution] = useState("npm");
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(location.origin);
    try {
      if (localStorage.getItem("kind-chart-distribution") === "shadcn") setDistribution("shadcn");
    } catch {
      /* Storage is optional. */
    }
  }, []);
  function select(value: string) {
    if (value !== "npm" && value !== "shadcn") return;
    setDistribution(value);
    try {
      localStorage.setItem("kind-chart-distribution", value);
    } catch {
      /* Storage is optional. */
    }
  }
  return (
    <DistributionContext value={{ distribution, setDistribution: select, origin }}>
      {children}
    </DistributionContext>
  );
}
export const useDistribution = () => useContext(DistributionContext);
export function DistributionSwitcher() {
  const { distribution, setDistribution } = useDistribution();
  return (
    <label className="distribution-switcher">
      Install with
      <select
        aria-label="Chart distribution"
        value={distribution}
        onChange={(event) => setDistribution(event.target.value)}
      >
        <option value="npm">npm</option>
        <option value="shadcn">shadcn</option>
      </select>
    </label>
  );
}
export function registryCommand(id: string, origin = "") {
  const url = origin
    ? `${origin}${publicPath(`/r/kind-${id}.json`)}`
    : `https://kindui.dev/charts/docs/r/kind-${id}.json`;
  return `npx shadcn@latest add ${url}`;
}
export function ChartInstall({ id = "line-start" }: { id?: string }) {
  const { distribution, origin } = useDistribution();
  return (
    <CodeBlock title="Terminal">
      <Pre>
        <code>
          {distribution === "shadcn" ? registryCommand(id, origin) : "npm install @kind-ui/charts"}
        </code>
      </Pre>
    </CodeBlock>
  );
}
export function DistributionContent({ value, children }: { value: string; children: ReactNode }) {
  return useDistribution().distribution === value ? children : null;
}
