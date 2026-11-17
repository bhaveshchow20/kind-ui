export const appName = "Charts";
export const docsRoute = "/docs";

// Set both to host the site elsewhere, for example under `/docs/charts`.
export const origin = process.env.NEXT_PUBLIC_DOCS_ORIGIN ?? "http://localhost:3000";
export const basePath = process.env.NEXT_PUBLIC_DOCS_BASE_PATH ?? "";

export const gitConfig = {
  user: "kind-ui",
  repo: "charts",
  branch: "main",
};
