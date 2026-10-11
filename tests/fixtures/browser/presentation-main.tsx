import "@kind-ui/charts/styles.css";
import "./presentation.css";
import { CategoryIdentityExample, PresentationExample } from "./presentation.js";

export default function PresentationFixture() {
  return new URLSearchParams(location.search).has("category") ? (
    <CategoryIdentityExample />
  ) : (
    <PresentationExample />
  );
}
