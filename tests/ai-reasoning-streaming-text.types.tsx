import { StreamingText, type StreamingTextProps, type StreamingTextState } from "@kind-ui/ai";
import {
  StreamingText as SubpathStreamingText,
  type StreamingTextProps as SubpathStreamingTextProps,
  type StreamingTextState as SubpathStreamingTextState,
} from "@kind-ui/ai/streaming-text";
import { createRef } from "react";

const ref = createRef<HTMLParagraphElement>();
const state: StreamingTextState = "interrupted";
const subpathState: SubpathStreamingTextState = state;
const props: StreamingTextProps = {
  children: "Partial response",
  state: subpathState,
  caret: undefined,
  animated: undefined,
  ref,
  "aria-busy": false,
  className: "consumer-text",
  style: { whiteSpace: "break-spaces" },
  onClick(event) {
    event.currentTarget.focus();
  },
};
const subpathProps: SubpathStreamingTextProps = props;

export const consumer = (
  <>
    <StreamingText {...props} />
    <SubpathStreamingText {...subpathProps} state="streaming" caret animated>
      {"Unicode 👩🏽‍💻 partial wor"}
    </SubpathStreamingText>
    <StreamingText state={undefined}>{"Default complete"}</StreamingText>
  </>
);

// @ts-expect-error StreamingText requires the actual response string.
export const missingText = <StreamingText />;
// @ts-expect-error StreamingText does not render rich children.
export const richText: StreamingTextProps = { children: <strong>Text</strong> };
// @ts-expect-error StreamingText does not coerce non-string children.
export const numericText = <StreamingText>{0}</StreamingText>;
// @ts-expect-error StreamingText state must describe one of its three host states.
export const invalidState = <StreamingText state="loading">Text</StreamingText>;
// @ts-expect-error StreamingText always renders a paragraph.
export const customElement = <StreamingText as="div">Text</StreamingText>;
// @ts-expect-error StreamingText exposes a paragraph ref.
export const invalidRef = <StreamingText ref={createRef<HTMLButtonElement>()}>Text</StreamingText>;
