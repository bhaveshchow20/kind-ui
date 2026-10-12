import { domAnimation, LazyMotion } from "motion/react";
import { createRoot } from "react-dom/client";
import { Host } from "./host.js";
import "@kind-ui/charts/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  new URLSearchParams(location.search).has("lazy") ? (
    <LazyMotion features={domAnimation} strict>
      <Host />
    </LazyMotion>
  ) : (
    <Host />
  ),
);
