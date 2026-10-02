import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Host } from "./host.js";

class InputBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? <p role="alert">{this.state.error}</p> : this.props.children;
  }
}
const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <InputBoundary>
      <Host />
    </InputBoundary>,
  );
