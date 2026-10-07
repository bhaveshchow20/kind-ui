"use client";

import { useEffect } from "react";

const warned = new WeakSet<Document>();
const message =
  'Kind UI chart styles are missing. Import "@kind-ui/charts/styles.css" once at your application entry (in Next.js, your root layout). If you intentionally supply all chart styles, define --kind-ui-styles-loaded: 1 on your chart roots.';

/** Runs only for development mounts; never changes chart styles or server markup. */
export function StylesheetWarning() {
  useEffect(() => {
    const doc = document;
    const view = doc.defaultView;
    if (!view || warned.has(doc)) return;
    let disposed = false;
    let frame = 0;
    const settled = new WeakSet<HTMLLinkElement>();
    const removers: (() => void)[] = [];
    const initialLinks = Array.from(
      doc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]'),
    );
    // Observe failures immediately rather than waiting for the frame check.
    const completed = (event: Event) => {
      const link = event.target;
      if (link instanceof HTMLLinkElement && link.relList.contains("stylesheet")) {
        settled.add(link);
        if (doc.readyState === "complete") schedule();
      }
    };
    doc.addEventListener("load", completed, true);
    doc.addEventListener("error", completed, true);
    removers.push(() => {
      doc.removeEventListener("load", completed, true);
      doc.removeEventListener("error", completed, true);
    });
    const check = () => {
      if (disposed) return;
      if (warned.has(doc)) {
        for (const remove of removers) remove();
        disposed = true;
        return;
      }
      const pending = Array.from(
        doc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]'),
      ).filter(
        (link) =>
          !link.disabled &&
          !link.sheet &&
          !settled.has(link) &&
          (!link.media || view.matchMedia(link.media).matches),
      );
      if (pending.length) return;
      const missing = Array.from(doc.querySelectorAll('[data-kind-ui="chart"]')).some(
        (root) =>
          view.getComputedStyle(root).getPropertyValue("--kind-ui-styles-loaded").trim() !== "1",
      );
      for (const remove of removers) remove();
      disposed = true;
      if (missing) {
        warned.add(doc);
        console.warn(message);
      }
    };
    // Give effects which add a stylesheet time to run and the browser time to apply it.
    const schedule = () => {
      if (disposed) return;
      view.cancelAnimationFrame(frame);
      frame = view.requestAnimationFrame(() => {
        frame = view.requestAnimationFrame(check);
      });
    };
    if (doc.readyState === "complete") schedule();
    else {
      const loaded = () => {
        // Window load settles every stylesheet which existed at mount, even if
        // its error occurred before this effect could observe it.
        for (const link of initialLinks) settled.add(link);
        schedule();
      };
      view.addEventListener("load", loaded, { once: true });
      removers.push(() => view.removeEventListener("load", loaded));
    }
    return () => {
      disposed = true;
      view.cancelAnimationFrame(frame);
      for (const remove of removers) remove();
    };
  }, []);
  return null;
}
