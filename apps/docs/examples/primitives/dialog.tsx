"use client";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Textarea,
} from "@kind-ui/primitives";
import { useId, useRef, useState } from "react";

export default function DialogExample() {
  const root = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("A calmer workspace for the team.");
  const [draft, setDraft] = useState(brief);
  const [saved, setSaved] = useState(false);

  return (
    <div ref={root} className="w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Project brief</p>
        <p className="text-sm text-muted-foreground">{brief}</p>
      </div>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setDraft(brief);
            setSaved(false);
          }
          setOpen(nextOpen);
        }}
      >
        <DialogTrigger>Edit brief</DialogTrigger>
        <DialogContent themeSource={root} className="max-w-md">
          <div className="space-y-1.5">
            <DialogTitle>Edit project brief</DialogTitle>
            <DialogDescription>
              Give your team a clear direction in a sentence or two.
            </DialogDescription>
          </div>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setBrief(draft.trim());
              setSaved(true);
              setOpen(false);
            }}
          >
            <div className="space-y-2">
              <label htmlFor={fieldId} className="text-sm font-medium">
                Brief
              </label>
              <Textarea
                id={fieldId}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose>Cancel</DialogClose>
              <Button type="submit" size="sm" disabled={!draft.trim()}>
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {saved ? "Project brief saved." : ""}
      </p>
    </div>
  );
}
