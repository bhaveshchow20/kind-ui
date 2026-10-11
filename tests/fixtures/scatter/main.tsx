import { createRoot } from "react-dom/client";
import { ScatterHost, ScatterMaterialHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  window.location.search.includes("materials") ? <ScatterMaterialHost /> : <ScatterHost />,
);
