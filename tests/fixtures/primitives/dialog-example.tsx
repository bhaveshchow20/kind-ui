"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@kind-ui/primitives/dialog";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@kind-ui/primitives/menu";
import { type CSSProperties, useId, useRef, useState } from "react";

export function DialogExample({
  open,
  onOpenChange,
  disabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const menuPopup = useRef<HTMLDivElement>(null);
  const noteId = useId();
  const [note, setNote] = useState("Keep the next step small and useful.");
  const [notice, setNotice] = useState("");
  return (
    <div ref={host} className="flex flex-col items-center gap-4">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger disabled={disabled}>Edit working note</DialogTrigger>
        <DialogContent ref={popup} themeSource={host} initialFocus={input}>
          <div className="space-y-2">
            <DialogTitle>A useful next step</DialogTitle>
            <DialogDescription>
              Edit your working note, then choose how to continue.
            </DialogDescription>
          </div>
          <div className="space-y-2">
            <label htmlFor={noteId} className="block text-sm font-medium">
              Working note
            </label>
            <input
              id={noteId}
              ref={input}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-border bg-field px-3 text-sm focus-visible:outline-none focus-visible:shadow-kind-focus"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Menu
              onOpenChange={(nextOpen, details) => {
                // Return focus before a closing child surface becomes inert.
                const active = menuTrigger.current?.ownerDocument.activeElement;
                if (
                  !nextOpen &&
                  ["escape-key", "item-press"].includes(details.reason) &&
                  active &&
                  menuPopup.current?.contains(active)
                )
                  menuTrigger.current?.focus({ preventScroll: true });
              }}
            >
              <MenuTrigger ref={menuTrigger}>Note actions</MenuTrigger>
              <MenuContent ref={menuPopup} container={popup}>
                <MenuItem onClick={() => setNote("Review the brief with the team.")}>
                  Use team review
                </MenuItem>
                <MenuItem onClick={() => setNote("Choose one useful next step.")}>
                  Use a smaller step
                </MenuItem>
              </MenuContent>
            </Menu>
            <div className="flex items-center gap-2">
              <DialogClose>Close note</DialogClose>
              <DialogClose onClick={() => setNotice("Working note saved for this session")}>
                Save note
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog>
        <DialogTrigger disabled={disabled}>Open custom dialog</DialogTrigger>
        <DialogContent
          themeSource={host}
          portalProps={{
            render: (
              <div
                className="dark"
                style={
                  {
                    fontFamily: "monospace",
                    "--dialog-accent": "rgb(180, 83, 9)",
                  } as CSSProperties
                }
              />
            ),
          }}
          id="custom-working-note"
          backdropProps={{ className: "bg-black/70" }}
          className={(state) => (state.open ? "p-8 rounded-none" : "")}
          style={{ borderColor: "var(--dialog-accent)", maxWidth: 420 }}
        >
          <DialogTitle render={<h3>A custom surface</h3>} className="text-lg">
            A custom surface
          </DialogTitle>
          <DialogDescription className="text-xs">
            A custom portal keeps its own font and accent while inheriting the surrounding theme.
          </DialogDescription>
          <DialogClose name="close-custom-note">Close custom dialog</DialogClose>
        </DialogContent>
      </Dialog>
      <p className="text-center text-sm text-muted-foreground">
        Your edits stay in this session. Escape closes the menu before the dialog.
      </p>
      <p role="status" className="text-sm text-muted-foreground">
        {notice}
      </p>
    </div>
  );
}
