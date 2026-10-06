import { createRoot, hydrateRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { renderToString } from "react-dom/server";
import { BarHost } from "./host.js";
import { PatternHost } from "./patterns.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
const query = new URLSearchParams(window.location.search);
if (query.has("patterns")) {
  const content = <PatternHost horizontal={query.has("horizontal")} />;
  root.innerHTML = renderToString(content, { identifierPrefix: "pattern-host-" });
  hydrateRoot(root, content, { identifierPrefix: "pattern-host-" });
} else {
  createRoot(root).render(<BarHost />);
}
