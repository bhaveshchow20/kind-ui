"use client";

import { Badge } from "@kind-ui/primitives/badge";
import { Button } from "@kind-ui/primitives/button";
import { ShieldAlert } from "lucide-react";
import { Callout, CalloutContent, CalloutIcon, type CalloutProps } from "./callout.js";

export interface GuardrailNoticeAlternative {
  readonly id: string;
  readonly text: string;
  readonly disabled?: boolean;
}

export type GuardrailNoticeProps = Omit<CalloutProps, "children" | "title" | "tone"> & {
  title: string;
  explanation: string;
  policy?: string;
  alternatives?: readonly GuardrailNoticeAlternative[];
  alternativesLabel?: string;
  disabled?: boolean;
  onPick?: (alternative: GuardrailNoticeAlternative) => void;
};

export function GuardrailNotice({
  title,
  explanation,
  policy,
  alternatives = [],
  alternativesLabel = "Try instead",
  disabled = false,
  onPick,
  ...props
}: GuardrailNoticeProps) {
  const ids = new Set<string>();
  for (const alternative of alternatives) {
    if (alternative.id.length === 0) {
      throw new Error("GuardrailNotice: alternative IDs must be nonempty.");
    }
    if (ids.has(alternative.id)) {
      throw new Error(`GuardrailNotice: duplicate alternative ID "${alternative.id}".`);
    }
    ids.add(alternative.id);
  }

  return (
    <Callout {...props} tone="warning" data-guardrail-notice="">
      <CalloutIcon>
        <ShieldAlert size={16} strokeWidth={1.5} nonScalingStroke />
      </CalloutIcon>
      <CalloutContent className="[overflow-wrap:anywhere]">
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          <h3 data-slot="guardrail-notice-title" className="min-w-0 [overflow-wrap:anywhere]">
            {title}
          </h3>
          {policy !== undefined && (
            <Badge tone="warning" size="sm" className="whitespace-normal [overflow-wrap:anywhere]">
              {policy}
            </Badge>
          )}
        </div>
        <p data-slot="guardrail-notice-explanation" className="mt-1 [overflow-wrap:anywhere]">
          {explanation}
        </p>
        {alternatives.length > 0 && (
          <div data-slot="guardrail-notice-alternatives" className="mt-3 min-w-0">
            <p data-slot="guardrail-notice-alternatives-label" className="font-medium">
              {alternativesLabel}
            </p>
            <ul className="mt-1.5 flex min-w-0 flex-col items-start gap-1.5">
              {alternatives.map((alternative) => (
                <li key={alternative.id} className="max-w-full min-w-0 [overflow-wrap:anywhere]">
                  {onPick ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={disabled || alternative.disabled}
                      className="whitespace-normal [overflow-wrap:anywhere]"
                      onClick={(event) => {
                        if (!disabled && !alternative.disabled && !event.defaultPrevented) {
                          onPick(alternative);
                        }
                      }}
                    >
                      {alternative.text}
                    </Button>
                  ) : (
                    alternative.text
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CalloutContent>
    </Callout>
  );
}
