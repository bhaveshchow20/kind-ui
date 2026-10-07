import { createRoot, hydrateRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { MaterialGallery, PieHost, PinnedPieHost, SelectiveGlowHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
const query = new URLSearchParams(location.search);
if (query.has("pinned")) {
  createRoot(root).render(
    <PinnedPieHost category={query.get("category") ?? "beta"} accessor={query.has("accessor")} />,
  );
} else if (query.has("selective")) {
  void hydrateSelective(root, query.has("accessor"));
} else {
  createRoot(root).render(query.has("gallery") ? <MaterialGallery /> : <PieHost />);
}

async function hydrateSelective(container: HTMLElement, accessor: boolean) {
  const response = await fetch("./ssr.json");
  if (!response.ok) throw new Error("Missing packed Node-rendered Pie SSR fixture");
  const shells: { field: string; accessor: string } = await response.json();
  const markup = shells[accessor ? "accessor" : "field"];
  if (typeof markup !== "string") throw new Error("Invalid packed Pie SSR markup");
  container.innerHTML = markup;
  hydrateRoot(container, <SelectiveGlowHost accessor={accessor} />, {
    onRecoverableError: (error) => {
      throw error;
    },
  });
}
