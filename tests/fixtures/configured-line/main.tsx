import "@kind-ui/charts/styles.css";
import { createRoot } from "react-dom/client";
import { ConfiguredHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<ConfiguredHost />);
