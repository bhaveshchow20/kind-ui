import { ThinkingIndicator, type ThinkingIndicatorProps } from "@kind-ui/ai";
import { ThinkingIndicator as SubpathThinkingIndicator } from "@kind-ui/ai/thinking-indicator";
import { createRef } from "react";

const rootRef = createRef<HTMLDivElement>();
const props: ThinkingIndicatorProps = {
  label: "Reviewing sources",
  elapsed: undefined,
  live: undefined,
  pulse: undefined,
};

export const consumer = (
  <>
    <ThinkingIndicator
      {...props}
      ref={rootRef}
      id="host-thinking"
      aria-label="Host context"
      onClick={(event) => event.currentTarget.focus()}
    />
    <SubpathThinkingIndicator label="Thinking" elapsed="" live="off" pulse={false} />
    <ThinkingIndicator label="Thinking" render={<section aria-label="Host section" />} />
    <ThinkingIndicator label="Thinking" render={(nativeProps) => <div {...nativeProps} />} />
  </>
);

// @ts-expect-error ThinkingIndicator requires a truthful host label.
export const missingLabel = <ThinkingIndicator />;
// @ts-expect-error ThinkingIndicator label remains a string.
export const invalidLabel = <ThinkingIndicator label={<strong>Thinking</strong>} />;
// @ts-expect-error ThinkingIndicator elapsed is host-formatted text.
export const invalidElapsed = <SubpathThinkingIndicator label="Thinking" elapsed={0} />;
// @ts-expect-error ThinkingIndicator offers polite or disabled label announcements.
export const invalidLive = <ThinkingIndicator label="Thinking" live="assertive" />;
// @ts-expect-error ThinkingIndicator owns its contents.
export const invalidChildren = <ThinkingIndicator label="Thinking">Replacement</ThinkingIndicator>;
