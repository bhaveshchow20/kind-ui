import { readFileSync } from "node:fs";

// Public downloads use npm; internal checks use the independently installed fixture.
export function verificationFiles(bundle, publicFiles = bundle.files) {
  const files = { ...publicFiles };
  if (bundle.localPackage) {
    const manifest = JSON.parse(files["package.json"]);
    manifest.dependencies["@kind-ui/charts"] = "file:vendor/kind-ui-charts-0.3.0.tgz";
    files["package.json"] = `${JSON.stringify(manifest, null, 2)}\n`;
    files["package-lock.json"] = readFileSync("examples/shared/consumer-package-lock.json", "utf8");
  }
  return files;
}
