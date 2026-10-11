import { Root } from "@kind-ui/charts";
import { useEffect } from "react";

export function TailwindHost() {
  useEffect(() => {
    document.body.dataset.hydrated = "true";
  }, []);
  return <Root config={{}}>Chart</Root>;
}
