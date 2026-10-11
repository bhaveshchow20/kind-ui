import { StrictMode } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { TailwindHost } from "./host.js";

const containers = ["first", "second"].map((id) => {
  const node = document.getElementById(id);
  if (!node) throw new Error("Missing Tailwind fixture root");
  return node;
});
const host = (
  <StrictMode>
    <TailwindHost />
  </StrictMode>
);
let roots: Root[] = containers.map((node) => hydrateRoot(node, host));
document.getElementById("unmount")?.addEventListener("click", () => {
  for (const root of roots) root.unmount();
  roots = [];
});
document.getElementById("mount")?.addEventListener("click", () => {
  if (roots.length) return;
  roots = containers.map((node) => {
    const root = createRoot(node);
    root.render(host);
    return root;
  });
});
