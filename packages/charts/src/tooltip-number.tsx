"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(change: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}
const snapshot = () => window.matchMedia(query).matches;
const serverSnapshot = () => true;
const reel = Array.from({ length: 30 }, (_, index) => index);

// Keep a bounded repeating reel. Interrupted transitions start at the currently painted digit.
function Digit({ digit }: { digit: number }) {
  // Newly opened tooltips should paint their actual value immediately.
  // Subsequent value updates still animate from the painted digit.
  const position = useMotionValue(digit + 10);
  const y = useTransform(position, (value) => `${-value}lh`);
  useLayoutEffect(() => {
    const current = position.get();
    const target = [digit, digit + 10, digit + 20].reduce((closest, next) =>
      Math.abs(next - current) < Math.abs(closest - current) ? next : closest,
    );
    const controls = animate(position, target, {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => position.set(digit + 10),
    });
    return () => controls.stop();
  }, [digit, position]);
  return (
    <span data-kind-ui="tooltip-digit">
      <motion.span data-kind-ui="tooltip-digit-reel" style={{ y }}>
        {reel.map((index) => (
          <span key={index}>{index % 10}</span>
        ))}
      </motion.span>
    </span>
  );
}

function RollingNumber({ text }: { text: string }) {
  const final = useRef<HTMLSpanElement>(null);
  const widest = useRef(0);
  const width = useMotionValue<string | number>("auto");
  useLayoutEffect(() => {
    const node = final.current;
    if (!node) return;
    let controls: ReturnType<typeof animate> | undefined;
    const measure = () => {
      const next = node.getBoundingClientRect().width;
      if (next <= widest.current) return;
      controls?.stop();
      if (widest.current === 0) width.set(next);
      else controls = animate(width, next, { duration: 0.16, ease: "easeOut" });
      widest.current = next;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      controls?.stop();
      observer.disconnect();
    };
  }, [width]);
  const characters = text.match(/[0-9]|[^0-9]+/g) ?? [];
  let place = characters.filter((character) => /^[0-9]$/.test(character)).length;
  return (
    <motion.span data-kind-ui="tooltip-number" style={{ width }}>
      <span ref={final} data-kind-ui="tooltip-number-final">
        {text}
      </span>
      <span aria-hidden="true" data-kind-ui="tooltip-number-visual">
        {characters.map((character) =>
          /^[0-9]$/.test(character) ? (
            <Digit key={`digit-${--place}`} digit={Number(character)} />
          ) : (
            <span key={`text-${place}-${character}`}>{character}</span>
          ),
        )}
      </span>
    </motion.span>
  );
}

/** Private presentation only: formatters and native tooltip selection remain upstream. */
export function TooltipNumber({ value }: { value: string | number }) {
  const reduced = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const text = String(value);
  // Mixed scripts, non-ASCII digits and bidi text keep their original shaping/order.
  const unsupported =
    !/[0-9]/.test(text) ||
    /\p{Decimal_Number}/u.test(text.replace(/[0-9]/g, "")) ||
    /[\u0590-\u08ff\u200e\u200f\u202a-\u202e\u2066-\u2069]/.test(text);
  return reduced || unsupported ? value : <RollingNumber text={text} />;
}
