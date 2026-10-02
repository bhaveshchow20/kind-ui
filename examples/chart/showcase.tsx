import "@fontsource-variable/geist";
import "@kind-ui/charts/styles.css";
import "./showcase.css";
import { type CSSProperties, type KeyboardEvent, memo, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { FeatureChart, type Finish } from "./showcase-charts";
import { exampleCode } from "./showcase-code";
import { type Example, examples, type Family } from "./showcase-data";
import { useReducedMotionPreference } from "./use-reduced-motion";

const families: Family[] = ["area", "bar", "line", "pie", "radar", "radial"];
const finishes: Finish[] = ["plain", "paper", "clay", "glow"];
const palettes = [
  { name: "Blue", color: "#5b7cde", secondary: "#5b9f8a" },
  { name: "Terracotta", color: "#c76d50", secondary: "#6c8bb0" },
  { name: "Green", color: "#39856d", secondary: "#9b78b8" },
  { name: "Purple", color: "#9164c2", secondary: "#579f9b" },
  { name: "Amber", color: "#af7e2c", secondary: "#708ac0" },
];
const capitalize = (value: string) => value[0]?.toUpperCase() + value.slice(1);
const ExampleCard = memo(function ExampleCard({
  family,
  example,
  material,
  animate,
  onCode,
  onCopy,
}: {
  family: Family;
  example: Example;
  material: Finish;
  animate: boolean;
  onCode: (example: Example) => void;
  onCopy: (example: Example) => void;
}) {
  return (
    <article className="example-card" data-example={example.id}>
      <div className="example-actions">
        <span>
          {capitalize(family)} · {example.title}
        </span>
        <div>
          <button
            type="button"
            aria-label={`Copy ${example.title} code`}
            onClick={() => onCopy(example)}
          >
            Copy
          </button>
          <button type="button" onClick={() => onCode(example)}>
            View code
          </button>
        </div>
      </div>
      <div className="example-surface">
        <h2>{example.title}</h2>
        <p>{example.detail}</p>
        <FeatureChart family={family} example={example} material={material} animate={animate} />
      </div>
    </article>
  );
});
function Showcase() {
  const [family, setFamily] = useState<Family>("area");
  const [material, setMaterial] = useState<Finish>("plain");
  const [motion, setMotion] = useState(true);
  const [dark, setDark] = useState(false);
  const [color, setColor] = useState(palettes[0]?.color ?? "#5b7cde");
  const [secondary, setSecondary] = useState(palettes[0]?.secondary ?? "#5b9f8a");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const codeRequest = useRef(0);
  const reducedMotion = useReducedMotionPreference();
  const animate = motion && !reducedMotion;
  const [codeExample, setCodeExample] = useState<Example | null>(null);
  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 2200);
    return () => window.clearTimeout(timer);
  }, [status]);
  async function copy(example: Example) {
    const request = ++codeRequest.current;
    try {
      const next = await exampleCode(family, example, material, animate, color, secondary);
      if (request !== codeRequest.current) return;
      await navigator.clipboard.writeText(next);
      if (request === codeRequest.current) setStatus(`${example.title} code copied`);
    } catch {
      if (request !== codeRequest.current) return;
      await showCode(example);
      setStatus("Select the code and copy it.");
    }
  }
  async function showCode(example: Example) {
    const request = ++codeRequest.current;
    setCodeExample(example);
    setCode("Loading code…");
    dialog.current?.showModal();
    try {
      const next = await exampleCode(family, example, material, animate, color, secondary);
      if (request === codeRequest.current) setCode(next);
    } catch {
      if (request === codeRequest.current)
        setCode("Code could not load. Close this dialog and try again.");
    }
  }
  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, value: Family) {
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const next =
      event.key === "Home"
        ? families[0]
        : event.key === "End"
          ? families.at(-1)
          : direction
            ? families[(families.indexOf(value) + direction + families.length) % families.length]
            : undefined;
    if (!next) return;
    event.preventDefault();
    codeRequest.current++;
    setFamily(next);
    document.getElementById(`tab-${next}`)?.focus();
  }
  return (
    <div
      className="showcase"
      data-theme={dark ? "dark" : "light"}
      data-motion={animate ? "on" : "off"}
      style={
        {
          "--gallery-color": color,
          "--gallery-color-secondary": secondary,
          "--chart-1": color,
          "--chart-2": secondary,
        } as CSSProperties
      }
    >
      <header className="site-header">
        <nav aria-label="Main navigation">
          <a className="wordmark" href="./showcase.html">
            Kind UI
          </a>
          <span className="nav-current">Charts</span>
          <div className="nav-links">
            <a href="https://github.com/bhaveshchow20/kind-ui/tree/main/packages/charts">Docs</a>
            <a href="https://github.com/bhaveshchow20/kind-ui">GitHub ↗</a>
            <button
              type="button"
              className="theme-toggle"
              aria-label={dark ? "Use light theme" : "Use dark theme"}
              onClick={() => setDark(!dark)}
            >
              {dark ? "☾" : "☼"}
            </button>
          </div>
        </nav>
      </header>
      <main className="gallery-container">
        <div className="family-tabs" role="tablist" aria-label="Chart family">
          {families.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`tab-${value}`}
              aria-selected={family === value}
              aria-controls={`panel-${value}`}
              tabIndex={family === value ? 0 : -1}
              onClick={() => {
                codeRequest.current++;
                setFamily(value);
              }}
              onKeyDown={(event) => navigateTabs(event, value)}
            >
              {capitalize(value)}
            </button>
          ))}
        </div>
        <div className="gallery-controls">
          <fieldset>
            <legend>Finish</legend>
            <div
              className="finish-options"
              aria-disabled={family === "pie" || family === "radar" || family === "radial"}
            >
              {finishes.map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    disabled={family === "pie" || family === "radar" || family === "radial"}
                    name="finish"
                    value={value}
                    checked={material === value}
                    onChange={() => setMaterial(value)}
                  />
                  <span>{capitalize(value)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="color-options">
            <legend>Color</legend>
            <div>
              {palettes.map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  className="color-preset"
                  aria-label={`${palette.name} palette`}
                  aria-pressed={color === palette.color && secondary === palette.secondary}
                  style={{ "--swatch": palette.color } as CSSProperties}
                  onClick={() => {
                    setColor(palette.color);
                    setSecondary(palette.secondary);
                  }}
                />
              ))}
              <label className="custom-color" title="Custom chart color">
                <span className="sr-only">Custom chart color</span>
                <input
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                />
                <span aria-hidden="true">+</span>
              </label>
            </div>
          </fieldset>
          <label className="motion-control">
            <span>Motion</span>
            <input
              type="checkbox"
              aria-label="Motion"
              checked={motion}
              onChange={(event) => setMotion(event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true" />
            {reducedMotion && <span className="sr-only">Reduced motion preference is active</span>}
          </label>
        </div>
        <section role="tabpanel" id={`panel-${family}`} aria-labelledby={`tab-${family}`}>
          <div className="gallery-title">
            <h1>{capitalize(family)} charts</h1>
          </div>
          <div className="chart-grid">
            {examples[family].map((example) => (
              <ExampleCard
                key={`${family}-${example.id}`}
                family={family}
                example={example}
                material={material}
                animate={animate}
                onCode={showCode}
                onCopy={copy}
              />
            ))}
          </div>
        </section>
      </main>
      <p className="copy-status" role="status" aria-live="polite">
        {status}
      </p>
      <dialog
        ref={dialog}
        className="code-dialog"
        aria-labelledby="code-title"
        onClose={() => {
          codeRequest.current++;
        }}
      >
        <div>
          <h2 id="code-title">
            {codeExample?.title} · {capitalize(family)}
          </h2>
          <button type="button" aria-label="Close code" onClick={() => dialog.current?.close()}>
            ✕
          </button>
        </div>
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable code needs keyboard access. */}
        <pre tabIndex={0}>
          <code>{code}</code>
        </pre>
      </dialog>
    </div>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<Showcase />);
