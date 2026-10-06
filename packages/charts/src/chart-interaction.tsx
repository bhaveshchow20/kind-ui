"use client";

import {
  createContext,
  type ReactNode,
  type SyntheticEvent,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOptionalEmphasisActions } from "./emphasis.js";
import type { SeriesConfig } from "./types.js";

export type ChartIdentity = { kind: "series" | "category" | "node"; key: string };
export type ChartInteractionEvent = SyntheticEvent<Element> | null;
export type ChartInteractionRequest = {
  identity: ChartIdentity | null;
  source: "legend" | "mark" | "reset";
  mode: "visibility" | "focus";
  event: ChartInteractionEvent;
};
export type ChartInteractionConfig = {
  /** Explicit binding between this Root's legend and participating chart identities. */
  markActivation?: "none" | "matching-legend";
  /** Settled data identities, including hidden items and zero values. */
  eligibleKeys: readonly string[];
  onBeforeInteraction?: (request: ChartInteractionRequest) => boolean | void;
} & (
  | {
      kind: "series" | "category";
      mode?: "visibility";
      selected?: never;
      defaultSelected?: never;
      onSelectionChange?: never;
    }
  | ({ kind: "series" | "category" | "node"; mode: "focus" } & (
      | {
          selected?: undefined;
          defaultSelected?: string | null;
          onSelectionChange?: (next: string | null) => void;
        }
      | {
          selected: string | null;
          defaultSelected?: never;
          onSelectionChange: (next: string | null) => void;
        }
    ))
);
export type ChartVisibilityProps =
  | { visibleSeries?: undefined; defaultVisibleSeries?: undefined; onVisibleSeriesChange?: never }
  | {
      visibleSeries?: undefined;
      defaultVisibleSeries: readonly string[];
      onVisibleSeriesChange?: (next: string[]) => void;
    }
  | {
      visibleSeries: readonly string[];
      defaultVisibleSeries?: never;
      onVisibleSeriesChange?: (next: string[]) => void;
    };

type Interaction = {
  configured: boolean;
  mode: "visibility" | "focus";
  kind: ChartIdentity["kind"];
  markActivation: boolean;
  interactive: boolean;
  selected: string | null;
  eligible: readonly string[];
  visible: readonly string[] | undefined;
  activate: (
    identity: ChartIdentity,
    source: "legend" | "mark",
    event?: ChartInteractionEvent,
  ) => boolean;
  reset: (event?: ChartInteractionEvent) => boolean;
  announcement: { text: string; sequence: number };
  registerUnavailable: (owner: string, key: string | undefined, unavailable: boolean) => () => void;
  register: (owner: string, keys: readonly string[]) => () => void;
};
const Context = createContext<Interaction | null>(null);

/** The single state/action owner shared by native adapters and custom controls. */
function useInteractionOwner() {
  const value = use(Context);
  if (!value) throw new Error("useChartInteraction requires Root");
  return value;
}

export function useOptionalChartInteraction() {
  return use(Context);
}

export function useChartInteraction() {
  const {
    register: _register,
    registerUnavailable: _registerUnavailable,
    announcement: _announcement,
    ...publicValue
  } = useInteractionOwner();
  const emphasis = useOptionalEmphasisActions();
  return {
    ...publicValue,
    reset: (event: ChartInteractionEvent = null) => {
      if (!publicValue.reset(event)) return false;
      emphasis?.reset();
      return true;
    },
  };
}

export function ChartInteractionProvider({
  config,
  children,
  ...props
}: { interaction?: ChartInteractionConfig } & ChartVisibilityProps & {
    config: SeriesConfig;
    children: (
      visible: readonly string[] | undefined,
      change: ((next: string[]) => void) | undefined,
    ) => ReactNode;
  }) {
  const options = props.interaction;
  const mode = options?.mode ?? "visibility";
  const kind = options?.kind ?? "series";
  const controlled = options?.selected;
  const onChange = options?.onSelectionChange;
  const initial = options?.defaultSelected;
  const [internal, setInternal] = useState(initial ?? null);
  const [internalVisible, setInternalVisible] = useState(props.defaultVisibleSeries);
  const [unavailable, setUnavailable] = useState(() => new Map<string, string>());
  const registerUnavailable = useCallback(
    (owner: string, key: string | undefined, blocked: boolean) => {
      setUnavailable((old) => {
        const next = new Map(old);
        if (blocked && key !== undefined) next.set(owner, key);
        else next.delete(owner);
        return JSON.stringify([...old]) === JSON.stringify([...next]) ? old : next;
      });
      return () =>
        setUnavailable((old) => {
          if (!old.has(owner)) return old;
          const next = new Map(old);
          next.delete(owner);
          return next;
        });
    },
    [],
  );
  const [registrations, setRegistrations] = useState(() => new Map<string, readonly string[]>());
  const [announcement, setAnnouncement] = useState({ text: "", sequence: 0 });
  const ownership = useRef<boolean | undefined>(
    mode === "focus" ? controlled !== undefined : undefined,
  );
  if (mode === "focus" && ownership.current === undefined)
    ownership.current = controlled !== undefined;
  if (options?.kind === "node" && mode !== "focus")
    throw new Error("Node interaction only supports focus");
  if (mode === "focus" && ownership.current !== (controlled !== undefined))
    throw new Error("Root selection ownership cannot change during a mount");
  if (controlled !== undefined && !onChange)
    throw new Error("Controlled Root selection requires its change callback");
  if (controlled !== undefined && initial !== undefined)
    throw new Error("Root selection cannot be both controlled and defaulted");
  if (props.visibleSeries !== undefined && props.defaultVisibleSeries !== undefined)
    throw new Error("Root visibility cannot be both controlled and defaulted");
  if (
    props.onVisibleSeriesChange &&
    props.visibleSeries === undefined &&
    props.defaultVisibleSeries === undefined
  )
    throw new Error(
      "Root requires visibleSeries or defaultVisibleSeries with onVisibleSeriesChange",
    );
  const register = useCallback((owner: string, keys: readonly string[]) => {
    setRegistrations((old) => {
      if (JSON.stringify(old.get(owner)) === JSON.stringify(keys)) return old;
      return new Map(old).set(owner, keys);
    });
    return () =>
      setRegistrations((old) => {
        if (!old.has(owner)) return old;
        const next = new Map(old);
        next.delete(owner);
        return next;
      });
  }, []);
  const eligible = useMemo(
    () =>
      [
        ...new Set(
          options?.eligibleKeys ??
            (registrations.size ? [...registrations.values()].flat() : Object.keys(config)),
        ),
      ].filter((key) => Object.hasOwn(config, key) && ![...unavailable.values()].includes(key)),
    [options?.eligibleKeys, registrations, config, unavailable],
  );
  const visible = props.visibleSeries ?? internalVisible;
  const requested = controlled === undefined ? internal : controlled;
  const selected =
    mode === "focus" &&
    requested !== null &&
    eligible.includes(requested) &&
    (visible === undefined || visible.includes(requested))
      ? requested
      : null;
  // Registration settles in layout effects; never turn an invalid controlled ID into an owner write.
  useEffect(() => {
    if (controlled === undefined && internal !== null && selected === null) setInternal(null);
  }, [controlled, internal, selected]);
  const announce = (text: string) =>
    setAnnouncement((old) => ({ text, sequence: old.sequence + 1 }));
  const changeVisibility = (next: string[]) => {
    if (props.visibleSeries === undefined) setInternalVisible(next);
    props.onVisibleSeriesChange?.(next);
  };
  const interactive =
    mode === "focus" ||
    props.onVisibleSeriesChange !== undefined ||
    props.defaultVisibleSeries !== undefined;
  const permitted = (request: ChartInteractionRequest) => {
    if (request.event?.defaultPrevented) return false;
    const allowed = options?.onBeforeInteraction?.(request) !== false;
    return allowed && !request.event?.defaultPrevented;
  };
  const change = (next: string | null) => {
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
    announce(next === null ? "Highlight cleared." : `Highlighted ${config[next]?.label ?? next}.`);
  };
  const activate: Interaction["activate"] = (identity, source, event = null) => {
    if (
      !interactive ||
      identity.kind !== kind ||
      !eligible.includes(identity.key) ||
      (source === "mark" && options?.markActivation !== "matching-legend")
    )
      return false;
    if (!permitted({ identity, source, mode, event })) return false;
    if (mode === "focus") {
      if (visible !== undefined && !visible.includes(identity.key)) return false;
      change(selected === identity.key ? null : identity.key);
    } else {
      const current = visible ?? eligible;
      const hiding = current.includes(identity.key);
      if (hiding && !eligible.some((key) => key !== identity.key && current.includes(key))) {
        announce("At least one item must remain visible.");
        return false;
      }
      changeVisibility(
        hiding ? current.filter((key) => key !== identity.key) : [...current, identity.key],
      );
      announce(`${hiding ? "Hidden" : "Shown"} ${config[identity.key]?.label ?? identity.key}.`);
    }
    return true;
  };
  const reset: Interaction["reset"] = (event = null) => {
    if (!permitted({ identity: null, source: "reset", mode, event })) return false;
    if (mode === "focus" && requested !== null) change(null);
    return true;
  };
  return (
    <Context
      value={{
        configured: options !== undefined,
        mode,
        kind,
        selected,
        eligible,
        visible,
        interactive,
        markActivation: options?.markActivation === "matching-legend",
        activate,
        reset,
        register,
        registerUnavailable,
        announcement,
      }}
    >
      {children(visible, interactive ? changeVisibility : undefined)}
    </Context>
  );
}

export function ChartInteractionStatus() {
  const { announcement } = useInteractionOwner();
  return (
    <span
      aria-live="polite"
      aria-atomic="true"
      data-kind-ui="chart-interaction-status"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clipPath: "inset(50%)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      <span key={announcement.sequence}>{announcement.text}</span>
    </span>
  );
}

/** Native series registration preserves hidden eligibility; callers may supply a stricter snapshot. */
export function useInteractionRegistration(keys: readonly string[]) {
  const { register } = useInteractionOwner();
  const owner = useId();
  const encoded = JSON.stringify(keys);
  useLayoutEffect(
    () => register(owner, JSON.parse(encoded) as string[]),
    [register, owner, encoded],
  );
}

export function useInteractionAvailability(key: string | undefined, unavailable: boolean) {
  const { registerUnavailable } = useInteractionOwner();
  const owner = useId();
  useLayoutEffect(
    () => registerUnavailable(owner, key, unavailable),
    [registerUnavailable, owner, key, unavailable],
  );
}
