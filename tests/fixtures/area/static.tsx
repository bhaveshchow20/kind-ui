import { createRoot, hydrateRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { renderToString } from "react-dom/server";
import { AreaPatternHost } from "./patterns.js";
import { AreaHost, AreaPaintHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
const query = new URLSearchParams(window.location.search);
if (query.has("patterns")) {
  const content = <AreaPatternHost horizontal={query.has("horizontal")} />;
  root.innerHTML = renderToString(content, { identifierPrefix: "area-pattern-host-" });
  hydrateRoot(root, content, { identifierPrefix: "area-pattern-host-" });
} else {
  createRoot(root).render(query.has("paint") ? <AreaPaintHost /> : <AreaHost />);
}
