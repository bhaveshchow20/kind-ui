import { Loader, loaderVariants } from "@kind-ui/ai";
import { Shimmer } from "@kind-ui/ai/loader";
import { useState } from "react";

const numericCases = {
  default: { duration: 1.4, spread: 40 },
  nan: { duration: Number.NaN, spread: Number.NaN },
  infinity: { duration: Number.POSITIVE_INFINITY, spread: Number.POSITIVE_INFINITY },
  negativeInfinity: { duration: Number.NEGATIVE_INFINITY, spread: Number.NEGATIVE_INFINITY },
  negative: { duration: -5, spread: -5 },
  overflow: { duration: 1e308, spread: Number.MAX_VALUE },
};
type NumericCase = keyof typeof numericCases;

export function LoaderFixture() {
  const [numericCase, setNumericCase] = useState<NumericCase>("default");
  const [content, setContent] = useState("Searching");
  const [rich, setRich] = useState(false);
  const [span, setSpan] = useState<HTMLSpanElement | null>(null);
  const [paragraph, setParagraph] = useState<HTMLParagraphElement | null>(null);
  const [custom, setCustom] = useState<HTMLSpanElement | null>(null);
  const [calls, setCalls] = useState(0);
  const [renderCalls, setRenderCalls] = useState(0);
  const [cancelNavigation, setCancelNavigation] = useState(true);
  const [cancelled, setCancelled] = useState(false);
  const [pulseDuration, setPulseDuration] = useState(3);
  const values = numericCases[numericCase];
  return (
    <main className="max-w-full space-y-4 p-4">
      <h1>Loader and Shimmer</h1>
      <label>
        Numeric case
        <select
          value={numericCase}
          onChange={(event) => setNumericCase(event.target.value as NumericCase)}
        >
          {Object.keys(numericCases).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label>
        Loader content
        <input value={content} onChange={(event) => setContent(event.target.value)} />
      </label>
      <label>
        <input type="checkbox" checked={rich} onChange={(event) => setRich(event.target.checked)} />
        Rich content
      </label>
      <div>
        <Loader data-testid="controlled-loader" ref={setSpan} {...values}>
          {rich ? <strong>{content}</strong> : content}
        </Loader>
      </div>
      <div>
        <Shimmer data-testid="controlled-shimmer" ref={setParagraph} {...values}>
          Kind
        </Shimmer>
      </div>
      <Loader data-testid="numeric-loader">{0}</Loader>
      <Loader data-testid="rich-loader">
        <strong>Preparing</strong>
      </Loader>
      <span id="loader-host-label">Host named progress</span>
      <Loader data-testid="named-loader" aria-labelledby="loader-host-label">
        Searching
      </Loader>
      <Loader data-testid="native-loader" role="note" aria-label="Host label" aria-live="off">
        Searching
      </Loader>
      <Loader
        data-testid="custom-loader"
        ref={setCustom}
        role="button"
        render={<button type="button" onClick={() => setRenderCalls((value) => value + 1)} />}
        onClick={() => setCalls((value) => value + 1)}
      >
        Host action
      </Loader>
      <label>
        <input
          type="checkbox"
          checked={cancelNavigation}
          onChange={(event) => setCancelNavigation(event.target.checked)}
        />
        Cancel navigation
      </label>
      <Loader
        role="link"
        render={<a href="#loader-action" />}
        onClick={(event) => {
          if (cancelNavigation) event.preventDefault();
          setCancelled(event.defaultPrevented);
        }}
      >
        Host navigation
      </Loader>
      <Loader
        data-testid="styled-loader"
        duration={Number.NaN}
        spread={Number.POSITIVE_INFINITY}
        className="host-loader"
        style={
          {
            "--kind-loader-duration": "7s",
            "--kind-loader-spread": "12px",
            color: "tomato",
          } as React.CSSProperties
        }
      >
        Styled loader
      </Loader>
      <Shimmer
        data-testid="styled-shimmer"
        duration={Number.NaN}
        spread={Number.POSITIVE_INFINITY}
        style={
          { "--kind-loader-duration": "8s", "--kind-loader-spread": "14px" } as React.CSSProperties
        }
      >
        Styled shimmer
      </Shimmer>
      <Loader data-testid="dots-loader" dots>
        Decorative dots
      </Loader>
      <section aria-label="Motion examples">
        <span
          data-testid="standalone-loader-helper"
          className={loaderVariants({ className: "host-loader-helper" })}
        >
          Standalone pulse
        </span>
        <label>
          Pulse duration
          <input
            type="number"
            value={pulseDuration}
            onChange={(event) => setPulseDuration(Number(event.target.value))}
          />
        </label>
        <Loader data-testid="pulse-default">Default pulse</Loader>
        <Loader data-testid="pulse-controlled" duration={pulseDuration}>
          Controlled pulse
        </Loader>
        <Loader data-testid="pulse-invalid" duration={Number.NaN}>
          Fallback pulse
        </Loader>
        <Loader data-testid="pulse-minimum" duration={-1}>
          Minimum pulse
        </Loader>
        <Loader data-testid="pulse-dots" duration={9} dots>
          Independent dots
        </Loader>
        <Loader data-testid="shimmer-default" variant="shimmer">
          Default shimmer
        </Loader>
        <Loader data-testid="shimmer-explicit" variant="shimmer" duration={3.6}>
          Explicit shimmer
        </Loader>
        <Loader data-testid="shimmer-dots" variant="shimmer" duration={3.6} dots>
          Shimmer and dots
        </Loader>
        <Loader data-testid="null-default" variant={null}>
          Static label
        </Loader>
        <Loader data-testid="null-dots" variant={null} duration={9} dots>
          Static label and dots
        </Loader>
        <Shimmer data-testid="text-shimmer-default">Default text shimmer</Shimmer>
        <Shimmer data-testid="text-shimmer-explicit" duration={4}>
          Explicit text shimmer
        </Shimmer>
      </section>
      <output data-testid="loader-refs">
        {[span?.tagName, paragraph?.tagName, custom?.tagName].join(",")}
      </output>
      <output data-testid="loader-calls">{calls}</output>
      <output data-testid="loader-render-calls">{renderCalls}</output>
      <output data-testid="loader-cancelled">{String(cancelled)}</output>
    </main>
  );
}

export default LoaderFixture;
