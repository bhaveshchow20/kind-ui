import { createRoot, hydrateRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { MaterialGallery, PieHost, SelectiveGlowHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
const query = new URLSearchParams(location.search);
if (query.has("selective")) {
  const chart = <SelectiveGlowHost accessor={query.has("accessor")} />;
  const markup = (globalThis as typeof globalThis & { pieSsr?: string }).pieSsr;
  if (markup === undefined) throw new Error("Missing Node-rendered Pie SSR fixture");
  root.innerHTML = markup;
  hydrateRoot(root, chart, {
    onRecoverableError: (error) => {
      throw error;
    },
  });
} else {
  createRoot(root).render(query.has("gallery") ? <MaterialGallery /> : <PieHost />);
}
