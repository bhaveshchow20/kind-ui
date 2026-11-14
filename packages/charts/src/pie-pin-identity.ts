type PiePinComponentKind = "series" | "tooltip";

// Canonical exports register themselves; resolving children never imports their renderers.
const components = new WeakMap<object, PiePinComponentKind>();

export function registerPiePinComponent(component: object, kind: PiePinComponentKind) {
  components.set(component, kind);
}

export function piePinComponentKind(component: unknown): PiePinComponentKind | undefined {
  return typeof component === "function" || (typeof component === "object" && component !== null)
    ? components.get(component)
    : undefined;
}
