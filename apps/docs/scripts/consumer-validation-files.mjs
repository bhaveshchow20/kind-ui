import { readFileSync } from "node:fs";

// Recharts' Redux Toolkit declarations fail exact optional checking
// (TaskAbortError.code and async-thunk constraints). The source/build gate
// retains exact optional properties; these modes still check all declarations.
export const declarationCompilerOptions = {
  module: "NodeNext",
  moduleResolution: "NodeNext",
  exactOptionalPropertyTypes: false,
  skipLibCheck: false,
  types: ["react", "react-dom"],
};

// Public downloads use npm; internal checks use the independently installed fixture.
export function verificationFiles(bundle, publicFiles = bundle.files) {
  const files = { ...publicFiles };
  if (bundle.localPackage) {
    const manifest = JSON.parse(files["package.json"]);
    manifest.dependencies["@kind-ui/charts"] = "file:vendor/kind-ui-charts-0.5.0.tgz";
    files["package.json"] = `${JSON.stringify(manifest, null, 2)}\n`;
    files["package-lock.json"] = readFileSync("examples/shared/consumer-package-lock.json", "utf8");
  }
  return files;
}
