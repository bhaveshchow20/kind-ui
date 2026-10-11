import { createRoot } from "react-dom/client";
import { LineHost, MaterialsHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(location.search.includes("materials") ? <MaterialsHost /> : <LineHost />);
