import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { MaterialGallery, PieHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  new URLSearchParams(location.search).has("gallery") ? <MaterialGallery /> : <PieHost />,
);
