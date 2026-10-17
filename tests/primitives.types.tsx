import {
  Badge,
  Button,
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  CodeBlockHeader,
  CodeBlockLanguage,
  type CodeBlockToken,
  Collapsible,
  CollapsibleContent,
  CollapsiblePreviewContent,
  CollapsibleTrigger,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Status,
  Textarea,
} from "@kind-ui/primitives";
import { createRef } from "react";

const buttonRef = createRef<HTMLButtonElement>();
const panelRef = createRef<HTMLDivElement>();
const badgeRef = createRef<HTMLSpanElement>();

export const composed = (
  <>
    <Button
      ref={buttonRef}
      type="submit"
      onAnimationStart={(event) =>
        event.currentTarget.setAttribute("data-animation", event.animationName)
      }
      onDragStart={(event) => event.dataTransfer.setData("text/plain", "Kind")}
      className={(state) => (state.disabled ? "opacity-50" : "")}
    />
    <Popover open={false} onOpenChange={(_open, details) => details.cancel()}>
      <PopoverTrigger ref={buttonRef} render={<button type="button" />}>
        Edit
      </PopoverTrigger>
      <PopoverContent ref={panelRef} side="right" positionerProps={{ collisionPadding: 12 }} />
    </Popover>
    <Menu onOpenChange={(_open, details) => details.cancel()}>
      <MenuTrigger ref={buttonRef}>Actions</MenuTrigger>
      <MenuContent ref={panelRef}>
        <MenuItem disabled onClick={(event) => event.preventDefault()}>
          Unavailable
        </MenuItem>
      </MenuContent>
    </Menu>
    <Collapsible ref={panelRef} open={false} onOpenChange={(_open, details) => details.cancel()}>
      <CollapsibleTrigger ref={buttonRef}>Details</CollapsibleTrigger>
      <CollapsibleContent ref={panelRef} keepMounted />
    </Collapsible>
    <CollapsiblePreviewContent
      open={false}
      previewHeight={72}
      ref={panelRef}
      returnFocusRef={buttonRef}
      style={{ maxHeight: "50%" }}
    >
      A persistent preview
    </CollapsiblePreviewContent>
    <Badge ref={badgeRef} tone="success">
      Saved
    </Badge>
    <Status ref={badgeRef} state="pending" />
  </>
);

// @ts-expect-error The host must choose a supported semantic tone.
export const invalidTone = <Badge tone="anything" />;
// @ts-expect-error Status remains explicit rather than accepting unknown lifecycle strings.
export const invalidStatus = <Status state="executed-remotely" />;
// @ts-expect-error A panel ref cannot silently replace a native textarea ref.
export const invalidTextareaRef = <Textarea ref={panelRef} />;

const codeTokens: CodeBlockToken[][] = [
  [{ content: "const answer = 42", color: "#123", htmlStyle: { "--shiki-dark": "#abc" } }],
];
export const codeBlock = (
  <CodeBlock
    ref={panelRef}
    code="const answer = 42"
    language="ts"
    tokens={codeTokens}
    onClick={(event) => event.currentTarget.focus()}
  >
    <CodeBlockHeader ref={panelRef}>
      <CodeBlockLanguage ref={badgeRef}>TypeScript</CodeBlockLanguage>
      <CodeBlockActions ref={panelRef}>
        <CodeBlockDownloadButton
          ref={buttonRef}
          filename="answer.ts"
          onDownload={() => undefined}
          onError={(error) => error.message}
        />
        <CodeBlockCopyButton
          ref={buttonRef}
          timeout={1500}
          copiedChildren="Copied"
          copiedLabel="Source copied"
          onCopy={() => undefined}
          onError={(error) => error.message}
          onClick={(event) => event.preventDefault()}
        >
          Copy
        </CodeBlockCopyButton>
      </CodeBlockActions>
    </CodeBlockHeader>
    <CodeBlockContent
      ref={panelRef}
      tabIndex={0}
      onKeyDown={(event) => event.currentTarget.focus()}
    />
  </CodeBlock>
);
// @ts-expect-error CodeBlock requires the exact source for its actions.
export const missingCode = <CodeBlock />;
// @ts-expect-error Highlighted tokens are text, never raw HTML nodes.
export const invalidCodeToken = <CodeBlock code="" tokens={[[{ content: <b>code</b> }]]} />;
