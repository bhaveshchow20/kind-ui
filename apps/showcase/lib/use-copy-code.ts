"use client";

import { useEffect, useRef, useState } from "react";

type CopyStatus = "idle" | "copied" | "failed";
export function useCopyCode(code: string) {
  const [result, setResult] = useState<{ code: string; status: CopyStatus }>({
    code,
    status: "idle",
  });
  const status = result.code === code ? result.status : "idle";
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current += 1;
      clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    const current = ++request.current;
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(code);
      window.dispatchEvent(new CustomEvent("kind-ui-copy", { detail: "code" }));
      if (current !== request.current) return;
      setResult({ code, status: "copied" });
      timer.current = setTimeout(() => setResult({ code, status: "idle" }), 1800);
    } catch {
      if (current === request.current) setResult({ code, status: "failed" });
    }
  }
  return {
    copy,
    copied: status === "copied",
    message:
      status === "copied"
        ? "Code copied"
        : status === "failed"
          ? "Could not copy. Open Code and select the example to copy manually."
          : "",
  };
}
