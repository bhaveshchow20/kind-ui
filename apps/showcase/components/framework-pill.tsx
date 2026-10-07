"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrandIcon } from "@/components/brand-icon";

const labels = {
  framework: ["React.js", "Next.js"],
  stack: ["Recharts", "Motion"],
  agent: ["Codex", "Claude", "Gemini", "Grok", "your agents"],
} as const;
type PillGroup = keyof typeof labels;

function BrandPill({
  group,
  index,
  onAdvance,
  onPause,
}: {
  group: PillGroup;
  index: number;
  onAdvance: (group: PillGroup) => void;
  onPause: (group: PillGroup, paused: boolean) => void;
}) {
  const hovered = useRef(false);
  const focused = useRef(false);
  const reduceMotion = useReducedMotion();
  const names = labels[group];
  const measureRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [width, setWidth] = useState<number>();

  useLayoutEffect(() => {
    const measure = measureRef.current;
    const button = buttonRef.current;
    if (!measure || !button) return;
    let active = true;
    const update = () => {
      if (!active) return;
      const style = getComputedStyle(button);
      const chrome =
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight) +
        Number.parseFloat(style.borderLeftWidth) +
        Number.parseFloat(style.borderRightWidth);
      setWidth(Math.ceil(measure.getBoundingClientRect().width + chrome));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(measure);
    void document.fonts.ready.then(update);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      animate={{ width: width ?? "auto" }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
      className={`brand-pill brand-pill-${group}`}
      type="button"
      aria-label={
        group === "agent"
          ? "Switch agent: Codex, Claude, Gemini, Grok, or your agents"
          : `Switch between ${names.join(" and ")}`
      }
      onClick={() => onAdvance(group)}
      onMouseEnter={() => {
        hovered.current = true;
        onPause(group, true);
      }}
      onMouseLeave={() => {
        hovered.current = false;
        onPause(group, focused.current);
      }}
      onFocus={() => {
        focused.current = true;
        onPause(group, true);
      }}
      onBlur={() => {
        focused.current = false;
        onPause(group, hovered.current);
      }}
    >
      <span ref={measureRef} className="brand-pill-sizer" aria-hidden="true">
        <BrandIcon name={names[index]} />
        {names[index]}
      </span>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={names[index]}
          className="brand-pill-face"
          initial={reduceMotion ? false : { y: "55%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: "-55%", opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <BrandIcon name={names[index]} />
          {names[index]}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export function HeroHeadline() {
  const reduced = useReducedMotion();
  const [indices, setIndices] = useState<Record<PillGroup, number>>({
    framework: 0,
    stack: 0,
    agent: 0,
  });
  const [paused, setPaused] = useState<Record<PillGroup, boolean>>({
    framework: false,
    stack: false,
    agent: false,
  });
  const previous = useRef<PillGroup | null>(null);

  function advance(group: PillGroup) {
    previous.current = group;
    setIndices((current) => ({ ...current, [group]: (current[group] + 1) % labels[group].length }));
  }
  function pause(group: PillGroup, value: boolean) {
    setPaused((current) => (current[group] === value ? current : { ...current, [group]: value }));
  }
  useEffect(() => {
    if (reduced) return;
    let timer: number;
    function schedule() {
      timer = window.setTimeout(
        () => {
          const available = (Object.keys(labels) as PillGroup[]).filter(
            (group) => !paused[group] && group !== previous.current,
          );
          if (!document.hidden && available.length) {
            const group = available[Math.floor(Math.random() * available.length)];
            previous.current = group;
            setIndices((current) => ({
              ...current,
              [group]: (current[group] + 1) % labels[group].length,
            }));
          }
          schedule();
        },
        2000 + Math.random() * 1000,
      );
    }
    schedule();
    return () => window.clearTimeout(timer);
  }, [paused, reduced]);

  const pill = (group: PillGroup) => (
    <BrandPill group={group} index={indices[group]} onAdvance={advance} onPause={pause} />
  );
  return (
    <h1
      id="hero-title"
      aria-label="Interactive charts for React.js and Next.js, built on Recharts and Motion and ready for Codex, Claude, Gemini, Grok and your agents."
    >
      <span className="hero-sentence">Interactive charts for {pill("framework")},</span>
      <span className="hero-sentence">
        built on {pill("stack")} and ready for {pill("agent")}.
      </span>
    </h1>
  );
}
