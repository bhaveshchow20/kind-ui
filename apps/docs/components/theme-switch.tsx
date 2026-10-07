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
  let resizeCancelled = false;
  let readyRejected = false;
  let transition: ViewTransition | undefined;
  const viewportChanged = () => width !== innerWidth || height !== innerHeight;
  const cancelForResize = () => {
    if (resizeCancelled || readyRejected || !viewportChanged()) return;
    resizeCancelled = true;
    transition?.skipTransition();
  };
  window.addEventListener("resize", cancelForResize);
  transition = document.startViewTransition(update);
  const ownTransition = transition;
  // Some browsers defer resize events until after snapshot rejection. Check dimensions
  // after the callback too; skipping the visual transition still applies the theme.
  // Observe rejection first so a later resize cannot relabel an existing snapshot failure.
  void ownTransition.ready.catch(async (error: unknown) => {
    readyRejected = true;
    try {
      await ownTransition.updateCallbackDone;
    } catch {
      return; // The callback failure was reported by updateCallbackDone.
    }
    if (
      error instanceof DOMException &&
      ((error.name === "AbortError" && (resizeCancelled || superseded())) ||
        (error.name === "InvalidStateError" && resizeCancelled && viewportChanged()))
    ) {
      return;
    }
    reportFailure(error);
  });
  void ownTransition.updateCallbackDone.then(cancelForResize, reportFailure);
  const cleanup = () => window.removeEventListener("resize", cancelForResize);
  void ownTransition.finished.then(cleanup, cleanup);
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
