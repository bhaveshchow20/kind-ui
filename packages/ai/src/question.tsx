"use client";

import { useRender } from "@base-ui/react/use-render";
import { Button } from "@kind-ui/primitives/button";
import { Textarea } from "@kind-ui/primitives/textarea";
import { Check } from "lucide-react";
import {
  Children,
  type ComponentProps,
  createContext,
  type FormEvent,
  isValidElement,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { actionVariants, cn, useControllable } from "./utils.js";

export interface QuestionValue {
  selectedValues: readonly string[];
  text: string;
}
export interface QuestionResponse {
  selectedValues: readonly string[];
  text?: string;
}
export type QuestionSelectionMode = "single" | "multiple";
interface QuestionContextValue {
  value: QuestionValue;
  setValue: (value: QuestionValue) => void;
  disabled: boolean;
  selectionMode: QuestionSelectionMode;
  name: string;
  promptId: string;
  descriptionId: string;
}
const QuestionContext = createContext<QuestionContextValue | null>(null);
export function useQuestion() {
  const context = useContext(QuestionContext);
  if (!context) throw new Error("Question parts require a Question parent.");
  return context;
}
export type QuestionProps = Omit<ComponentProps<"form">, "value" | "defaultValue" | "onSubmit"> & {
  value?: QuestionValue;
  defaultValue?: QuestionValue;
  disabled?: boolean;
  selectionMode?: QuestionSelectionMode;
  onValueChange?: (value: QuestionValue) => void;
  onSubmit?: (
    response: QuestionResponse,
    event: FormEvent<HTMLFormElement>,
  ) => void | Promise<void>;
  onSubmitError?: (error: unknown) => void;
};
export function Question({
  value: controlled,
  defaultValue = { selectedValues: [], text: "" },
  disabled = false,
  selectionMode = "single",
  onValueChange,
  onSubmit,
  onSubmitError,
  className,
  children,
  ...props
}: QuestionProps) {
  const [value, setValue] = useControllable(controlled, defaultValue, onValueChange);
  const name = useId();
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || locked.current || (!value.selectedValues.length && !value.text.trim())) return;
    locked.current = true;
    setPending(true);
    setFailed(false);
    try {
      const text = value.text.trim();
      await onSubmit?.(
        { selectedValues: [...value.selectedValues], ...(text ? { text } : {}) },
        event,
      );
    } catch (error) {
      if (mounted.current) {
        setFailed(true);
        onSubmitError?.(error);
      }
    } finally {
      if (mounted.current) {
        locked.current = false;
        setPending(false);
      }
    }
  }
  return (
    <QuestionContext.Provider
      value={{
        value,
        setValue,
        disabled: disabled || pending,
        selectionMode,
        name,
        promptId: `${name}-prompt`,
        descriptionId: `${name}-description`,
      }}
    >
      <form
        data-slot="question"
        aria-busy={pending || undefined}
        className={cn(
          "kind-surface flex min-w-0 flex-col gap-3 rounded-[1.25rem] bg-surface p-4 text-foreground [&>[data-slot=question-prompt]+[data-slot=question-description]]:-mt-2",
          className,
        )}
        {...props}
        onSubmit={submit}
      >
        {children}
        <span role="status" aria-atomic="true" className="sr-only">
          {pending ? "Submitting answer…" : ""}
        </span>
        {failed && (
          <p role="alert" className="text-ai-description text-danger-text">
            Your answer could not be submitted. Try again.
          </p>
        )}
      </form>
    </QuestionContext.Provider>
  );
}
export type QuestionPromptProps = ComponentProps<"p">;
export function QuestionPrompt({ className, ...props }: QuestionPromptProps) {
  const { promptId } = useQuestion();
  return (
    <p
      id={promptId}
      data-slot="question-prompt"
      className={cn("max-w-[65ch] text-ai-title font-medium text-pretty", className)}
      {...props}
    />
  );
}
export type QuestionDescriptionProps = ComponentProps<"p">;
export function QuestionDescription({ className, ...props }: QuestionDescriptionProps) {
  const { descriptionId } = useQuestion();
  return (
    <p
      id={descriptionId}
      data-slot="question-description"
      className={cn(
        "max-w-[65ch] text-ai-description text-pretty text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
export type QuestionOptionsProps = ComponentProps<"fieldset">;
export function QuestionOptions({ className, ...props }: QuestionOptionsProps) {
  const { disabled, promptId } = useQuestion();
  return (
    <fieldset
      aria-labelledby={promptId}
      disabled={disabled}
      data-slot="question-options"
      className={cn("m-0 grid min-w-0 gap-1.5 border-0 p-0", className)}
      {...props}
    />
  );
}
export type QuestionOptionProps = Omit<
  ComponentProps<"input">,
  "value" | "type" | "checked" | "defaultChecked" | "children"
> & { value: string; children?: ReactNode };
function ChoiceGlyph({ multiple }: { multiple: boolean }) {
  const className =
    "pointer-events-none absolute text-primary-foreground opacity-0 peer-checked:opacity-100 forced-colors:hidden";
  return multiple ? (
    <Check aria-hidden="true" size={14} strokeWidth={1.5} nonScalingStroke className={className} />
  ) : (
    <span
      aria-hidden="true"
      className={cn(className, "size-1.5 rounded-full bg-primary-foreground")}
    />
  );
}
const choiceClass =
  "flex min-h-11 min-w-0 cursor-pointer items-start gap-2.5 rounded-lg border border-transparent bg-transparent [overflow-wrap:anywhere] px-3 py-2 text-start text-ai-body text-foreground transition-colors motion-reduce:transition-none hover:bg-secondary/50 has-[:checked]:border-foreground/15 has-[:checked]:bg-secondary/60 has-[:disabled]:cursor-default has-[:disabled]:opacity-50 coarse:min-h-11";
export function QuestionOption({
  value,
  children,
  className,
  disabled,
  onChange,
  ...props
}: QuestionOptionProps) {
  const question = useQuestion();
  return (
    <label data-slot="question-option" className={cn(choiceClass, className)}>
      <span className="relative mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center">
        <input
          {...props}
          className={cn(
            "peer size-full shrink-0 appearance-none rounded-[5px] border border-foreground/15 bg-background checked:border-primary checked:bg-primary disabled:cursor-default forced-colors:appearance-auto focus-visible:outline-none focus-visible:shadow-kind-focus",
            question.selectionMode === "single" && "rounded-full",
          )}
          type={question.selectionMode === "single" ? "radio" : "checkbox"}
          name={props.name ?? question.name}
          value={value}
          checked={question.value.selectedValues.includes(value)}
          disabled={question.disabled || disabled}
          onChange={(event) => {
            onChange?.(event);
            if (event.defaultPrevented) return;
            const selectedValues =
              question.selectionMode === "single"
                ? [value]
                : event.currentTarget.checked
                  ? [...question.value.selectedValues, value]
                  : question.value.selectedValues.filter((item) => item !== value);
            question.setValue({ ...question.value, selectedValues });
          }}
        />
        <ChoiceGlyph multiple={question.selectionMode === "multiple"} />
      </span>
      {children ?? value}
    </label>
  );
}
export type QuestionInputProps = Omit<ComponentProps<"textarea">, "defaultValue" | "value">;
export function QuestionInput({ className, disabled, onChange, ...props }: QuestionInputProps) {
  const question = useQuestion();
  return (
    <Textarea
      autoGrow={false}
      rows={2}
      size="sm"
      aria-label="Additional answer"
      data-slot="question-input"
      className={cn(
        "min-h-18 w-full resize-y rounded-lg border border-border/60 bg-inset p-3 text-ai-prose outline-none placeholder:text-placeholder placeholder:text-ai-label disabled:opacity-50 sm:text-ai-label focus-visible:shadow-kind-focus",
        className,
      )}
      {...props}
      value={question.value.text}
      disabled={question.disabled || disabled}
      onChange={(event) => {
        onChange?.(event);
        if (!event.defaultPrevented)
          question.setValue({ ...question.value, text: event.currentTarget.value });
      }}
    />
  );
}
export type QuestionActionsProps = ComponentProps<"div">;
export function QuestionActions({ className, ...props }: QuestionActionsProps) {
  return (
    <div
      data-slot="question-actions"
      className={cn("flex flex-wrap items-center justify-end gap-2 pt-1", className)}
      {...props}
    />
  );
}
export type QuestionSubmitProps = ComponentProps<"button">;
export function QuestionSubmit({
  className,
  disabled,
  children = "Submit",
  ...props
}: QuestionSubmitProps) {
  const question = useQuestion();
  return (
    <Button
      size="sm"
      type="submit"
      data-slot="question-submit"
      className={cn(actionVariants("default"), "rounded-lg px-3 text-ai-label", className)}
      {...props}
      disabled={
        question.disabled ||
        disabled ||
        (!question.value.selectedValues.length && !question.value.text.trim())
      }
    >
      {children}
    </Button>
  );
}

// Prompt adds sequencing around single-answer steps; Question owns multi-select forms.
export interface PromptAnswerContext {
  name: string;
  stepIndex: number;
  totalSteps: number;
  partial: Record<string, string>;
  isOther: boolean;
}
interface StepInfo {
  name: string;
  defaultValue?: string | undefined;
  options: { value: string; other: boolean; disabled: boolean }[];
}
function elements(children: ReactNode): React.ReactElement<{
  children?: ReactNode;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
}>[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{
      children?: ReactNode;
      name?: string;
      value?: string;
      defaultValue?: string;
      disabled?: boolean;
    }>(child)
      ? [child, ...elements(child.props.children)]
      : [],
  );
}
interface PromptContextValue {
  currentStep: string | undefined;
  stepIndex: number;
  totalSteps: number;
  partial: Record<string, string>;
  canBack: boolean;
  canSubmit: boolean;
  submit: (option?: { value: string; other: boolean }) => void;
  back: () => void;
  dismiss: () => void;
  selected: string;
  other: boolean;
  writeIn: string;
  select: (value: string, other: boolean) => void;
  setWriteIn: (value: string) => void;
  options: StepInfo["options"];
  submitOnClick: boolean;
  disabled: boolean;
  name: string;
}
const PromptContext = createContext<PromptContextValue | null>(null);
function usePromptContext() {
  const context = useContext(PromptContext);
  if (!context) throw new Error("Prompt parts require a Prompt parent.");
  return context;
}
export function usePrompt() {
  const { currentStep, stepIndex, totalSteps, partial, submit, back, dismiss, canBack } =
    usePromptContext();
  return {
    currentStep,
    stepIndex,
    totalSteps,
    partial,
    submit: () => submit(),
    back,
    dismiss,
    canBack,
  };
}
export type PromptProps = Omit<ComponentProps<"fieldset">, "onSubmit"> & {
  defaultValues?: Record<string, string>;
  submitOnClick?: boolean;
  disabled?: boolean;
  onAnswer?: (value: string, context: PromptAnswerContext) => void;
  onComplete?: (answers: Record<string, string>) => void;
  onDismiss?: () => void;
  autoFocus?: boolean;
};
export function Prompt({
  defaultValues = {},
  submitOnClick = false,
  disabled = false,
  autoFocus = false,
  onAnswer,
  onComplete,
  onDismiss,
  className,
  children,
  onKeyDown,
  ref,
  ...props
}: PromptProps) {
  const all = elements(children);
  const steps: StepInfo[] = all
    .filter((child) => child.type === PromptStep)
    .map((child) => ({
      name: child.props.name ?? "",
      defaultValue: child.props.defaultValue,
      options: elements(child.props.children)
        .filter((node) => node.type === PromptOption || node.type === PromptOptionOther)
        .map((node) => ({
          value: node.props.value ?? "",
          other: node.type === PromptOptionOther,
          disabled: node.props.disabled ?? false,
        })),
    }));
  const [requestedStep, setStepIndex] = useState(0);
  const stepIndex = Math.min(requestedStep, Math.max(0, steps.length - 1));
  const [partial, setPartial] = useState<Record<string, string>>({ ...defaultValues });
  const [drafts, setDrafts] = useState<
    Record<string, { value: string; other: boolean; writeIn: string }>
  >({});
  const root = useRef<HTMLFieldSetElement | null>(null);
  const id = useId();
  const lock = useRef(false);
  const step = steps[Math.min(stepIndex, Math.max(0, steps.length - 1))];
  const currentStep = step?.name;
  const options = step?.options ?? [];
  const seeded =
    currentStep === undefined ? "" : (partial[currentStep] ?? step?.defaultValue ?? "");
  const matched = options.find(
    (option) => !option.other && !option.disabled && option.value === seeded,
  );
  const initial =
    matched ??
    (seeded && options.some((option) => option.other)
      ? { value: "", other: true }
      : options.find((option) => !option.disabled));
  const draft = (currentStep === undefined ? undefined : drafts[currentStep]) ?? {
    value: initial?.value ?? "",
    other: initial?.other ?? false,
    writeIn: initial?.other ? seeded : "",
  };
  const reset = () => {
    setStepIndex(0);
    setPartial({ ...defaultValues });
    setDrafts({});
  };
  const select = (value: string, other: boolean) => {
    if (!disabled && currentStep !== undefined)
      setDrafts((previous) => ({ ...previous, [currentStep]: { ...draft, value, other } }));
  };
  const isEligible = (selected: { value: string; other: boolean }) => {
    const value = selected.other ? draft.writeIn.trim() : selected.value;
    return (
      (!selected.other || !!value) &&
      options.some(
        (item) =>
          item.other === selected.other && (item.other || item.value === value) && !item.disabled,
      )
    );
  };
  const submit = (option?: { value: string; other: boolean }) => {
    if (!step || disabled || lock.current) return;
    const selected = option ?? draft;
    const value = selected.other ? draft.writeIn.trim() : selected.value;
    if (!isEligible(selected)) return;
    lock.current = true;
    try {
      const next = { ...partial, [step.name]: value };
      onAnswer?.(value, {
        name: step.name,
        stepIndex,
        totalSteps: steps.length,
        partial: next,
        isOther: selected.other,
      });
      if (stepIndex === steps.length - 1) {
        onComplete?.(next);
        reset();
      } else {
        setPartial(next);
        setStepIndex(stepIndex + 1);
      }
    } finally {
      queueMicrotask(() => {
        lock.current = false;
      });
    }
  };
  const back = () => {
    if (!disabled) setStepIndex((index) => Math.max(0, index - 1));
  };
  const dismiss = () => {
    if (!disabled) {
      onDismiss?.();
      reset();
    }
  };
  const previousStep = useRef(currentStep);
  useEffect(() => {
    if (previousStep.current !== currentStep) {
      previousStep.current = currentStep;
      root.current?.focus();
    }
  }, [currentStep]);
  useEffect(() => {
    if (autoFocus) root.current?.focus();
  }, [autoFocus]);
  useEffect(() => {
    if (draft.other && currentStep !== undefined)
      root.current?.querySelector<HTMLInputElement>("[data-prompt-write-in]")?.focus();
  }, [draft.other, currentStep]);
  const focusOption = (index: number, direction = 0) => {
    const controls = root.current?.querySelectorAll<HTMLInputElement>("[data-prompt-choice]");
    let control = controls?.[index];
    while (control?.disabled && direction !== 0) {
      index += direction;
      control = controls?.[index];
    }
    if (control && !control.disabled) {
      const option = options[index];
      if (option) select(option.value, option.other);
      control.focus();
    }
  };
  return (
    <PromptContext.Provider
      value={{
        currentStep,
        stepIndex,
        totalSteps: steps.length,
        partial,
        canBack: stepIndex > 0,
        canSubmit: !!step && isEligible(draft),
        submit,
        back,
        dismiss,
        selected: draft.value,
        other: draft.other,
        writeIn: draft.writeIn,
        select,
        setWriteIn: (writeIn) => {
          if (!disabled && currentStep !== undefined)
            setDrafts((previous) => ({
              ...previous,
              [currentStep]: { ...draft, other: true, writeIn },
            }));
        },
        options,
        submitOnClick,
        disabled,
        name: id,
      }}
    >
      <fieldset
        aria-label="Questions"
        data-slot="prompt"
        data-step={currentStep}
        className={cn(
          "kind-surface m-0 flex min-w-0 flex-col gap-3 rounded-[1.25rem] bg-surface p-4 text-foreground focus-visible:outline-none focus-visible:shadow-kind-focus",
          className,
        )}
        tabIndex={-1}
        {...props}
        ref={(node) => {
          root.current = node;
          if (typeof ref === "function") return ref(node);
          else if (ref) ref.current = node;
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.nativeEvent.isComposing || disabled) return;
          // Embedded controls keep their native keyboard behavior, including newlines
          // and link activation; prompt shortcuts apply to the prompt's own controls.
          if (
            event.target instanceof HTMLElement &&
            event.target.closest('textarea, select, a[href], [contenteditable="true"]')
          )
            return;
          const input = event.target instanceof HTMLInputElement && event.target.type === "text";
          if (event.key === "Escape") {
            event.preventDefault();
            dismiss();
          } else if (event.key === "Enter" && !(event.target instanceof HTMLButtonElement)) {
            event.preventDefault();
            submit();
          } else if (
            (event.key === "ArrowDown" || event.key === "ArrowUp") &&
            event.target === root.current
          ) {
            event.preventDefault();
            focusOption(
              event.key === "ArrowDown" ? 0 : options.length - 1,
              event.key === "ArrowDown" ? 1 : -1,
            );
          } else if (event.key === "ArrowLeft" && event.target === root.current) {
            event.preventDefault();
            back();
          } else if (
            event.key === "Tab" &&
            event.shiftKey &&
            stepIndex > 0 &&
            event.target === root.current
          ) {
            event.preventDefault();
            back();
          } else if (!input && /^[1-9]$/.test(event.key)) {
            event.preventDefault();
            focusOption(Number(event.key) - 1);
          }
        }}
      >
        {children}
      </fieldset>
    </PromptContext.Provider>
  );
}
export type PromptStepProps = Omit<ComponentProps<"fieldset">, "name" | "defaultValue"> & {
  name: string;
  defaultValue?: string;
};
export function PromptStep({
  name,
  defaultValue: _defaultValue,
  className,
  ...props
}: PromptStepProps) {
  const prompt = usePromptContext();
  if (prompt.currentStep !== name) return null;
  return (
    <fieldset
      data-slot="prompt-step"
      aria-label={name}
      disabled={prompt.disabled}
      className={cn("m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0", className)}
      {...props}
    />
  );
}
export type PromptQuestionProps = ComponentProps<"legend">;
export function PromptQuestion({ className, ...props }: PromptQuestionProps) {
  return (
    <legend
      data-slot="prompt-question"
      className={cn("mb-2 max-w-[65ch] text-ai-title font-medium text-pretty", className)}
      {...props}
    />
  );
}
export type PromptOptionProps = QuestionOptionProps;
export function PromptOption({
  value,
  children,
  className,
  onChange,
  disabled,
  ...props
}: PromptOptionProps) {
  const prompt = usePromptContext();
  const index = prompt.options.findIndex((option) => !option.other && option.value === value);
  return (
    <label
      data-slot="prompt-option"
      data-highlighted={!prompt.other && prompt.selected === value}
      className={cn(choiceClass, className)}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex min-w-5 shrink-0 justify-center text-ai-description font-medium tabular-nums text-muted-foreground"
      >
        {index + 1}
      </span>
      <span className="relative mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center">
        <input
          {...props}
          data-prompt-choice=""
          type="radio"
          name={prompt.name}
          value={value}
          className="peer size-full shrink-0 appearance-none rounded-full border border-foreground/15 bg-background checked:border-primary checked:bg-primary disabled:cursor-default forced-colors:appearance-auto focus-visible:outline-none focus-visible:shadow-kind-focus"
          checked={!prompt.other && prompt.selected === value}
          disabled={prompt.disabled || disabled}
          onChange={(event) => {
            onChange?.(event);
            if (!event.defaultPrevented) {
              prompt.select(value, false);
            }
          }}
          onClick={(event) => {
            props.onClick?.(event);
            if (!event.defaultPrevented && event.detail > 0 && prompt.submitOnClick)
              prompt.submit({ value, other: false });
          }}
        />
        <ChoiceGlyph multiple={false} />
      </span>
      {children ?? value}
    </label>
  );
}
export type PromptOptionOtherProps = ComponentProps<"div"> & {
  placeholder?: string;
  inputProps?: Omit<ComponentProps<"input">, "value" | "defaultValue" | "type">;
};
export function PromptOptionOther({
  placeholder = "Type your answer",
  inputProps,
  className,
  ...props
}: PromptOptionOtherProps) {
  const prompt = usePromptContext();
  return (
    <div
      data-slot="prompt-option-other"
      data-highlighted={prompt.other}
      className={cn(choiceClass, className)}
      {...props}
    >
      <span className="relative mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center">
        <input
          data-prompt-choice=""
          type="radio"
          name={prompt.name}
          aria-label="Other answer"
          checked={prompt.other}
          disabled={prompt.disabled}
          onChange={() => prompt.select("", true)}
          className="peer size-full shrink-0 appearance-none rounded-full border border-foreground/15 bg-background checked:border-primary checked:bg-primary disabled:cursor-default forced-colors:appearance-auto focus-visible:outline-none focus-visible:shadow-kind-focus"
        />
        <ChoiceGlyph multiple={false} />
      </span>
      <input
        data-prompt-write-in=""
        aria-label="Your answer"
        {...inputProps}
        type="text"
        className={cn(
          "min-w-0 flex-1 bg-transparent text-ai-prose placeholder:text-placeholder placeholder:text-ai-label sm:text-ai-label focus-visible:outline-none focus-visible:shadow-kind-focus",
          inputProps?.className,
        )}
        placeholder={placeholder}
        value={prompt.writeIn}
        disabled={prompt.disabled || inputProps?.disabled}
        onFocus={(event) => {
          inputProps?.onFocus?.(event);
          if (!event.defaultPrevented) prompt.select("", true);
        }}
        onChange={(event) => {
          inputProps?.onChange?.(event);
          if (!event.defaultPrevented) prompt.setWriteIn(event.currentTarget.value);
        }}
      />
    </div>
  );
}
export type PromptFooterProps = ComponentProps<"footer">;
export function PromptFooter({ className, ...props }: PromptFooterProps) {
  return (
    <footer
      data-slot="prompt-footer"
      className={cn("flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 pt-1", className)}
      {...props}
    />
  );
}
export type PromptHintProps = ComponentProps<"span"> & { keys?: string };
export function PromptHint({ keys, className, children, ...props }: PromptHintProps) {
  return (
    <span
      data-slot="prompt-hint"
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 text-ai-description text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {keys && (
        <kbd className="rounded-md border border-border/60 bg-elevated px-1.5 py-0.5 font-mono text-ai-meta font-medium text-muted-foreground">
          {keys}
        </kbd>
      )}
    </span>
  );
}
export type PromptSubmitProps = useRender.ComponentProps<"button">;
export function PromptSubmit({
  render,
  onClick,
  className,
  children = "Continue",
  disabled,
  ...props
}: PromptSubmitProps) {
  const prompt = usePromptContext();
  return useRender({
    defaultTagName: "button",
    render: render ?? <Button size="sm" />,
    props: {
      ...props,
      type: "button",
      "data-slot": "prompt-submit",
      className: cn(actionVariants("default"), "rounded-lg px-3 text-ai-label", className),
      children,
      disabled: disabled || prompt.disabled || !prompt.canSubmit,
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) prompt.submit();
      },
    },
  });
}
