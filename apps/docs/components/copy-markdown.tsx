"use client";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ArrowUpRight, Check, ChevronDown, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
export function CopyMarkdown({ path }: { path: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      const response = await fetch(path);
      if (!response.ok) throw new Error();
      await navigator.clipboard.writeText(await response.text());
      setStatus("Copied");
    } catch {
      setStatus("Use Markdown link");
    }
  }
  return (
    <div className="copy-page">
      <Button variant="ghost" size="sm" onClick={copy}>
        {status === "Copied" ? <Check size={14} /> : <Copy size={14} />}
        {status || "Copy page"}
      </Button>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Page actions">
            <ChevronDown size={13} />
          </Button>
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content className="dropdown-content" align="end" sideOffset={6}>
            <Dropdown.Item asChild>
              <a href={path} className="dropdown-item" target="_blank" rel="noreferrer">
                Open Markdown
                <ArrowUpRight size={13} />
              </a>
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      <span className="sr-only" role="status">
        {status}
      </span>
    </div>
  );
}
