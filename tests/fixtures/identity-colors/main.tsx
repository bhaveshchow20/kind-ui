import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { ThemeHost } from "./theme-host.js";
import "@kind-ui/charts/styles.css";
import { Host } from "./host.js";

const root = document.getElementById("root");
if (root) {
  if (new URLSearchParams(window.location.search).has("theme")) {
    const content = <ThemeHost />;
    root.innerHTML = renderToString(content, { identifierPrefix: "theme-host-" });
    hydrateRoot(root, content, { identifierPrefix: "theme-host-" });
  } else createRoot(root).render(<Host />);
}
