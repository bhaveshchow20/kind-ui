import {
  GeneratedImage,
  GeneratedImageRetry,
  type GeneratedImageState,
} from "@kind-ui/ai/generated-image";
import {
  Prompt,
  PromptOption,
  PromptOptionOther,
  PromptStep,
  PromptSubmit,
} from "@kind-ui/ai/question";
import {
  type RefObject,
  startTransition,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";

function RejectDuringCommit({
  replacement,
  reject,
}: {
  replacement: string;
  reject: RefObject<((error: Error) => void) | null>;
}) {
  useLayoutEffect(() => {
    if (replacement === "initial") return;
    reject.current?.(new Error("Old image action failed"));
    // Exhaust React's concurrent render timeslice so passive effects run in the
    // next task, after the rejection microtask. This exercises the commit window.
    const deadline = performance.now() + 20;
    while (performance.now() < deadline) {
      /* bounded scheduling fixture */
    }
  }, [replacement, reject]);
  return null;
}

function ImageFixture() {
  const [replacement, setReplacement] = useState("initial");
  const [passive, setPassive] = useState("initial");
  const [errors, setErrors] = useState(0);
  const reject = useRef<((error: Error) => void) | null>(null);
  useEffect(() => setPassive(replacement), [replacement]);
  const state: GeneratedImageState = replacement === "state" ? "complete" : "error";
  return (
    <section>
      <output data-testid="image-errors">{errors}</output>
      <output data-testid="image-passive">{passive}</output>
      {["request", "state", "unmount"].map((next) => (
        <button
          key={next}
          type="button"
          onClick={() => startTransition(() => setReplacement(next))}
        >
          Replace {next}
        </button>
      ))}
      <button type="button" onClick={() => reject.current?.(new Error("Current request failed"))}>
        Reject current action
      </button>
      {replacement !== "unmount" && (
        <GeneratedImage
          requestId={replacement === "request" ? "replacement" : "initial"}
          state={state}
          onRetry={() =>
            new Promise<void>((_resolve, fail) => {
              reject.current = fail;
            })
          }
          onActionError={() => setErrors((count) => count + 1)}
        >
          <GeneratedImageRetry />
        </GeneratedImage>
      )}
      <RejectDuringCommit replacement={replacement} reject={reject} />
    </section>
  );
}

function Fixture() {
  if (new URLSearchParams(window.location.search).has("eligibility"))
    return <PromptEligibilityFixture />;
  return (
    <>
      <Prompt>
        <PromptStep name="first">
          <PromptOption value="first">First option</PromptOption>
        </PromptStep>
        <PromptStep name="second">
          <PromptOption value="a">Second A</PromptOption>
          <PromptOption value="b">Second B</PromptOption>
        </PromptStep>
        <PromptSubmit />
      </Prompt>
      <ImageFixture />
    </>
  );
}

function PromptEligibilityFixture() {
  const [optionState, setOptionState] = useState("enabled");
  const [answers, setAnswers] = useState<string[]>([]);
  return (
    <>
      {["enabled", "disabled", "removed"].map((state) => (
        <button key={state} type="button" onClick={() => setOptionState(state)}>
          Set option {state}
        </button>
      ))}
      <output data-testid="prompt-answers">{JSON.stringify(answers)}</output>
      <Prompt onAnswer={(answer) => setAnswers((previous) => [...previous, answer])}>
        <PromptStep name="choice">
          <PromptOption value="a">Option A</PromptOption>
          {optionState !== "removed" && (
            <PromptOption value="b" disabled={optionState === "disabled"}>
              Option B
            </PromptOption>
          )}
          <PromptOptionOther />
        </PromptStep>
        <PromptSubmit />
      </Prompt>
      <Prompt aria-label="No enabled options">
        <PromptStep name="disabled">
          <PromptOption value="disabled" disabled>
            Disabled option
          </PromptOption>
        </PromptStep>
        <PromptSubmit />
      </Prompt>
      <Prompt aria-label="No options">
        <PromptStep name="empty" />
        <PromptSubmit />
      </Prompt>
    </>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(<Fixture />);
