"use client";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Popover as Primitive } from "radix-ui";
// Adapted from Motion Primitives' Morphing Popover (MIT).
// https://github.com/ibelick/motion-primitives/blob/main/components/core/morphing-popover.tsx
// Radix supplies focus management, dismissal, and collision-aware positioning.
import { createContext, useContext, useId, useRef } from "react";
import { cn } from "@/lib/utils";

const Context = createContext<{ open: boolean; id: string } | null>(null);
function usePopover() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("MorphingPopover provider missing");
  return ctx;
}
export function MorphingPopover({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const id = useId();
  const reduced = useReducedMotion();
  return (
    <Context.Provider value={{ open, id }}>
      <MotionConfig
        reducedMotion="user"
        transition={reduced ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.28 }}
      >
        <Primitive.Root open={open} onOpenChange={onOpenChange}>
          {children}
        </Primitive.Root>
      </MotionConfig>
    </Context.Provider>
  );
}
export function MorphingPopoverTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.button>) {
  return (
    <Primitive.Trigger asChild>
      <motion.button
        {...props}
        type="button"
        className={cn("custom-palette-button", className)}
        style={{ borderRadius: 999 }}
      >
        {children}
      </motion.button>
    </Primitive.Trigger>
  );
}
export function MorphingPopoverContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open } = usePopover();
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  return (
    <AnimatePresence>
      {open && (
        <Primitive.Portal forceMount>
          <Primitive.Content
            forceMount
            asChild
            align="end"
            sideOffset={9}
            collisionPadding={16}
            aria-label="Custom color palette"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              panelRef.current?.focus({ preventScroll: true });
            }}
            onFocusOutside={(event) => event.preventDefault()}
          >
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              className={cn("palette-editor glass-popover", className)}
              style={{ borderRadius: 22 }}
              initial={reduced ? false : { opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 3, scale: 0.99 }}
            >
              <motion.div
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.16, delay: reduced ? 0 : 0.06 }}
              >
                {children}
              </motion.div>
            </motion.div>
          </Primitive.Content>
        </Primitive.Portal>
      )}
    </AnimatePresence>
  );
}
