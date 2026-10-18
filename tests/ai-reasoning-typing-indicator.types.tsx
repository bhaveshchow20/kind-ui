import {
  ThinkingDots,
  type ThinkingDotsProps,
  TypingIndicator,
  type TypingIndicatorProps,
} from "@kind-ui/ai";
import {
  ThinkingDots as SubpathThinkingDots,
  type ThinkingDotsProps as SubpathThinkingDotsProps,
} from "@kind-ui/ai/thinking-dots";
import {
  TypingIndicator as SubpathTypingIndicator,
  type TypingIndicatorProps as SubpathTypingIndicatorProps,
} from "@kind-ui/ai/typing-indicator";
import { createRef } from "react";

const rootRef = createRef<HTMLDivElement>();
const dotsRef = createRef<HTMLSpanElement>();
const typingProps: TypingIndicatorProps = { role: "note", "aria-live": "off" };
const subpathTypingProps: SubpathTypingIndicatorProps = typingProps;
const dotsProps: ThinkingDotsProps = { title: "Activity", style: { color: "tomato" } };
const subpathDotsProps: SubpathThinkingDotsProps = dotsProps;

export const consumer = (
  <>
    <TypingIndicator {...typingProps} ref={rootRef} aria-label="Drafting" className="surface" />
    <SubpathTypingIndicator
      {...subpathTypingProps}
      ref={rootRef}
      aria-labelledby="host-label"
      onClick={(event) => event.currentTarget.focus()}
    />
    <ThinkingDots {...dotsProps} ref={dotsRef} />
    <SubpathThinkingDots
      {...subpathDotsProps}
      ref={dotsRef}
      onClick={(event) => event.currentTarget.focus()}
    />
    <TypingIndicator />
    <ThinkingDots />
  </>
);

// @ts-expect-error TypingIndicator owns its decorative contents.
export const typingChildren = <TypingIndicator>Replacement</TypingIndicator>;
// @ts-expect-error ThinkingDots owns its three dots.
export const dotsChildren = <ThinkingDots>Replacement</ThinkingDots>;
// @ts-expect-error ThinkingDots remains decorative.
export const invalidHidden: ThinkingDotsProps = { "aria-hidden": false };
// @ts-expect-error TypingIndicator uses a native div ref.
export const invalidRef = <TypingIndicator ref={createRef<HTMLButtonElement>()} />;
// @ts-expect-error TypingIndicator has no bubble geometry API.
export const invalidBubble = <SubpathTypingIndicator bubble />;
