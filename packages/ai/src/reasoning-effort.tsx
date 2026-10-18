"use client";

import { Button } from "@kind-ui/primitives/button";
import type { ComponentProps } from "react";
import { UsageBar } from "./context.js";
import { cn } from "./utils.js";

export interface EffortLevel {
  key: string;
  label: string;
  budget: number;
}

export type ReasoningEffortProps = Omit<ComponentProps<"div">, "children" | "onSelect"> & {
  levels: readonly EffortLevel[];
  selectedKey: string;
  spent: number;
  onSelect?: ((key: string) => void) | undefined;
  disabled?: boolean | undefined;
  label?: string | undefined;
  meterLabel?: string | undefined;
  animated?: boolean | undefined;
};

export function ReasoningEffort({
  levels,
  selectedKey,
  spent,
  onSelect,
  disabled = false,
  label = "Thinking",
  meterLabel = "Thinking budget used",
  animated = false,
  className,
  ...props
}: ReasoningEffortProps) {
  const keys = new Set<string>();
  for (const level of levels) {
    if (keys.has(level.key)) {
      throw new Error(`ReasoningEffort: duplicate level key "${level.key}".`);
    }
    keys.add(level.key);
  }
  const selected = levels.find((level) => level.key === selectedKey);
  const validSpent = Number.isFinite(spent) && spent >= 0;
  const validBudget =
    selected !== undefined && Number.isFinite(selected.budget) && selected.budget >= 0;
  const available = validSpent && validBudget && selected.budget > 0;
  const spentText = validSpent ? String(spent) : "—";
  const budgetText = validBudget ? String(selected.budget) : "—";
  const usageText = `${spentText} / ${budgetText} used`;
  const unavailable =
    validBudget && selected.budget === 0 ? "No budget available" : "Usage unavailable";

  return (
    <div
      {...props}
      data-slot="reasoning-effort"
      data-animated={animated || undefined}
      className={cn("flex min-w-0 max-w-full flex-col gap-2 text-ai-label", className)}
    >
      <fieldset
        aria-label={label}
        data-slot="reasoning-effort-levels"
        className="m-0 flex min-w-0 max-w-full flex-wrap items-center gap-1.5 border-0 p-0"
      >
        {levels.map((level) =>
          onSelect ? (
            <Button
              key={level.key}
              type="button"
              size="sm"
              variant={level.key === selectedKey ? "secondary" : "ghost"}
              disabled={disabled}
              aria-pressed={level.key === selectedKey}
              data-slot="reasoning-effort-level"
              className="whitespace-normal [overflow-wrap:anywhere]"
              onClick={(event) => {
                if (!disabled && !event.defaultPrevented) onSelect(level.key);
              }}
            >
              {level.label}
            </Button>
          ) : (
            <span
              key={level.key}
              aria-current={level.key === selectedKey ? "true" : undefined}
              data-slot="reasoning-effort-level"
              className="min-w-0 whitespace-normal [overflow-wrap:anywhere] aria-current:font-medium"
            >
              {level.label}
            </span>
          ),
        )}
      </fieldset>
      {available ? (
        <UsageBar
          min={0}
          max={1}
          value={spent >= selected.budget ? 1 : spent / selected.budget}
          warningThreshold={1}
          aria-label={meterLabel}
          aria-valuetext={usageText}
          className={cn(
            "min-w-0 max-w-full [overflow-wrap:anywhere]",
            animated &&
              "motion-safe:[&_[data-slot=usage-bar-fill]]:transition-[width] motion-safe:[&_[data-slot=usage-bar-fill]]:duration-150 motion-safe:[&_[data-slot=usage-bar-fill]]:ease-out",
          )}
        >
          <span data-slot="reasoning-effort-usage" className="min-w-0 [overflow-wrap:anywhere]">
            {usageText}
          </span>
        </UsageBar>
      ) : (
        <p
          data-slot="reasoning-effort-unavailable"
          className="min-w-0 text-muted-foreground [overflow-wrap:anywhere]"
        >
          {unavailable}: {usageText}
        </p>
      )}
    </div>
  );
}
