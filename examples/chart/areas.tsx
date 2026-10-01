import { useState } from "react";
import { createRoot } from "react-dom/client";
import type { AreaPoint, AreaSeriesConfig, StackedAreaPoint } from "./area-recipes.js";
import {
  GradientArea,
  InteractiveArea,
  LinearArea,
  PercentArea,
  SmoothArea,
  StackedArea,
  StepArea,
  ThresholdArea,
} from "./area-recipes.js";
import { useReducedMotionPreference } from "./use-reduced-motion.js";
import "./style.css";
import "./recipes.css";

const visits: AreaPoint[] = [
  { period: "Jan", value: 186 },
  { period: "Feb", value: 305 },
  { period: "Mar", value: 237 },
  { period: "Apr", value: 198 },
  { period: "May", value: 209 },
  { period: "Jun", value: 0 },
];
const devices: StackedAreaPoint[] = [
  { period: "Jan", desktop: 186, mobile: 80 },
  { period: "Feb", desktop: 305, mobile: 200 },
  { period: "Mar", desktop: 237, mobile: 120 },
  { period: "Apr", desktop: 173, mobile: 190 },
  { period: "May", desktop: 209, mobile: 130 },
  { period: "Jun", desktop: 214, mobile: 140 },
];
const zeroDevices: StackedAreaPoint[] = devices.map(({ period }) => ({
  period,
  desktop: 0,
  mobile: 0,
}));
const deviceConfig: AreaSeriesConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
};
const count = (value: number) => `${value.toLocaleString()} visits`;
const entries = [
  "Smooth",
  "Linear",
  "Step",
  "Gradient",
  "Threshold",
  "Stacked",
  "Percent stacked",
  "Interactive",
] as const;

function AreaTable({
  data,
  caption,
  stacked = false,
  stackedData,
}: {
  data: AreaPoint[];
  caption: string;
  stacked?: boolean;
  stackedData?: StackedAreaPoint[];
}) {
  return (
    <table>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          {stacked ? (
            <>
              <th scope="col">Desktop</th>
              <th scope="col">Mobile</th>
            </>
          ) : (
            <th scope="col">Visits</th>
          )}
        </tr>
      </thead>
      <tbody>
        {stacked ? (
          stackedData?.length ? (
            stackedData.map((row) => (
              <tr key={row.period}>
                <th scope="row">{row.period}</th>
                <td>{count(row.desktop)}</td>
                <td>{count(row.mobile)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>No data yet.</td>
            </tr>
          )
        ) : data.length ? (
          data.map((row) => (
            <tr key={row.period}>
              <th scope="row">{row.period}</th>
              <td>{row.value == null ? "No data" : count(row.value)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={stacked ? 3 : 2}>No data yet.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function App() {
  const [palette, setPalette] = useState<"monochrome" | "color">("monochrome");
  const [motion, setMotion] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [missingApril, setMissingApril] = useState(false);
  const [allZero, setAllZero] = useState(false);
  const [visibleSeries, setVisibleSeries] = useState<("desktop" | "mobile")[]>([
    "desktop",
    "mobile",
  ]);
  const reducedMotion = useReducedMotionPreference();
  const animate = motion && !reducedMotion;
  const chartDevices = allZero ? zeroDevices : devices;
  const chartVisits = missingApril
    ? visits.map((point) => (point.period === "Apr" ? { ...point, value: null } : point))
    : visits;
  return (
    <main className="recipes" data-palette={palette} data-motion={animate ? "on" : "off"}>
      <header className="recipes-header">
        <a href="/">Kind UI</a>
        <h1>Area recipes</h1>
        <nav aria-label="Chart families">
          <a href="/recipes.html">Line recipes</a>
          <a href="/bars.html">Bar recipes</a>
        </nav>
      </header>
      <div className="recipes-controls">
        <fieldset aria-label="Palette">
          <legend className="sr-only">Palette</legend>
          {(["monochrome", "color"] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={palette === value}
              onClick={() => setPalette(value)}
            >
              {value === "color" ? "Color" : "Monochrome"}
            </button>
          ))}
        </fieldset>
        <label>
          <input
            type="checkbox"
            checked={motion}
            onChange={(event) => setMotion(event.target.checked)}
          />{" "}
          Motion
        </label>
        <label>
          <input
            type="checkbox"
            checked={allZero}
            onChange={(event) => setAllZero(event.target.checked)}
          />{" "}
          All-zero stack
        </label>
        <label>
          <input
            type="checkbox"
            checked={missingApril}
            onChange={(event) => setMissingApril(event.target.checked)}
          />{" "}
          Missing April data
        </label>
        <label>
          <input
            type="checkbox"
            checked={empty}
            onChange={(event) => setEmpty(event.target.checked)}
          />{" "}
          Empty data
        </label>
      </div>
      <div className="recipe-stack">
        {entries.map((name) => (
          <section className="recipe-card" aria-label={name} key={name}>
            <h2>{name}</h2>
            <p className="recipe-description">Monthly visitors · Jan–Jun</p>
            {empty ? (
              <p role="status" className="recipe-empty">
                No data yet.
              </p>
            ) : (
              <>
                {name === "Smooth" && (
                  <SmoothArea
                    data={chartVisits}
                    label="Monthly visitors"
                    formatValue={count}
                    motion={animate ? {} : undefined}
                  />
                )}
                {name === "Linear" && (
                  <LinearArea
                    data={chartVisits}
                    label="Monthly visitors, linear"
                    formatValue={count}
                    motion={animate ? {} : undefined}
                  />
                )}
                {name === "Step" && (
                  <StepArea
                    data={chartVisits}
                    label="Monthly visitors, step"
                    formatValue={count}
                    motion={animate ? {} : undefined}
                  />
                )}
                {name === "Gradient" && (
                  <GradientArea
                    data={chartVisits}
                    label="Monthly visitors, gradient"
                    formatValue={count}
                    motion={animate ? {} : undefined}
                  />
                )}
                {name === "Threshold" && (
                  <ThresholdArea
                    data={chartVisits}
                    label="Monthly visitors"
                    formatValue={count}
                    threshold={320}
                    motion={animate ? {} : undefined}
                  />
                )}
                {name === "Stacked" && (
                  <StackedArea
                    data={chartDevices}
                    label="Visitors by device"
                    config={deviceConfig}
                    motion={animate ? {} : undefined}
                  />
                )}
                {name === "Percent stacked" && (
                  <PercentArea
                    data={chartDevices}
                    label="Share by device"
                    config={deviceConfig}
                    motion={animate ? {} : undefined}
                  />
                )}
                {name === "Interactive" && (
                  <InteractiveArea
                    data={chartDevices}
                    label="Visitors by device, interactive"
                    config={deviceConfig}
                    visibleSeries={visibleSeries}
                    onVisibleSeriesChange={setVisibleSeries}
                    motion={animate ? {} : undefined}
                  />
                )}
              </>
            )}
            <details>
              <summary>View data</summary>
              <AreaTable
                data={empty ? [] : chartVisits}
                caption={`${name} visits by month`}
                stacked={name === "Stacked" || name === "Percent stacked" || name === "Interactive"}
                stackedData={empty ? [] : chartDevices}
              />
            </details>
          </section>
        ))}
      </div>
      <footer>Sample data · Stacked recipes use complete nonnegative values.</footer>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(<App />);
