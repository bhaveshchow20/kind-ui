"use client";

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  CodeBlockHeader,
  CodeBlockLanguage,
} from "@kind-ui/primitives";
import { useId, useState } from "react";

const code = `export function welcome(name: string) {
  return {
    message: \`Welcome to Kind, \${name}.\`,
    ready: true,
  };
}`;

export default function CodeBlockExample() {
  const wrapId = useId();
  const [wrap, setWrap] = useState(true);
  const [feedback, setFeedback] = useState("");

  return (
    <div className="w-full max-w-lg space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Ready to use in your project</span>
        <label htmlFor={wrapId} className="flex items-center gap-2">
          <input
            id={wrapId}
            type="checkbox"
            checked={wrap}
            onChange={(event) => setWrap(event.target.checked)}
            className="accent-current"
          />
          Wrap lines
        </label>
      </div>
      <CodeBlock code={code} language="typescript" filename="welcome.ts" wrap={wrap}>
        <CodeBlockHeader>
          <CodeBlockLanguage className="text-foreground">welcome.ts</CodeBlockLanguage>
          <CodeBlockActions>
            <CodeBlockDownloadButton
              onDownload={() => setFeedback("Downloaded welcome.ts")}
              onError={() => setFeedback("Download unavailable. Try again.")}
            />
            <CodeBlockCopyButton
              onCopy={() => setFeedback("Code copied")}
              onError={() => setFeedback("Clipboard unavailable. Select and copy the code.")}
            />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent />
      </CodeBlock>
      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {feedback}
      </p>
    </div>
  );
}
