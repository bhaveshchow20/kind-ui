import { createRoot } from "react-dom/client";
import { WaterfallHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<WaterfallHost />);
