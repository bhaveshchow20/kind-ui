import { type EffortLevel, ReasoningEffort } from "@kind-ui/ai";
import { ReasoningEffort as SubpathEffort } from "@kind-ui/ai/reasoning-effort";
import { useRef, useState } from "react";

const initialLevels: readonly EffortLevel[] = [
  { key: "low", label: "Quick", budget: 10 },
  { key: "high", label: "Thorough", budget: 100 },
];

export default function ReasoningEffortFixture() {
  const [levels, setLevels] = useState(initialLevels);
  const [selectedKey, setSelectedKey] = useState("low");
  const [spent, setSpent] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [readonly, setReadonly] = useState(false);
  const [requests, setRequests] = useState<string[]>([]);
  const [submits, setSubmits] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [prevent, setPrevent] = useState(false);
  const [refTag, setRefTag] = useState("");
  const [animated, setAnimated] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const numeric = (budget: number, amount: number) => {
    setLevels([{ key: "low", label: "Quick", budget }]);
    setSpent(amount);
    setSelectedKey("low");
  };

  return (
    <main>
      <h1>Reasoning effort</h1>
      <button type="button" onClick={() => setSelectedKey("high")}>
        Host selects high
      </button>
      <button type="button" onClick={() => setSelectedKey("missing")}>
        Unknown selection
      </button>
      <button type="button" onClick={() => setLevels([])}>
        Empty levels
      </button>
      <button type="button" onClick={() => setLevels((value) => [...value].reverse())}>
        Reverse levels
      </button>
      <button type="button" onClick={() => setSpent(150)}>
        Over budget
      </button>
      <button type="button" onClick={() => setDisabled((value) => !value)}>
        Toggle disabled
      </button>
      <button type="button" onClick={() => setReadonly((value) => !value)}>
        Toggle readonly
      </button>
      <button type="button" onClick={() => setPrevent((value) => !value)}>
        Toggle prevent activation
      </button>
      <button type="button" onClick={() => numeric(1e308, 1e308)}>
        Large equal
      </button>
      <button type="button" onClick={() => numeric(Number.MIN_VALUE, 1e308)}>
        Extreme overrun
      </button>
      <button type="button" onClick={() => numeric(1e308, Number.MIN_VALUE)}>
        Tiny spend
      </button>
      <button type="button" onClick={() => numeric(0, 3)}>
        No budget
      </button>
      <button type="button" onClick={() => numeric(Infinity, 3)}>
        Invalid budget
      </button>
      <button type="button" onClick={() => numeric(10, NaN)}>
        Invalid spend
      </button>
      <button
        type="button"
        onClick={() =>
          setLevels(
            initialLevels.map((level) => ({
              ...level,
              label: "AnExtremelyLongEffortDescriptionWithoutSpaces".repeat(8),
            })),
          )
        }
      >
        Long labels
      </button>
      <button type="button" onClick={() => setRefTag(rootRef.current?.tagName ?? "missing")}>
        Inspect effort ref
      </button>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits((value) => value + 1);
        }}
      >
        <div style={{ maxWidth: 220 }}>
          <ReasoningEffort
            ref={rootRef}
            data-testid="effort"
            id="host-effort"
            className="host-effort-class"
            title="Host effort"
            style={{ outlineColor: "rgb(1, 2, 3)" }}
            tabIndex={0}
            levels={levels}
            selectedKey={selectedKey}
            spent={spent}
            disabled={disabled}
            onSelect={readonly ? undefined : (key) => setRequests((value) => [...value, key])}
            onClick={() => setClicks((value) => value + 1)}
            onClickCapture={(event) => {
              if (prevent) event.preventDefault();
            }}
          />
        </div>
      </form>
      <SubpathEffort
        data-testid="static-effort"
        levels={initialLevels}
        selectedKey="high"
        spent={50}
        label="Readonly effort"
        meterLabel="Readonly budget used"
      />
      <button type="button" onClick={() => setAnimated((value) => !value)}>
        Toggle effort animation
      </button>
      <div style={{ width: 220 }}>
        <SubpathEffort
          data-testid="animated-effort"
          levels={levels}
          selectedKey={selectedKey}
          spent={spent}
          animated={animated}
          onSelect={(key) => setRequests((value) => [...value, key])}
        />
      </div>
      <output data-testid="effort-requests">{requests.join(",")}</output>
      <output data-testid="effort-submits">{submits}</output>
      <output data-testid="effort-clicks">{clicks}</output>
      <output data-testid="effort-ref">{refTag}</output>
    </main>
  );
}
