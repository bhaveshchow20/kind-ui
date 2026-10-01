import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { AreaHost, AreaPaintHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  new URLSearchParams(window.location.search).has("paint") ? <AreaPaintHost /> : <AreaHost />,
);
