import { ThinkingDots, TypingIndicator } from "@kind-ui/ai";
import { ThinkingDots as SubpathThinkingDots } from "@kind-ui/ai/thinking-dots";
import { TypingIndicator as SubpathTypingIndicator } from "@kind-ui/ai/typing-indicator";
import { surfaceClass } from "@kind-ui/ai/utils";
import { useRef, useState } from "react";

export default function TypingIndicatorFixture() {
  const [mounted, setMounted] = useState(true);
  const [clicks, setClicks] = useState(0);
  const [refs, setRefs] = useState("");
  const typingRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLSpanElement>(null);

  return (
    <main>
      <h1>Typing activity</h1>
      <button type="button" onClick={() => setMounted((value) => !value)}>
        Toggle typing activity
      </button>
      <button
        type="button"
        onClick={() => {
          setRefs(
            `${typingRef.current?.tagName ?? "missing"},${dotsRef.current?.tagName ?? "missing"}`,
          );
        }}
      >
        Inspect activity refs
      </button>
      <section aria-label="Default typing activity">
        {mounted && (
          <TypingIndicator
            data-testid="typing"
            ref={typingRef}
            id="host-typing"
            title="Host typing activity"
            tabIndex={0}
            className="host-typing"
            style={{ outlineColor: "rgb(1, 2, 3)" }}
            onClick={() => setClicks((value) => value + 1)}
          />
        )}
      </section>
      <SubpathTypingIndicator data-testid="renamed-typing" aria-label="Drafting a reply" />
      <span id="host-activity-label">Composing a suggestion</span>
      <SubpathTypingIndicator data-testid="labelled-typing" aria-labelledby="host-activity-label" />
      <SubpathTypingIndicator
        data-testid="host-role-typing"
        role="note"
        aria-label="Host activity"
        aria-live="off"
      />
      <TypingIndicator
        data-testid="surface-typing"
        className={`${surfaceClass} inline-flex items-center px-3 py-2`}
        aria-label="Assistant activity in a message surface"
      />
      <ThinkingDots
        data-testid="native-dots"
        ref={dotsRef}
        id="host-dots"
        title="Host dots"
        tabIndex={-1}
        className="host-dots"
        style={{ color: "rgb(4, 5, 6)", width: 30 }}
        onClick={() => setClicks((value) => value + 1)}
      />
      <SubpathThinkingDots data-testid="subpath-dots" />
      <output data-testid="activity-refs">{refs}</output>
      <output data-testid="activity-clicks">{clicks}</output>
    </main>
  );
}
