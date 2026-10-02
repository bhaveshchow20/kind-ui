import { RadialBarLabel } from "@kind-ui/charts";
import { useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { PolarGalleryCard } from "./host.js";
import "@kind-ui/charts/styles.css";

const sample = [
  { category: "Speed", actual: 85, target: 75 },
  { category: "Quality", actual: 68, target: 80 },
  { category: "Reliability", actual: 92, target: 85 },
  { category: "Coverage", actual: 58, target: 70 },
  { category: "Efficiency", actual: 74, target: 65 },
];
function LabelRefProbe({ show }: { show: boolean }) {
  const [attached, setAttached] = useState(0);
  const [cleaned, setCleaned] = useState(0);
  const ref = useCallback((node: SVGTextElement | null) => {
    if (!node) return;
    setAttached((count) => count + 1);
    return () => setCleaned((count) => count + 1);
  }, []);
  return (
    <div data-ref-probe>
      <output>
        {attached}/{cleaned}
      </output>
      <svg width={200} height={200} role="img" aria-label="Label ref probe">
        <RadialBarLabel
          show={show}
          ref={ref}
          value="Ref"
          viewBox={{
            cx: 100,
            cy: 100,
            innerRadius: 60,
            outerRadius: 80,
            startAngle: 0,
            endAngle: 180,
            clockWise: false,
          }}
        />
      </svg>
    </div>
  );
}
function Gallery() {
  const [text, setText] = useState(true);
  const [tooltips, setTooltips] = useState(true);
  const [zero, setZero] = useState(false);
  const [empty, setEmpty] = useState(false);
  const data = empty ? [] : zero ? sample.map((row) => ({ ...row, actual: 0, target: 0 })) : sample;
  return (
    <main>
      <LabelRefProbe show={text} />
      <label>
        <input type="checkbox" checked={text} onChange={(event) => setText(event.target.checked)} />{" "}
        Ring text
      </label>
      <label>
        <input
          type="checkbox"
          checked={tooltips}
          onChange={(event) => setTooltips(event.target.checked)}
        />{" "}
        Tooltips
      </label>
      <button type="button" onClick={() => setZero(!zero)}>
        Zero
      </button>
      <button type="button" onClick={() => setEmpty(!empty)}>
        Empty
      </button>
      <div style={{ width: "min(100%, 480px)" }}>
        <PolarGalleryCard
          kind="radar"
          data={data}
          animate={false}
          showText={text}
          tooltips={tooltips}
        />
        <PolarGalleryCard
          kind="radial"
          data={data}
          animate={false}
          showText={text}
          tooltips={tooltips}
        />
      </div>
    </main>
  );
}
createRoot(document.getElementById("root") as HTMLElement).render(<Gallery />);
