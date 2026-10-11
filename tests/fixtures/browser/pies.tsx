import "./pies.css";
import { Allocation } from "./pie-recipes.js";
import { SelectiveGlowChart } from "./pie-selective-glow.js";

export default function PieFixture() {
  return (
    <main>
      <header>
        <h1>Pie regression cases</h1>
      </header>
      <div className="pie-grid">
        <Allocation />
        <Allocation donut />
        <SelectiveGlowChart />
      </div>
    </main>
  );
}
