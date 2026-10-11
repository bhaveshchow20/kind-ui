import { createRoot } from "react-dom/client";
import { BoxHost, MaterialGallery } from "./host.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <>
    <BoxHost />
    {new URLSearchParams(location.search).has("materials") && <MaterialGallery />}
  </>,
);
