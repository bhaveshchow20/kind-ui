"use client";

import { animate as animateProgress } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import { usePlotArea } from "recharts";
import type { BarChartProps } from "../bar-chart.js";
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
  const reduced = useReducedMotion();
  const surface = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const node = surface.current;
    if (!node || reduced) return;
    const controls = animateProgress(0.4, 0.85, {
      duration: 1.3,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
      onUpdate: (value) => {
        node.style.opacity = String(value);
      },
    });
    return () => controls.stop();
  }, [reduced]);
  return (
    <div
      aria-hidden="true"
      data-kind-ui="candlestick-loading"
      className="absolute inset-0 pointer-events-none text-[color:var(--muted-foreground,GrayText)]"
    >
      <svg
        ref={surface}
        viewBox="0 0 600 280"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        role="presentation"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((index) => {
          const center = 35 + index * 48;
          const y = 80 + ((index * 37) % 70);
          return (
            <g key={index} fill="currentColor" stroke="currentColor" opacity=".6">
              <line x1={center} x2={center} y1={y - 23} y2={y + 47} />
              <rect x={center - 10} y={y} width={20} height={24 + ((index * 7) % 18)} />
              <rect
                x={center - 10}
                y={238 - ((index * 11) % 28)}
                width={20}
                height={18 + ((index * 11) % 28)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
