import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PolarHost } from "./host.js";

createRoot(document.getElementById("root") as HTMLElement).render(
  new URLSearchParams(window.location.search).has("strict") ? (
    <StrictMode>
      <PolarHost />
    </StrictMode>
  ) : (
    <PolarHost />
  ),
);
