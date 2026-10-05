import { createRoot } from "react-dom/client";
import { Host } from "./host.js";

const root = document.getElementById("root");
if (root) createRoot(root).render(<Host />);
