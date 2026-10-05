"use client";
import { useTheme } from "fumadocs-ui/provider/base";
import { Moon, Sun } from "lucide-react";
import { useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};
function reportFailure(error: unknown) {
  queueMicrotask(() => {
    throw error;
  });
}
function updateTheme(update: () => void, superseded: () => boolean) {
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  const width = innerWidth;
  const height = innerHeight;
  let resized = false;
  const onResize = () => {
    resized = true;
  };
  window.addEventListener("resize", onResize);
  const transition = document.startViewTransition(update);
  // A skipped visual transition still applies the theme. Callback failures must remain visible.
  void transition.updateCallbackDone.catch(reportFailure);
  // finished shares callback failures reported above; both outcomes release this transition's listener.
  const cleanup = () => window.removeEventListener("resize", onResize);
  void transition.finished.then(cleanup, cleanup);
  void transition.ready.catch(async (error: unknown) => {
    if (
      error instanceof DOMException &&
      ((error.name === "InvalidStateError" &&
        (resized || width !== innerWidth || height !== innerHeight) &&
        error.message.includes("Viewport size changed")) ||
        (error.name === "AbortError" &&
          superseded() &&
          error.message.includes("New ViewTransition started")))
    ) {
      return;
    }
    try {
      await transition.updateCallbackDone;
    } catch {
      return; // The callback failure was reported by updateCallbackDone.
    }
    reportFailure(error);
  });
}

/** Own theme transition promises while preserving the native Glass toggle's controls and styling. */
export function DocsThemeSwitch({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const requested = useRef<string | undefined>(undefined);
  const revision = useRef(0);
  function toggleTheme() {
    const next = (requested.current ?? resolvedTheme) === "dark" ? "light" : "dark";
    requested.current = next;
    const ownRevision = ++revision.current;
    updateTheme(
      () => {
        if (ownRevision !== revision.current) return;
        flushSync(() => setTheme(next));
        requested.current = undefined;
      },
      () => ownRevision !== revision.current,
    );
  }
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const active = mounted ? resolvedTheme : null;
  return (
    <button
      type="button"
      aria-label="Toggle Theme"
      data-theme-toggle=""
      className={cn(
        "inline-flex items-center rounded-full border p-1 overflow-hidden *:rounded-full",
        className,
      )}
      onClick={toggleTheme}
    >
      <Sun
        fill="currentColor"
        className={cn(
          "size-6.5 p-1.5",
          active === "light"
            ? "bg-fd-accent text-fd-accent-foreground"
            : "text-fd-muted-foreground",
        )}
      />
      <Moon
        fill="currentColor"
        className={cn(
          "size-6.5 p-1.5",
          active === "dark" ? "bg-fd-accent text-fd-accent-foreground" : "text-fd-muted-foreground",
        )}
      />
    </button>
  );
}
