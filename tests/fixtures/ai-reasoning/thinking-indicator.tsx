import { ThinkingIndicator } from "@kind-ui/ai";
import { ThinkingIndicator as SubpathThinkingIndicator } from "@kind-ui/ai/thinking-indicator";
import { useRef, useState } from "react";

export default function ThinkingIndicatorFixture() {
  const [label, setLabel] = useState("Reviewing sources");
  const [elapsed, setElapsed] = useState<string | undefined>("0s");
  const [live, setLive] = useState<"polite" | "off">("polite");
  const [clicks, setClicks] = useState(0);
  const [renderClicks, setRenderClicks] = useState(0);
  const [refTag, setRefTag] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <main>
      <h1>Thinking indicator</h1>
      <button type="button" onClick={() => setLabel("Comparing results")}>
        Update label
      </button>
      <button type="button" onClick={() => setElapsed("12s")}>
        Update elapsed
      </button>
      <button type="button" onClick={() => setElapsed("")}>
        Clear elapsed
      </button>
      <button type="button" onClick={() => setElapsed(undefined)}>
        Omit elapsed
      </button>
      <button type="button" onClick={() => setLive(live === "polite" ? "off" : "polite")}>
        Toggle label announcements
      </button>
      <button
        type="button"
        onClick={() => {
          setLabel("ReviewingAnExtremelyLongSourceNameWithoutSpaces".repeat(8));
          setElapsed("AnExtremelyLongElapsedDescriptionWithoutSpaces".repeat(8));
        }}
      >
        Long content
      </button>
      <button type="button" onClick={() => setRefTag(rootRef.current?.tagName ?? "missing")}>
        Inspect root ref
      </button>
      <div style={{ maxWidth: 220 }} data-testid="thinking-container">
        <ThinkingIndicator
          ref={rootRef}
          data-testid="thinking"
          id="host-thinking"
          title="Host thinking"
          tabIndex={0}
          className="host-thinking-class"
          style={{ outlineColor: "rgb(1, 2, 3)" }}
          label={label}
          elapsed={elapsed}
          live={live}
          onClick={() => setClicks((value) => value + 1)}
        />
      </div>
      <SubpathThinkingIndicator
        label="Composed root"
        data-testid="composed-thinking"
        render={<button type="button" onClick={() => setRenderClicks((value) => value + 1)} />}
        onClick={() => setClicks((value) => value + 1)}
        pulse={false}
      />
      <SubpathThinkingIndicator
        label="Function root"
        data-testid="function-thinking"
        render={(props) => <article {...props} />}
        pulse={false}
      />
      <output data-testid="clicks">{clicks}</output>
      <output data-testid="render-clicks">{renderClicks}</output>
      <output data-testid="ref-tag">{refTag}</output>
    </main>
  );
}
