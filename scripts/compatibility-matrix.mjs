import assert from "node:assert/strict";
import { minVersion, prerelease, satisfies, valid } from "semver";

/**
 * @typedef {{ id: string, versions: Record<string, string>, viteOutput: string,
 * nextOutput: string, vitePort: number, nextPort: number }} CompatibilityRow
 */

// Deliberate registry-verified selections (2026-10-11), independent of root
// development dependencies. Do not replace these with "latest" or ranges.
const common = {
  react: "19.3.0",
  "react-dom": "19.3.0",
  "react-is": "19.3.0",
  recharts: "3.10.1",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
  "@types/node": "22.20.4",
  typescript: "5.9.3",
  next: "16.3.8",
  "lucide-react": "1.50.0",
};

/** @type {readonly CompatibilityRow[]} */
export const compatibilityMatrix = Object.freeze([
  {
    id: "peer-floor",
    versions: Object.freeze({
      ...common,
      motion: "13.4.6",
      "framer-motion": "13.4.6",
      "motion-dom": "13.4.5",
      "motion-utils": "13.3.0",
      tailwindcss: "4.0.0",
      "@tailwindcss/vite": "4.0.0",
      "@tailwindcss/postcss": "4.0.0",
      "@tailwindcss/node": "4.0.0",
      "@tailwindcss/oxide": "4.0.0",
      // Tailwind 4.0.0's plugin declares Vite ^5.2.0 || ^6.
      vite: "6.4.4",
    }),
    viteOutput: "artifacts/packed-line-integrations",
    nextOutput: "artifacts/packed-line-next",
    vitePort: 6900,
    nextPort: 6901,
  },
  {
    id: "selected-stable",
    versions: Object.freeze({
      ...common,
      motion: "13.5.1",
      "framer-motion": "13.5.1",
      "motion-dom": "13.5.1",
      "motion-utils": "13.5.0",
      tailwindcss: "4.3.3",
      "@tailwindcss/vite": "4.3.3",
      "@tailwindcss/postcss": "4.3.3",
      "@tailwindcss/node": "4.3.3",
      "@tailwindcss/oxide": "4.3.3",
      vite: "8.3.1",
    }),
    viteOutput: "artifacts/packed-compatibility-selected-vite",
    nextOutput: "artifacts/packed-compatibility-selected-next",
    vitePort: 6902,
    nextPort: 6903,
  },
]);

/** @param {Record<string, string | undefined>} peers @param {readonly CompatibilityRow[]} [rows] */
export function assertCompatibilityMatrix(peers, rows = compatibilityMatrix) {
  assert.equal(rows.length, 2, "Keep the compatibility proof to two representative rows");
  assert.deepEqual(
    rows.map((row) => row.id),
    ["peer-floor", "selected-stable"],
  );
  const ports = rows.flatMap((row) => [row.vitePort, row.nextPort]);
  assert.equal(new Set(ports).size, ports.length, "Compatibility servers need distinct ports");
  for (const row of rows) {
    for (const [name, version] of Object.entries(row.versions)) {
      assert.equal(valid(version), version, `${row.id}: ${name} must be pinned exactly`);
      assert.equal(prerelease(version), null, `${row.id}: ${name} must be stable`);
    }
    for (const [name, range] of Object.entries(peers)) {
      assert.ok(range, `Missing peer range for ${name}`);
      const version = row.versions[name];
      assert.ok(version, `${row.id}: missing declared peer ${name}`);
      assert.ok(satisfies(version, range), `${row.id}: ${name}@${version} is outside ${range}`);
      if (row.id === "peer-floor")
        assert.equal(version, minVersion(range)?.version, `${name}: minimum peer must be tested`);
    }
    for (const name of [
      "@tailwindcss/vite",
      "@tailwindcss/postcss",
      "@tailwindcss/node",
      "@tailwindcss/oxide",
    ])
      assert.equal(
        row.versions[name],
        row.versions.tailwindcss,
        `${row.id}: compiler versions must match`,
      );
    assert.equal(
      row.versions["framer-motion"],
      row.versions.motion,
      `${row.id}: Motion implementation must match`,
    );
    assert.equal(row.versions["react-dom"], row.versions.react);
    assert.equal(row.versions["react-is"], row.versions.react);
    assert.ok(row.viteOutput.startsWith("artifacts/packed-"));
    assert.ok(row.nextOutput.startsWith("artifacts/packed-"));
  }
}
