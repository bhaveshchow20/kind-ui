"use client";

import {
  type ComponentPropsWithRef,
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { InteractionPaint } from "./animation.js";
import { useChartInteraction } from "./chart-interaction.js";

/** Identity is data-owned. scope separates independent plots within one Root. */
export type EmphasisTarget = {
  kind: "category" | "sector" | "series";
  key: string;
  scope: string;
  seriesKey?: string | undefined;
};
type Candidate = { owner: string; target: EmphasisTarget } | null;
type Channel = "pointer" | "keyboard";
type EmphasisState = {
  enabled: boolean;
  active: EmphasisTarget | null;
  register: (owner: string, target: EmphasisTarget) => () => void;
  set: (channel: Channel, candidate: Candidate) => void;
  clear: (channel: Channel, owner?: string, target?: EmphasisTarget) => void;
  reset: () => void;
  clearScope: (scope: string) => void;
};
const Context = createContext<EmphasisTarget | null>(null);
const Actions = createContext<Omit<EmphasisState, "active"> | null>(null);
const identity = (target: EmphasisTarget) =>
  JSON.stringify([target.kind, target.scope, target.key]);

export function EmphasisProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const targets = useRef(new Map<string, EmphasisTarget>());
  const [pointer, setPointer] = useState<Candidate>(null);
  const [keyboard, setKeyboard] = useState<Candidate>(null);
  const register = useCallback((owner: string, target: EmphasisTarget) => {
    targets.current.set(owner, target);
    return () => {
      targets.current.delete(owner);
      // Recharts can transfer a mark between portals or reorder it within this commit.
      // Reconcile after all layout registrations settle, without rerendering the engine.
      queueMicrotask(() => {
        const retain = (candidate: Candidate) =>
          candidate === null ||
          [...targets.current.values()].some(
            (item) => identity(item) === identity(candidate.target),
          )
            ? candidate
            : null;
        setPointer(retain);
        setKeyboard(retain);
      });
    };
  }, []);
  const set = useCallback((channel: Channel, candidate: Candidate) => {
    (channel === "pointer" ? setPointer : setKeyboard)((old) =>
      old === candidate ||
      (old !== null && candidate !== null && identity(old.target) === identity(candidate.target))
        ? old
        : candidate,
    );
  }, []);
  const clear = useCallback((channel: Channel, owner?: string, target?: EmphasisTarget) => {
    (channel === "pointer" ? setPointer : setKeyboard)((old) =>
      owner === undefined ||
      old?.owner === owner ||
      (target && old && identity(target) === identity(old.target))
        ? null
        : old,
    );
  }, []);
  const clearScope = useCallback((scope: string) => {
    setPointer((old) => (old?.target.scope.startsWith(`${scope}/`) ? null : old));
  }, []);
  const reset = useCallback(() => {
    setPointer(null);
    setKeyboard(null);
  }, []);
  const valid = (candidate: Candidate) =>
    candidate !== null &&
    [...targets.current.values()].some((target) => identity(target) === identity(candidate.target));
  // Validate after registrations settle: reorder may transfer the same data ID to another mark.
  useEffect(() => {
    if (pointer && !valid(pointer)) setPointer(null);
    if (keyboard && !valid(keyboard)) setKeyboard(null);
  });
  const active = enabled
    ? ((valid(pointer) ? pointer?.target : valid(keyboard) ? keyboard?.target : null) ?? null)
    : null;
  const actions = useMemo(
    () => ({ enabled, register, set, clear, reset, clearScope }),
    [enabled, register, set, clear, reset, clearScope],
  );
  return (
    <Actions value={actions}>
      <Context value={active}>{children}</Context>
    </Actions>
  );
}

export function useOptionalEmphasisActions() {
  return use(Actions);
}

export function useEmphasisActions() {
  const value = use(Actions);
  if (!value) throw new Error("Emphasis marks must be inside Root");
  return value;
}

function useEmphasisState() {
  const actions = useEmphasisActions();
  const active = use(Context);
  return { ...actions, active };
}

/** Explicit contract for custom and portaled marks; apply factor to an extra paint wrapper. */
export function useEmphasis(target: EmphasisTarget, enabled = true, persistent = true) {
  const interaction = useChartInteraction();
  const state = useEmphasisState();
  const owner = useId();
  const { kind, key, scope, seriesKey } = target;
  useLayoutEffect(() => {
    if (!enabled || !state.enabled) return;
    return state.register(owner, { kind, key, scope, seriesKey });
  }, [enabled, state.enabled, state.register, owner, kind, key, scope, seriesKey]);
  const active = state.active;
  const related =
    active === null ||
    (active.kind === "series" ? active.key === seriesKey : identity(active) === identity(target));
  const applicable = active?.kind === "series" ? seriesKey !== undefined : active?.scope === scope;
  const persistentKey =
    interaction.kind === "series"
      ? seriesKey
      : target.kind === "sector" || target.kind === "category"
        ? key
        : undefined;
  const persistentDimmed =
    persistent &&
    persistentKey !== undefined &&
    interaction.selected !== null &&
    persistentKey !== interaction.selected;
  const dimmed =
    enabled && (active !== null ? state.enabled && applicable && !related : persistentDimmed);
  const enter = useCallback(
    (channel: Channel) => {
      if (enabled && state.enabled) {
        if (channel === "keyboard") state.clear("pointer");
        state.set(channel, { owner, target: { kind, key, scope, seriesKey } });
      }
    },
    [enabled, state.enabled, state.clear, state.set, owner, kind, key, scope, seriesKey],
  );
  const leave = useCallback(
    (channel: Channel) => state.clear(channel, owner, { kind, key, scope, seriesKey }),
    [state.clear, owner, kind, key, scope, seriesKey],
  );
  return { active, dimmed: Boolean(dimmed), factor: dimmed ? 0.28 : 1, enter, leave };
}

export type EmphasisMarkProps = Omit<ComponentPropsWithRef<"g">, "target"> & {
  target: EmphasisTarget;
  enabled?: boolean | undefined;
  /** Explicitly bind persistent Root focus paint for custom marks. */
  persistent?: boolean | undefined;
  /** Adapter input from the engine, used only during native keyboard inspection. */
  keyboardActive?: boolean | undefined;
};

/** Multiplicative paint layer; native geometry, consumer opacity and hit testing stay intact. */
export function EmphasisMark({
  target,
  enabled = true,
  persistent = true,
  keyboardActive = false,
  children,
  ...props
}: EmphasisMarkProps) {
  const emphasis = useEmphasis(target, enabled, persistent);
  // Only depend on identity and the engine's inspection edge, not the changing paint state.
  useLayoutEffect(() => {
    if (keyboardActive) emphasis.enter("keyboard");
  }, [keyboardActive, emphasis.enter]);
  return (
    <g
      {...props}
      data-kind-ui="emphasis-mark"
      data-emphasis={emphasis.dimmed ? "dimmed" : "baseline"}
      style={props.style}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") emphasis.enter("pointer");
        props.onPointerEnter?.(event);
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== "touch") emphasis.enter("pointer");
        props.onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        emphasis.leave("pointer");
        props.onPointerLeave?.(event);
      }}
      onPointerCancel={(event) => {
        emphasis.leave("pointer");
        props.onPointerCancel?.(event);
      }}
      onFocusCapture={(event) => {
        if ((event.target as Element).matches(":focus-visible")) emphasis.enter("keyboard");
        props.onFocusCapture?.(event);
      }}
      onBlurCapture={(event) => {
        emphasis.leave("keyboard");
        props.onBlurCapture?.(event);
      }}
    >
      <InteractionPaint
        data-kind-ui="emphasis-paint"
        opacity={emphasis.factor}
        identity={JSON.stringify(["emphasis", target.kind, target.scope, target.key])}
      >
        {children}
      </InteractionPaint>
    </g>
  );
}
