import { StrictMode } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { StylesheetHost } from "./host.js";

const params = new URLSearchParams(location.search);
if (params.has("styles")) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./styles.css";
  document.head.append(link);
}
const containers = ["first", "second"].map((id) => {
  const node = document.getElementById(id);
  if (!node) throw new Error("Missing stylesheet fixture root");
  return node;
});
const host = (
  <StrictMode>
    <StylesheetHost />
  </StrictMode>
);
let roots: Root[] = [];
if (params.has("late")) {
  for (const node of containers) node.replaceChildren();
} else roots = containers.map((node) => hydrateRoot(node, host));
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
document.getElementById("late-styles")?.addEventListener("click", () => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./styles.css";
  document.head.append(link);
  roots = containers.map((node) => {
    const root = createRoot(node);
    root.render(
      <StrictMode>
        <StylesheetHost nested />
      </StrictMode>,
    );
    return root;
  });
});
