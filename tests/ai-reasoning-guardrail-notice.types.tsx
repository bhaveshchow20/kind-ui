import {
  GuardrailNotice,
  type GuardrailNoticeAlternative,
  type GuardrailNoticeProps,
} from "@kind-ui/ai";
import {
  type GuardrailNoticeAlternative as SubpathAlternative,
  GuardrailNotice as SubpathGuardrailNotice,
  type GuardrailNoticeProps as SubpathProps,
} from "@kind-ui/ai/guardrail-notice";
import { createRef } from "react";

const alternatives: readonly GuardrailNoticeAlternative[] = [
  { id: "summary", text: "A safe summary" },
  { id: "example", text: "A safe example", disabled: true },
];
const subpathAlternative: SubpathAlternative = alternatives[0] ?? {
  id: "fallback",
  text: "Fallback",
};
const props: GuardrailNoticeProps = {
  title: "Request unavailable",
  explanation: "Try another request.",
  alternatives,
};
const subpathProps: SubpathProps = {
  ...props,
  policy: "",
  alternativesLabel: "Try",
  disabled: false,
};
const root = createRef<HTMLDivElement>();

export const consumer = (
  <>
    <GuardrailNotice
      {...props}
      ref={root}
      aria-busy="true"
      role="alert"
      className="host"
      style={{ color: "tomato" }}
      onClick={(event) => event.preventDefault()}
      onPick={(alternative) => {
        const current: GuardrailNoticeAlternative = alternative;
        void current;
      }}
    />
    <SubpathGuardrailNotice
      {...subpathProps}
      alternatives={[subpathAlternative]}
      render={<section />}
    />
    <SubpathGuardrailNotice {...props} render={(nativeProps) => <article {...nativeProps} />} />
  </>
);

// @ts-expect-error A title is required.
export const missingTitle = <GuardrailNotice explanation="Explanation" />;
// @ts-expect-error An explanation is required.
export const missingExplanation = <GuardrailNotice title="Title" />;
export const richTitle = (
  // @ts-expect-error Title strings render literally.
  <GuardrailNotice title={<strong>Title</strong>} explanation="Explanation" />
);
// @ts-expect-error Explanation strings render literally.
export const richExplanation = <GuardrailNotice title="Title" explanation={<p>Explanation</p>} />;
// @ts-expect-error Warning tone is fixed by GuardrailNotice.
export const toneOverride = <GuardrailNotice {...props} tone="danger" />;
export const childrenOverride: GuardrailNoticeProps = {
  ...props,
  // @ts-expect-error The wrapper owns its content.
  children: "Other content",
};
// @ts-expect-error Stable identity is required for alternatives.
export const missingId = <GuardrailNotice {...props} alternatives={[{ text: "Missing ID" }]} />;
// @ts-expect-error Pick receives the full alternative object.
export const wrongCallback = <GuardrailNotice {...props} onPick={(_id: string) => {}} />;
// @ts-expect-error Recovery identity remains immutable.
subpathAlternative.id = "replacement";
