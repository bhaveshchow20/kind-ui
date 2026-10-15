"use client";

import { animate as animateProgress } from "motion/react";
import { type CSSProperties, useId, useLayoutEffect, useRef, useState } from "react";
import { usePlotArea } from "recharts";
import type { BarChartProps } from "../bar-chart.js";
import { useChart } from "../chart-context.js";
import { useLoadingProgress } from "../loading-motion.js";
import { useLoadingSeed } from "../loading-skeleton.js";
import { useReducedMotion } from "../motion-preference.js";
import { useCandlestick } from "./context.js";

/** Imperative Motion updates plain SVG so a consumer's strict LazyMotion remains intact. */
export function CandlestickReveal({
  animate,
  loading,
}: {
  animate: BarChartProps["animate"];
  loading: boolean | undefined;
}) {
  const context = useCandlestick();
  const area = usePlotArea();
  const reduced = useReducedMotion();
  const rect = useRef<SVGRectElement>(null);
  const revealed = useRef(false);
  const duration = typeof animate === "object" ? animate.revealDurationMs : undefined;
  const easing = typeof animate === "object" ? animate.revealEasing : undefined;
  useLayoutEffect(() => {
    const node = rect.current;
    if (!node || !area) return;
    const finish = () => node.setAttribute("width", String(area.width));
    context.interrupt.current = finish;
    if (loading) {
      revealed.current = false;
      finish();
      return;
    }
    if (
      reduced ||
      animate === false ||
      animate === undefined ||
      revealed.current ||
      !context.points.length
    ) {
      finish();
      return;
    }
    node.setAttribute("width", "0");
    let controls: ReturnType<typeof animateProgress> | undefined;
    let firstFrame = 0;
    let secondFrame = 0;
    const stop = () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      controls?.stop();
      finish();
    };
    context.interrupt.current = () => {
      revealed.current = true;
      stop();
    };
    // Native axes and responsive dimensions settle before their first painted entrance.
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (revealed.current) return;
        revealed.current = true;
        controls = animateProgress(0, area.width, {
          duration: Math.max(0, duration ?? 1000) / 1000,
          ease: easing ?? [0.25, 0.1, 0.25, 1],
          onUpdate: (value) => node.setAttribute("width", String(value)),
          onComplete: finish,
        });
      });
    });
    return stop;
  }, [area, context.points, context.interrupt, animate, reduced, loading, duration, easing]);
  return (
    <defs>
      <clipPath id={context.priceClipId} clipPathUnits="userSpaceOnUse">
        <rect
          x={area?.x ?? 0}
          y={area?.y ?? 0}
          width={area?.width ?? 0}
          height={(area?.height ?? 0) * (1 - context.volumeRatio)}
        />
      </clipPath>
      <clipPath id={context.volumeClipId} clipPathUnits="userSpaceOnUse">
        <rect
          x={area?.x ?? 0}
          y={(area?.y ?? 0) + (area?.height ?? 0) * (1 - context.volumeRatio)}
          width={area?.width ?? 0}
          height={(area?.height ?? 0) * context.volumeRatio}
        />
      </clipPath>
      <clipPath id={context.revealClipId} clipPathUnits="userSpaceOnUse">
        <rect
          ref={rect}
          data-kind-ui="candlestick-reveal"
          x={area?.x ?? 0}
          y={area?.y ?? 0}
          width={area?.width ?? 0}
          height={area?.height ?? 0}
        />
      </clipPath>
    </defs>
  );
}

/** Decorative placeholders never enter the observation model or inspection callbacks. */
export function CandlestickLoading() {
  const { nonce } = useChart();
  const id = `candlestick-loading-${useId().replace(/:/g, "")}`;
  const seed = useLoadingSeed(true);
  const [pulse, setPulse] = useState(0);
  const { progress, reduced } = useLoadingProgress(pulse, 1000, [0.25, 0.1, 0.25, 1], 264);
  const window = useRef<SVGRectElement>(null);
  useLayoutEffect(() => {
    if (reduced) return;
    const update = (value: number) =>
      window.current?.setAttribute("x", String((value - 0.5) * 640));
    update(progress.get());
    return progress.on("change", update);
  }, [progress, reduced]);
  const variation = (slot: number) => {
    let value = Math.imul(seed + pulse * 97 + slot * 31, 2654435761) >>> 0;
    value = Math.imul(value ^ (value >>> 16), 2246822507) >>> 0;
    return (value % 1000) / 1000;
  };
  return (
    <div
      aria-hidden="true"
      data-kind-ui="candlestick-loading"
      className="absolute inset-0 pointer-events-none text-[color:var(--muted-foreground,GrayText)]"
    >
      <svg
        viewBox="0 0 640 240"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        role="presentation"
        focusable="false"
        data-kind-ui="chart-loading-skeleton"
        data-family="candlestick"
        data-loading-motion="sweep"
        className="animate-[kind-ui-loading-pulse_var(--kind-ui-loading-cycle,1770ms)_linear_infinite] motion-reduce:animate-none"
        style={{ "--kind-ui-loading-cycle": "2200ms" } as CSSProperties}
        onAnimationIteration={(event) => {
          if (
            !reduced &&
            event.target === event.currentTarget &&
            event.animationName === "kind-ui-loading-pulse"
          )
            setPulse((value) => value + 1);
        }}
      >
        <style
          nonce={nonce}
        >{`@keyframes kind-ui-loading-pulse { 0%, 12%, 94%, 100% { opacity: 0; } 14%, 90% { opacity: 1; } }`}</style>
        <defs>
          <linearGradient id={`${id}-soft`}>
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.35" stopColor="white" />
            <stop offset="0.75" stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="240">
            {reduced ? (
              <rect width="640" height="240" fill="white" />
            ) : (
              <rect
                ref={window}
                data-kind-ui="loading-leading-window"
                x={-320}
                y={0}
                width={320}
                height={240}
                fill={`url(#${id}-soft)`}
              />
            )}
          </mask>
        </defs>
        <g mask={`url(#${id})`}>
          {Array.from({ length: 12 }, (_, index) => {
            const center = 30 + index * 53;
            const y = 35 + variation(index * 4) * 120;
            const body = 12 + variation(index * 4 + 1) * 38;
            const upperWick = 8 + variation(index * 4 + 2) * 22;
            const lowerWick = 8 + variation(index * 4 + 3) * 22;
            return (
              <g
                key={center}
                data-kind-ui="candlestick-loading-mark"
                fill="currentColor"
                stroke="currentColor"
                opacity=".6"
              >
                <line x1={center} x2={center} y1={y - upperWick} y2={y + body + lowerWick} />
                <rect x={center - 10} y={y} width={20} height={body} />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
