import { type ComponentType, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const fixtures: Record<string, () => Promise<{ default: ComponentType }>> = {
  loader: () => import("./loader.js"),
  "thinking-indicator": () => import("./thinking-indicator.js"),
  "streaming-text": () => import("./streaming-text.js"),
  "typing-indicator": () => import("./typing-indicator.js"),
  "reasoning-effort": () => import("./reasoning-effort.js"),
  "guardrail-notice": () => import("./guardrail-notice.js"),
};
const component = new URLSearchParams(window.location.search).get("component") ?? "loader";
const load = Object.hasOwn(fixtures, component) ? fixtures[component] : undefined;
if (!load) throw new Error(`Unknown reasoning component: ${component}`);
const Fixture = lazy(load);
const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  <Suspense fallback={null}>
    <Fixture />
  </Suspense>,
);
