import { domAnimation, LazyMotion } from "motion/react";
import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { CandlestickHost } from "./host.js";

class Boundary extends Component<{ children: ReactNode }, { error: string }> {
  override state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  override render() {
    return this.state.error ? <div role="alert">{this.state.error}</div> : this.props.children;
  }
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <LazyMotion features={domAnimation} strict>
    <Boundary>
      <CandlestickHost />
    </Boundary>
  </LazyMotion>,
);
