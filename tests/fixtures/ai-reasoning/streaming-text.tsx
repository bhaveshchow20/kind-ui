import { StreamingText } from "@kind-ui/ai";
import type { StreamingTextState } from "@kind-ui/ai/streaming-text";
import { useRef, useState } from "react";

export function StreamingTextFixture() {
  const [text, setText] = useState("  First\n  partial 👩🏽‍💻 <b>literal</b>");
  const [state, setState] = useState<StreamingTextState>("streaming");
  const [caret, setCaret] = useState(true);
  const [animated, setAnimated] = useState(false);
  const [busyOverride, setBusyOverride] = useState(false);
  const [clicks, setClicks] = useState(0);
  const paragraph = useRef<HTMLParagraphElement>(null);
  return (
    <section aria-label="Streaming text fixture">
      <label>
        Response text
        <textarea value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      <label>
        Response state
        <select
          value={state}
          onChange={(event) => setState(event.target.value as StreamingTextState)}
        >
          <option value="streaming">Streaming</option>
          <option value="complete">Complete</option>
          <option value="interrupted">Interrupted</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={caret}
          onChange={(event) => setCaret(event.target.checked)}
        />
        Show caret
      </label>
      <label>
        <input
          type="checkbox"
          checked={animated}
          onChange={(event) => setAnimated(event.target.checked)}
        />
        Animate caret
      </label>
      <label>
        <input
          type="checkbox"
          checked={busyOverride}
          onChange={(event) => setBusyOverride(event.target.checked)}
        />
        Override busy state
      </label>
      <button type="button" onClick={() => paragraph.current?.focus()}>
        Focus response
      </button>
      <output data-testid="response-clicks">{clicks}</output>
      <StreamingText
        ref={paragraph}
        id="streaming-response"
        data-testid="streaming-response"
        state={state}
        caret={caret}
        animated={animated}
        {...(busyOverride ? { "aria-busy": false } : {})}
        className="consumer-text"
        style={{ maxWidth: "100%" }}
        title="Current response"
        lang="en"
        dir="auto"
        tabIndex={0}
        onClick={() => setClicks((value) => value + 1)}
      >
        {text}
      </StreamingText>
    </section>
  );
}

export default StreamingTextFixture;
