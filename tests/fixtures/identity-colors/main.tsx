import { createRoot } from "react-dom/client";
import { Host, ThemeHost } from "./host.js";

const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    new URLSearchParams(window.location.search).has("theme") ? <ThemeHost /> : <Host />,
  );
