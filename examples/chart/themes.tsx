import { createRoot } from "react-dom/client";
import { ThemeChart } from "./theme-chart.js";
import "./themes.css";

function App() {
  return (
    <main className="material-gallery">
      <header className="material-header">
        <a href="/">Kind UI</a>
        <nav aria-label="Chart examples">
          <a href="/recipes.html">Lines</a>
          <a href="/bars.html">Bars</a>
        </nav>
      </header>
      <div className="material-intro">
        <p className="material-eyebrow">THE MATERIAL STUDIES / 01–02</p>
        <h1>Same data. Different feeling.</h1>
        <p>Two ways to give a chart a little more dimension.</p>
      </div>
      <div className="material-studies">
        <section className="material-study material-glass" aria-labelledby="glass-title">
          <div className="material-stage">
            <div className="material-orb material-orb-one" aria-hidden="true" />
            <div className="material-orb material-orb-two" aria-hidden="true" />
            <div className="material-card glass">
              <header className="material-card-header">
                <div>
                  <p className="material-eyebrow">01 / GLASS</p>
                  <h2 id="glass-title">A clearer perspective.</h2>
                </div>
                <span className="material-card-symbol" aria-hidden="true">
                  ◈
                </span>
              </header>
              <ThemeChart material="glass" />
            </div>
          </div>
          <div className="material-caption">
            <h3>Glass / daisyUI</h3>
            <p>Frosted surfaces, luminous edges, and a crisp cyan line.</p>
          </div>
        </section>
        <section className="material-study material-clay" aria-labelledby="clay-title">
          <div className="material-stage">
            <div className="material-card clay">
              <header className="material-card-header">
                <div>
                  <p className="material-eyebrow">02 / CLAY</p>
                  <h2 id="clay-title">A softer point of view.</h2>
                </div>
                <span className="material-card-symbol clay" aria-hidden="true">
                  〰
                </span>
              </header>
              <ThemeChart material="clay" />
            </div>
          </div>
          <div className="material-caption">
            <h3>Clay / clay.css</h3>
            <p>Inflated surfaces, sculpted shadows, and a rounded cobalt line.</p>
          </div>
        </section>
      </div>
      <footer className="material-page-footer">
        Sample data · Explore with a pointer or keyboard. Both examples include a data table.
      </footer>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(<App />);
