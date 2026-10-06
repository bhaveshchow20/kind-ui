import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { AreaHost, AreaPaintHost, AreaPatternHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
const query = new URLSearchParams(window.location.search);
createRoot(root).render(
  query.has("patterns") ? (
    <AreaPatternHost horizontal={query.has("horizontal")} />
  ) : query.has("paint") ? (
    <AreaPaintHost />
  ) : (
    <AreaHost />
  ),
);
