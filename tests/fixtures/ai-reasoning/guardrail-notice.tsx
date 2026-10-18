import { GuardrailNotice, type GuardrailNoticeAlternative } from "@kind-ui/ai";
import { GuardrailNotice as SubpathGuardrailNotice } from "@kind-ui/ai/guardrail-notice";
import { useRef, useState } from "react";

export default function GuardrailNoticeFixture() {
  const [alternatives, setAlternatives] = useState<readonly GuardrailNoticeAlternative[]>([
    { id: "summary", text: "A safe summary" },
    { id: "example", text: "A safe example" },
    { id: "blocked", text: "Unavailable choice", disabled: true },
  ]);
  const [disabled, setDisabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prevented, setPrevented] = useState(false);
  const [interactive, setInteractive] = useState(true);
  const [policy, setPolicy] = useState<string | undefined>("Policy context");
  const [title, setTitle] = useState("Choose another request");
  const [explanation, setExplanation] = useState("This request needs a different approach.");
  const [label, setLabel] = useState("Try instead");
  const [picks, setPicks] = useState(0);
  const [picked, setPicked] = useState("");
  const [identity, setIdentity] = useState(false);
  const [submits, setSubmits] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [renderClicks, setRenderClicks] = useState(0);
  const [refTag, setRefTag] = useState("");
  const notice = useRef<HTMLDivElement>(null);

  return (
    <main>
      <h1>Guardrail notice</h1>
      <button type="button" onClick={() => setDisabled((value) => !value)}>
        Toggle disabled
      </button>
      <button type="button" onClick={() => setBusy((value) => !value)}>
        Toggle busy
      </button>
      <button type="button" onClick={() => setPrevented((value) => !value)}>
        Toggle prevented activation
      </button>
      <button type="button" onClick={() => setInteractive((value) => !value)}>
        Toggle actions
      </button>
      <button type="button" onClick={() => setAlternatives((value) => [...value].reverse())}>
        Reverse choices
      </button>
      <button
        type="button"
        onClick={() =>
          setAlternatives((value) =>
            value.map((alternative) =>
              alternative.id === "summary"
                ? { ...alternative, text: "Updated summary" }
                : alternative,
            ),
          )
        }
      >
        Update summary
      </button>
      <button type="button" onClick={() => setAlternatives([])}>
        Clear choices
      </button>
      <button type="button" onClick={() => setPolicy("")}>
        Empty policy
      </button>
      <button type="button" onClick={() => setPolicy(undefined)}>
        Omit policy
      </button>
      <button
        type="button"
        onClick={() => {
          setTitle("<b>Literal title</b>");
          setExplanation("<em>Literal explanation</em>");
          setPolicy("<i>Literal policy</i>");
          setLabel("<strong>Literal alternatives</strong>");
          setAlternatives([{ id: "literal", text: "<script>Literal choice</script>" }]);
        }}
      >
        Literal content
      </button>
      <button
        type="button"
        onClick={() => {
          setTitle("LongTitle".repeat(50));
          setExplanation("LongExplanation".repeat(50));
          setPolicy("LongPolicy".repeat(50));
          setLabel("LongAlternatives".repeat(50));
          setAlternatives([{ id: "long", text: "LongChoice".repeat(50) }]);
        }}
      >
        Long content
      </button>
      <button
        type="button"
        onClick={() => {
          notice.current?.focus();
          setRefTag(notice.current?.tagName ?? "missing");
        }}
      >
        Focus notice ref
      </button>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits((value) => value + 1);
        }}
        style={{ maxWidth: 240 }}
      >
        <GuardrailNotice
          ref={notice}
          id="host-notice"
          data-testid="notice"
          className="host-notice-class"
          style={{ outlineColor: "rgb(1, 2, 3)" }}
          tabIndex={0}
          aria-label="Request warning"
          aria-busy={busy}
          title={title}
          explanation={explanation}
          {...(policy !== undefined ? { policy } : {})}
          alternativesLabel={label}
          alternatives={alternatives}
          disabled={disabled}
          onClickCapture={(event) => {
            if (prevented) event.preventDefault();
          }}
          onClick={() => setClicks((value) => value + 1)}
          {...(interactive
            ? {
                onPick: (alternative: GuardrailNoticeAlternative) => {
                  setPicks((value) => value + 1);
                  setPicked(`${alternative.id}:${alternative.text}`);
                  setIdentity(alternatives.some((current) => current === alternative));
                },
              }
            : {})}
        />
      </form>
      <SubpathGuardrailNotice
        data-testid="composed-notice"
        title="Composed notice"
        explanation="Host-selected semantics"
        role="alert"
        aria-label="Composed warning"
        aria-live="assertive"
        render={
          <section
            role="alert"
            onClick={() => setRenderClicks((value) => value + 1)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setRenderClicks((value) => value + 1);
            }}
          />
        }
        onClick={() => setClicks((value) => value + 1)}
      />
      <SubpathGuardrailNotice
        data-testid="function-notice"
        title="Function notice"
        explanation="Function root"
        render={(props) => <article {...props} />}
      />
      <output data-testid="picks">{picks}</output>
      <output data-testid="picked">{picked}</output>
      <output data-testid="identity">{String(identity)}</output>
      <output data-testid="submits">{submits}</output>
      <output data-testid="clicks">{clicks}</output>
      <output data-testid="render-clicks">{renderClicks}</output>
      <output data-testid="ref-tag">{refTag}</output>
    </main>
  );
}
