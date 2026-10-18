import { type EffortLevel, ReasoningEffort, type ReasoningEffortProps } from "@kind-ui/ai";
import {
  ReasoningEffort as SubpathEffort,
  type EffortLevel as SubpathLevel,
  type ReasoningEffortProps as SubpathProps,
} from "@kind-ui/ai/reasoning-effort";
import { createRef } from "react";

const levels: readonly EffortLevel[] = [{ key: "low", label: "Quick", budget: 100 }];
const subpathLevels: readonly SubpathLevel[] = levels;
const props: ReasoningEffortProps = {
  levels: subpathLevels,
  selectedKey: "low",
  spent: 0,
  ref: createRef<HTMLDivElement>(),
  onSelect(key) {
    key.toUpperCase();
  },
  disabled: undefined,
  label: undefined,
  meterLabel: undefined,
  animated: undefined,
  style: { color: "tomato" },
  onClick(event) {
    event.currentTarget.focus();
  },
};
const subpathProps: SubpathProps = props;
export const consumer = (
  <>
    <ReasoningEffort {...props} />
    <SubpathEffort {...subpathProps} onSelect={undefined} disabled animated />
  </>
);

// @ts-expect-error ReasoningEffort requires explicit levels.
export const missingLevels = <ReasoningEffort selectedKey="low" spent={0} />;
// @ts-expect-error ReasoningEffort requires host selection.
export const missingSelection = <ReasoningEffort levels={levels} spent={0} />;
// @ts-expect-error Spend is an explicit measured number.
export const invalidSpend = <ReasoningEffort levels={levels} selectedKey="low" spent="0" />;
// @ts-expect-error Effort budgets are numeric.
export const invalidLevel: EffortLevel = { key: "low", label: "Quick", budget: "100" };
export const nativeSelection: ReasoningEffortProps = {
  levels,
  selectedKey: "low",
  spent: 0,
  // @ts-expect-error Selection callbacks receive the key, not a native event.
  onSelect: (event: Event) => event.preventDefault(),
};
export const children: ReasoningEffortProps = {
  ...props,
  // @ts-expect-error ReasoningEffort has fixed inner content.
  children: "Extra",
};
// @ts-expect-error ReasoningEffort exposes a native div ref.
export const wrongRef = <ReasoningEffort {...props} ref={createRef<HTMLButtonElement>()} />;
