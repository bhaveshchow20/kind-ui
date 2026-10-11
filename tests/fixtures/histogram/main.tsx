import { createRoot } from "react-dom/client";
import { HistogramHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<HistogramHost />);
