"use client";

import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import {
  type ComponentProps,
  createContext,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { actionClass, cn, useControllable } from "./utils.js";

interface TimedRange {
  id: string;
  start: number;
  end?: number | undefined;
}
interface TimeStore {
  getTime: () => number;
  subscribe: (listener: () => void) => () => void;
  update: (time: number) => void;
}
function createTimeStore(initialTime: number): TimeStore {
  let time = initialTime;
  const listeners = new Set<() => void>();
  return {
    getTime: () => time,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update: (next) => {
      if (Object.is(time, next)) return;
      time = next;
      for (const listener of listeners) listener();
    },
  };
}
function useRanges() {
  const [ranges, setRanges] = useState<TimedRange[]>([]);
  const register = useCallback((range: TimedRange) => {
    setRanges((previous) => [...previous.filter((item) => item.id !== range.id), range]);
    return () => {
      setRanges((previous) => previous.filter((item) => item !== range));
    };
  }, []);
  return {
    ranges: useMemo(() => [...ranges].sort((a, b) => a.start - b.start), [ranges]),
    register,
  };
}
function validStart(value: number) {
  return Number.isFinite(value) && value >= 0;
}
function rangeEnd(range: TimedRange, sorted: TimedRange[], fallback: number) {
  return range.end ?? sorted.find((item) => item.start > range.start)?.start ?? fallback;
}
interface TranscriptContextValue {
  activeId: string | null;
  autoScroll: boolean;
  setAutoScroll: (next: boolean) => void;
  register: (range: TimedRange) => () => void;
  ranges: TimedRange[];
  duration: number;
  onSeek: ((seconds: number) => void) | undefined;
  pauseOnInteraction: boolean;
  viewportRef: RefObject<HTMLDivElement | null>;
}
const TranscriptContext = createContext<TranscriptContextValue | null>(null);
const TimeContext = createContext<TimeStore | null>(null);
function useTranscriptContext() {
  const value = useContext(TranscriptContext);
  if (!value) throw new Error("Transcript parts require a Transcript parent.");
  return value;
}
interface ItemContextValue {
  id: string;
  start: number;
  end: number;
  ranges: TimedRange[];
  register: (range: TimedRange) => () => void;
}
const ItemContext = createContext<ItemContextValue | null>(null);
function useItem() {
  const value = useContext(ItemContext);
  if (!value) throw new Error("Transcript item parts require a TranscriptItem parent.");
  return value;
}
export function useTranscript() {
  const { activeId, autoScroll, setAutoScroll } = useTranscriptContext();
  return { activeId, autoScroll, setAutoScroll };
}

export type TranscriptProps = useRender.ComponentProps<"div"> & {
  /** Playback position in seconds, supplied by the host's media or stream. */
  currentTime: number;
  duration?: number;
  onSeek?: (seconds: number) => void;
  defaultAutoScroll?: boolean;
  autoScroll?: boolean;
  onAutoScrollChange?: (autoScroll: boolean) => void;
  /** Pause following when a reader scrolls or navigates the viewport. */
  pauseOnInteraction?: boolean;
};
export function Transcript({
  currentTime,
  duration = 0,
  onSeek,
  defaultAutoScroll = true,
  autoScroll: controlled,
  onAutoScrollChange,
  pauseOnInteraction = true,
  render,
  className,
  ...props
}: TranscriptProps) {
  const [autoScroll, setAutoScroll] = useControllable(
    controlled,
    defaultAutoScroll,
    onAutoScrollChange,
  );
  const scrollSetter = useRef(setAutoScroll);
  scrollSetter.current = setAutoScroll;
  const setFollowing = useCallback((next: boolean) => scrollSetter.current(next), []);
  const { ranges, register } = useRanges();
  const [store] = useState(() => createTimeStore(currentTime));
  const viewportRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    store.update(currentTime);
  }, [currentTime, store]);
  const activeId =
    ranges.find(
      (item) =>
        validStart(item.start) &&
        Number.isFinite(currentTime) &&
        currentTime >= item.start &&
        currentTime <
          rangeEnd(
            item,
            ranges,
            duration > 0 && Number.isFinite(duration) ? duration : Number.POSITIVE_INFINITY,
          ),
    )?.id ?? null;
  const value = useMemo(
    () => ({
      activeId,
      autoScroll,
      setAutoScroll: setFollowing,
      register,
      ranges,
      duration,
      onSeek,
      pauseOnInteraction,
      viewportRef,
    }),
    [activeId, autoScroll, setFollowing, register, ranges, duration, onSeek, pauseOnInteraction],
  );
  const element = useRender({
    defaultTagName: "div",
    render,
    props: {
      ...props,
      "data-slot": "transcript",
      "data-follow": autoScroll ? "following" : "paused",
      className: cn(
        "kind-surface flex min-h-0 min-w-0 flex-col rounded-[1.25rem] bg-surface text-foreground",
        className,
      ),
    },
  });
  return (
    <TimeContext.Provider value={store}>
      <TranscriptContext.Provider value={value}>{element}</TranscriptContext.Provider>
    </TimeContext.Provider>
  );
}
export type TranscriptContentProps = useRender.ComponentProps<"div">;
export function TranscriptContent({
  render,
  ref,
  className,
  onWheel,
  onTouchStart,
  onKeyDown,
  ...props
}: TranscriptContentProps) {
  const transcript = useTranscriptContext();
  const pause = () => {
    if (transcript.pauseOnInteraction) transcript.setAutoScroll(false);
  };
  return useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [transcript.viewportRef, ref] : transcript.viewportRef,
    props: {
      tabIndex: 0,
      "aria-label": "Transcript",
      ...props,
      "data-slot": "transcript-content",
      className: cn(
        "min-h-0 flex-1 [scrollbar-gutter:stable] focus-visible:outline-none focus-visible:shadow-kind-focus",
        render === undefined && "overflow-y-auto overscroll-contain",
        className,
      ),
      onWheel: (event: React.WheelEvent<HTMLDivElement>) => {
        onWheel?.(event);
        if (!event.defaultPrevented && event.deltaY !== 0) pause();
      },
      onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => {
        onTouchStart?.(event);
        if (!event.defaultPrevented) pause();
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          event.target === event.currentTarget &&
          ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)
        )
          pause();
      },
    },
  });
}
export type TranscriptListProps = ComponentProps<"div">;
export function TranscriptList({ className, ...props }: TranscriptListProps) {
  return (
    <div
      data-slot="transcript-list"
      className={cn("flex flex-col gap-0.5 p-2", className)}
      {...props}
    />
  );
}
export type TranscriptItemProps = useRender.ComponentProps<"div"> & { start: number; end?: number };
export function TranscriptItem({
  start,
  end,
  render,
  className,
  ref,
  id: providedId,
  ...props
}: TranscriptItemProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const transcript = useTranscriptContext();
  const node = useRef<HTMLDivElement | null>(null);
  const { ranges, register } = useRanges();
  const active = transcript.activeId === id;
  const { register: registerItem, autoScroll, viewportRef } = transcript;
  useEffect(() => registerItem({ id, start, end }), [registerItem, id, start, end]);
  useEffect(() => {
    if (!active || !autoScroll) return;
    const frame = requestAnimationFrame(() => {
      let viewport: HTMLElement | null = viewportRef.current;
      const item = node.current;
      if (!viewport || !item) return;
      // A render override can provide a scroll-area root with its own viewport.
      // Honor that inner viewport while staying inside the transcript boundary.
      let ancestor = item.parentElement;
      while (ancestor && viewport.contains(ancestor)) {
        const overflow = ancestor.ownerDocument.defaultView?.getComputedStyle(ancestor).overflowY;
        if (overflow === "auto" || overflow === "scroll") {
          viewport = ancestor;
          break;
        }
        if (ancestor === viewport) break;
        ancestor = ancestor.parentElement;
      }
      const bounds = viewport.getBoundingClientRect();
      const row = item.getBoundingClientRect();
      const inset = 8;
      const offset =
        row.top < bounds.top + inset || row.height > viewport.clientHeight - inset * 2
          ? row.top - bounds.top - inset
          : Math.max(0, row.bottom - bounds.bottom + inset);
      if (!offset) return;
      // Keep following local to the transcript. scrollIntoView also moves page
      // ancestors, which steals the reader's position in a surrounding thread.
      viewport.scrollBy({
        top: offset,
        behavior: viewport.ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)")
          .matches
          ? "instant"
          : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [active, autoScroll, viewportRef]);
  const effectiveEnd = rangeEnd(
    { id, start, end },
    transcript.ranges,
    transcript.duration > 0 && Number.isFinite(transcript.duration)
      ? transcript.duration
      : Number.POSITIVE_INFINITY,
  );
  const context = useMemo(
    () => ({ id, start, end: effectiveEnd, ranges, register }),
    [id, start, effectiveEnd, ranges, register],
  );
  const element = useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [node, ref] : node,
    props: {
      ...props,
      id,
      "data-slot": "transcript-item",
      "data-active": active ? "" : undefined,
      "aria-current": active ? true : undefined,
      className: cn(
        "group/transcript-item flex min-w-0 flex-wrap scroll-m-2 items-start gap-x-2 gap-y-1 rounded-xl border-s-2 border-transparent px-2.5 py-2 transition-colors duration-100 data-[active]:border-foreground/35 data-[active]:bg-secondary/50 motion-reduce:transition-none sm:flex-nowrap sm:gap-3 [&>div]:min-w-0",
        className,
      ),
    },
  });
  return <ItemContext.Provider value={context}>{element}</ItemContext.Provider>;
}
export type TranscriptSpeakerProps = ComponentProps<"div">;
export function TranscriptSpeaker({ className, ...props }: TranscriptSpeakerProps) {
  return (
    <div
      data-slot="transcript-speaker"
      className={cn(
        "min-w-0 max-w-full shrink-0 [overflow-wrap:anywhere] text-ai-label font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}
export type TranscriptTextProps = ComponentProps<"div"> & { interim?: boolean };
export function TranscriptText({ interim = false, className, ...props }: TranscriptTextProps) {
  return (
    <div
      data-slot="transcript-text"
      data-interim={interim ? "" : undefined}
      className={cn(
        "min-w-0 max-w-[70ch] basis-full break-words text-ai-body text-pretty text-foreground sm:basis-auto sm:flex-1",
        interim && "italic text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
export type TranscriptWordProps = useRender.ComponentProps<"span"> & {
  start: number;
  end?: number;
};
export function TranscriptWord({
  start,
  end,
  render,
  className,
  id: providedId,
  ...props
}: TranscriptWordProps) {
  const item = useItem();
  const store = useContext(TimeContext);
  if (!store) throw new Error("TranscriptWord requires a Transcript parent.");
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const { register } = item;
  useEffect(() => register({ id, start, end }), [register, id, start, end]);
  const effectiveEnd = Math.min(end ?? rangeEnd({ id, start }, item.ranges, item.end), item.end);
  const played = useSyncExternalStore(
    store.subscribe,
    () => validStart(start) && Number.isFinite(store.getTime()) && store.getTime() >= start,
    () => false,
  );
  const active = useSyncExternalStore(
    store.subscribe,
    () =>
      validStart(start) &&
      Number.isFinite(store.getTime()) &&
      store.getTime() >= start &&
      store.getTime() < effectiveEnd,
    () => false,
  );
  return useRender({
    defaultTagName: "span",
    render,
    props: {
      ...props,
      id,
      "data-slot": "transcript-word",
      "data-played": played ? "" : undefined,
      "data-active": active ? "" : undefined,
      className: cn(
        "rounded-[3px] text-muted-foreground transition-colors duration-75 data-[played]:text-foreground data-[active]:bg-foreground/10 data-[active]:text-foreground data-[active]:underline data-[active]:decoration-foreground/40 data-[active]:underline-offset-4 motion-reduce:transition-none",
        className,
      ),
    },
  });
}
function timestamp(seconds: number, duration: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "–:––";
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor(whole / 60) % 60;
  const remainder = `${whole % 60}`.padStart(2, "0");
  return duration >= 3600 || hours
    ? `${hours}:${`${minutes}`.padStart(2, "0")}:${remainder}`
    : `${Math.floor(whole / 60)}:${remainder}`;
}
export type TranscriptTimeProps = useRender.ComponentProps<"button"> & {
  format?: (seconds: number, duration: number) => string;
};
export function TranscriptTime({
  format = timestamp,
  onClick,
  render,
  className,
  children,
  disabled,
  ...props
}: TranscriptTimeProps) {
  const item = useItem();
  const transcript = useTranscriptContext();
  const text = format(item.start, transcript.duration);
  return useRender({
    defaultTagName: "button",
    render: render ?? <Button variant="ghost" size="sm" />,
    props: {
      type: "button",
      "aria-label": `Seek to ${text}`,
      ...props,
      disabled: disabled || !transcript.onSeek || !validStart(item.start),
      "data-slot": "transcript-time",
      className: cn(
        actionClass,
        "h-fit min-h-6 min-w-[3.5rem] shrink-0 items-start justify-start self-start rounded-lg px-2 py-0.5 text-start font-mono text-ai-meta font-medium tabular-nums text-muted-foreground hover:bg-secondary/60 hover:text-foreground group-data-[active]/transcript-item:text-foreground",
        className,
      ),
      children: children ?? text,
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled && validStart(item.start))
          transcript.onSeek?.(item.start);
      },
    },
  });
}
