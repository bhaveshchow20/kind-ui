"use client";

import { Toolbar } from "@base-ui/react/toolbar";
import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import {
  Popover,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
} from "@kind-ui/primitives/popover";
import {
  type ComponentProps,
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { actionVariants, cn, useControllable } from "./utils.js";

type SelectionSnapshot = { text: string; range: Range | null; rect: DOMRect | null };
type SelectionContextValue = SelectionSnapshot & {
  open: boolean;
  setOpen: (open: boolean) => void;
  dismiss: () => void;
  clearSelection: () => void;
  contentEl: HTMLElement | null;
  setContentEl: (element: HTMLElement | null) => void;
  toolbarEl: HTMLElement | null;
  setToolbarEl: (element: HTMLElement | null) => void;
};
const SelectionContext = createContext<SelectionContextValue | null>(null);
function useSelectionContext() {
  const context = useContext(SelectionContext);
  if (!context) throw new Error("Selection parts must be rendered within <Selection>.");
  return context;
}
export type SelectionValue = SelectionSnapshot & {
  open: boolean;
  dismiss: () => void;
  clearSelection: () => void;
};
export function useSelection(): SelectionValue {
  const { text, range, rect, open, dismiss, clearSelection } = useSelectionContext();
  return { text, range, rect, open, dismiss, clearSelection };
}
export type SelectionProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: (text: string) => void;
};
const emptySelection: SelectionSnapshot = { text: "", range: null, rect: null };
export function Selection({
  children,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  onSelect,
}: SelectionProps) {
  const [open, setOpen] = useControllable(controlled, defaultOpen, onOpenChange);
  const [snapshot, setSnapshot] = useState<SelectionSnapshot>(emptySelection);
  const [contentEl, setContentEl] = useState<HTMLElement | null>(null);
  const [toolbarEl, setToolbarEl] = useState<HTMLElement | null>(null);
  const latest = useRef({ setOpen, onSelect, toolbarEl });
  latest.current = { setOpen, onSelect, toolbarEl };
  const dismiss = useCallback(() => latest.current.setOpen(false), []);
  const clearSelection = useCallback(() => {
    const selection = contentEl?.ownerDocument.getSelection();
    if (selection?.rangeCount) {
      // An action from one root must never erase a selection in another root.
      let contained = true;
      for (let index = 0; index < selection.rangeCount; index += 1) {
        const range = selection.getRangeAt(index);
        if (!contentEl?.contains(range.startContainer) || !contentEl.contains(range.endContainer))
          contained = false;
      }
      if (contained) selection.removeAllRanges();
    }
    setSnapshot(emptySelection);
    latest.current.setOpen(false);
  }, [contentEl]);
  useEffect(() => {
    if (!contentEl) return;
    const document = contentEl.ownerDocument;
    const view = document.defaultView;
    if (!view) return;
    let frame: number | undefined;
    let selecting = false;
    let disposed = false;
    let lastCommitted: {
      text: string;
      start: Node;
      end: Node;
      startOffset: number;
      endOffset: number;
    } | null = null;
    const inToolbar = (target: EventTarget | null) =>
      target instanceof view.Node && !!latest.current.toolbarEl?.contains(target);
    const read = (): SelectionSnapshot | null => {
      const selection = document.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
      for (let index = 0; index < selection.rangeCount; index += 1) {
        const selectedRange = selection.getRangeAt(index);
        if (
          !contentEl.contains(selectedRange.startContainer) ||
          !contentEl.contains(selectedRange.endContainer)
        )
          return null;
      }
      const range = selection.getRangeAt(0);
      if (!contentEl.contains(range.startContainer) || !contentEl.contains(range.endContainer))
        return null;
      const text = selection.toString();
      const rect = range.getClientRects().item(0);
      if (!text.trim() || !rect) return null;
      return { text, range, rect };
    };
    const commit = () => {
      if (disposed) return;
      const value = read();
      if (!value?.range) return;
      setSnapshot(value);
      latest.current.setOpen(true);
      const range = value.range;
      if (
        !lastCommitted ||
        lastCommitted.text !== value.text ||
        lastCommitted.start !== range.startContainer ||
        lastCommitted.end !== range.endContainer ||
        lastCommitted.startOffset !== range.startOffset ||
        lastCommitted.endOffset !== range.endOffset
      ) {
        lastCommitted = {
          text: value.text,
          start: range.startContainer,
          end: range.endContainer,
          startOffset: range.startOffset,
          endOffset: range.endOffset,
        };
        latest.current.onSelect?.(value.text);
      }
    };
    const scheduleCommit = () => {
      if (frame !== undefined) view.cancelAnimationFrame(frame);
      frame = view.requestAnimationFrame(() => {
        frame = undefined;
        commit();
      });
    };
    const selectionChange = () => {
      if (inToolbar(document.activeElement)) return;
      const value = read();
      if (value) {
        setSnapshot(value);
        // Touch selection handles and accessibility selection may update without a fresh pointerup.
        if (!selecting) scheduleCommit();
      } else {
        setSnapshot(emptySelection);
        latest.current.setOpen(false);
        lastCommitted = null;
      }
    };
    const pointerDown = (event: PointerEvent) => {
      if (inToolbar(event.target)) return;
      selecting = event.target instanceof view.Node && contentEl.contains(event.target);
      latest.current.setOpen(false);
      if (frame !== undefined) {
        view.cancelAnimationFrame(frame);
        frame = undefined;
      }
    };
    const pointerUp = (event: PointerEvent) => {
      if (inToolbar(event.target)) return;
      selecting = false;
      if (!(event.target instanceof view.Node) || !contentEl.contains(event.target)) return;
      scheduleCommit();
    };
    const touchEnd = (event: TouchEvent) => {
      if (inToolbar(event.target)) return;
      selecting = false;
      if (!(event.target instanceof view.Node) || !contentEl.contains(event.target)) return;
      scheduleCommit();
    };
    const keyUp = (event: KeyboardEvent) => {
      selecting = false;
      if (inToolbar(event.target) || event.key === "Escape" || event.key === "Tab") return;
      if (
        event.shiftKey ||
        event.key === "Shift" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a")
      )
        scheduleCommit();
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (frame !== undefined) view.cancelAnimationFrame(frame);
        latest.current.setOpen(false);
      }
      if (event.shiftKey) selecting = true;
    };
    document.addEventListener("selectionchange", selectionChange);
    document.addEventListener("pointerdown", pointerDown);
    document.addEventListener("pointerup", pointerUp);
    document.addEventListener("touchend", touchEnd);
    document.addEventListener("pointercancel", pointerUp);
    document.addEventListener("keyup", keyUp);
    document.addEventListener("keydown", keyDown);
    return () => {
      disposed = true;
      if (frame !== undefined) view.cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", selectionChange);
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("pointerup", pointerUp);
      document.removeEventListener("touchend", touchEnd);
      document.removeEventListener("pointercancel", pointerUp);
      document.removeEventListener("keyup", keyUp);
      document.removeEventListener("keydown", keyDown);
    };
  }, [contentEl]);
  return (
    <SelectionContext
      value={{
        ...snapshot,
        open,
        setOpen,
        dismiss,
        clearSelection,
        contentEl,
        setContentEl,
        toolbarEl,
        setToolbarEl,
      }}
    >
      <Popover
        open={open && snapshot.range !== null}
        modal={false}
        onOpenChange={(next, details) => {
          const target = details.event.target;
          // Selecting a different passage inside the scope should not be treated as an outside dismissal.
          if (
            !next &&
            details.reason === "outside-press" &&
            target instanceof Node &&
            contentEl?.contains(target)
          ) {
            details.cancel();
            return;
          }
          setOpen(next);
        }}
      >
        {children}
      </Popover>
    </SelectionContext>
  );
}
export type SelectionContentProps = useRender.ComponentProps<"div">;
export function SelectionContent({ render, ref, className, ...props }: SelectionContentProps) {
  const { setContentEl } = useSelectionContext();
  return useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [setContentEl, ref] : setContentEl,
    props: {
      ...props,
      "data-slot": "selection-content",
      className: cn(
        "min-w-0 max-w-[70ch] break-words text-pretty text-ai-body text-foreground selection:bg-secondary selection:text-foreground",
        className,
      ),
    },
  });
}
export type SelectionToolbarProps = Omit<ComponentProps<typeof PopoverPopup>, "render"> & {
  render?: ReactElement;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  edgePadding?: number;
};
export function SelectionToolbar({
  side = "top",
  align = "start",
  sideOffset = 8,
  alignOffset = 0,
  edgePadding = 8,
  className,
  onMouseDown,
  onPointerDown,
  render,
  initialFocus = false,
  finalFocus = false,
  ...props
}: SelectionToolbarProps) {
  const { range, rect, contentEl, setToolbarEl } = useSelectionContext();
  const anchor = useMemo(
    () => ({
      ...(contentEl ? { contextElement: contentEl } : {}),
      getBoundingClientRect: () => range?.getClientRects().item(0) ?? rect ?? new DOMRect(),
      getClientRects: () => range?.getClientRects() ?? [],
    }),
    [range, rect, contentEl],
  );
  return (
    <PopoverPortal>
      <PopoverPositioner
        anchor={anchor}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={edgePadding}
        collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "none" }}
        positionMethod="fixed"
        className="z-50 max-w-[calc(100vw-1rem)]"
      >
        <PopoverPopup
          data-slot="selection-toolbar"
          role="toolbar"
          aria-label="Selection actions"
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          {...props}
          render={<Toolbar.Root ref={setToolbarEl} {...(render ? { render } : {})} />}
          className={(state) =>
            cn(
              "flex max-w-full select-none flex-wrap items-center gap-1 rounded-xl border border-border/60 bg-elevated p-1 text-foreground shadow-sm",
              typeof className === "function" ? className(state) : className,
            )
          }
          onMouseDown={(event) => {
            onMouseDown?.(event);
            if (!event.defaultPrevented) event.preventDefault();
          }}
          onPointerDown={(event) => {
            onPointerDown?.(event);
            if (!event.defaultPrevented && event.pointerType === "mouse") event.preventDefault();
          }}
        />
      </PopoverPositioner>
    </PopoverPortal>
  );
}
export type SelectionButtonProps = Omit<ComponentProps<typeof Toolbar.Button>, "onSelect"> & {
  onSelect?: (text: string) => void;
  closeOnSelect?: boolean;
  clearOnSelect?: boolean;
  variant?: "ghost" | "outline" | "solid";
};
export function SelectionButton({
  onSelect,
  onClick,
  closeOnSelect = true,
  clearOnSelect = true,
  variant = "ghost",
  className,
  type = "button",
  ...props
}: SelectionButtonProps) {
  const { text, dismiss, clearSelection } = useSelectionContext();
  return (
    <Toolbar.Button
      data-slot="selection-button"
      type={type}
      {...props}
      render={
        props.render ?? <Button variant={variant === "solid" ? "default" : variant} size="sm" />
      }
      className={(state) =>
        cn(
          actionVariants(variant === "solid" ? "default" : variant),
          "min-h-7 min-w-7 gap-1 whitespace-nowrap rounded-lg px-1.5 py-0.5 text-ai-label font-medium [&>svg]:size-3.5 [&>svg]:shrink-0 coarse:min-h-11 coarse:min-w-11",
          variant !== "solid" && "text-foreground/80 hover:text-foreground",
          variant === "outline" && "border border-transparent bg-surface",
          typeof className === "function" ? className(state) : className,
        )
      }
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        onSelect?.(text);
        if (clearOnSelect) clearSelection();
        else if (closeOnSelect) dismiss();
      }}
    />
  );
}
export type SelectionSeparatorProps = ComponentProps<typeof Toolbar.Separator>;
export function SelectionSeparator({
  className,
  orientation = "vertical",
  ...props
}: SelectionSeparatorProps) {
  return (
    <Toolbar.Separator
      data-slot="selection-separator"
      aria-hidden="true"
      orientation={orientation}
      {...props}
      className={(state) =>
        cn(
          "shrink-0 bg-border/70",
          state.orientation === "horizontal" ? "my-1 h-px w-full" : "mx-0.5 h-4 w-px",
          typeof className === "function" ? className(state) : className,
        )
      }
    />
  );
}
