import { Root } from "@kind-ui/charts";
import { useEffect } from "react";

export function StylesheetHost({ nested = false }: { nested?: boolean }) {
  useEffect(() => {
    document.body.dataset.hydrated = "true";
  }, []);
  return <Root config={{}}>{nested ? <Root config={{}}>Chart</Root> : "Chart"}</Root>;
}
