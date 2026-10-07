import { createRoot } from "react-dom/client";
import "@kind-ui/charts/styles.css";
import { BarHost, PatternHost, ProjectionHost } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
const query = new URLSearchParams(window.location.search);
createRoot(root).render(
  query.has("projection") ? (
    <ProjectionHost horizontal={query.has("horizontal")} />
  ) : query.has("patterns") ? (
    <PatternHost horizontal={query.has("horizontal")} />
  ) : (
    <BarHost />
  ),
);
