"use client";

import { Button } from "@kind-ui/primitives/button";
import { Textarea } from "@kind-ui/primitives/textarea";
import { useId, useState } from "react";

export default function TextareaExample() {
  const id = useId();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <form
      className="w-full max-w-sm rounded-2xl border border-border/60 bg-background p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!message.trim()) return;
        setMessage("");
        setSent(true);
      }}
    >
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        Leave a note
      </label>
      <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-muted-foreground">
        Share a little context with your team.
      </p>
      <Textarea
        id={id}
        name="note"
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          setSent(false);
        }}
        aria-describedby={`${id}-hint ${id}-count`}
        placeholder="What should we know?"
        maxLength={240}
        className="mt-4"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span id={`${id}-count`} className="text-xs tabular-nums text-muted-foreground">
          {message.length}/240
        </span>
        <Button type="submit" size="sm" disabled={!message.trim()}>
          Add note
        </Button>
      </div>
      <p role="status" className="mt-3 min-h-5 text-xs text-muted-foreground">
        {sent ? "Note added to this preview." : "Only visible in this preview."}
      </p>
    </form>
  );
}
