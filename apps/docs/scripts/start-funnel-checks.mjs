import { spawn } from "node:child_process";

const port = process.env.KIND_DOCS_PORT ?? "6378";
const env = {
  ...process.env,
  KIND_DOCS_PORT: port,
  KIND_DOCS_BROWSER_ORIGIN: process.env.KIND_DOCS_BROWSER_ORIGIN ?? `http://127.0.0.1:${port}`,
};
const preview = spawn(process.execPath, ["scripts/serve.mjs"], {
  env,
  stdio: ["ignore", "pipe", "inherit"],
});
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Funnel preview did not start in 15 seconds")),
      15000,
    );
    const fail = (error) => {
      clearTimeout(timeout);
      reject(error);
    };
    preview.once("error", fail);
    preview.once("exit", (code) =>
      fail(new Error(`Funnel preview exited ${code}; reserved port ${port} may be occupied`)),
    );
    preview.stdout.on("data", (data) => {
      if (data.toString().includes("Docs static preview")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  const code = await new Promise((resolve, reject) => {
    const check = spawn(process.execPath, ["scripts/check-funnel-browser.mjs"], {
      env,
      stdio: "inherit",
    });
    check.once("error", reject);
    check.once("exit", resolve);
  });
  if (code !== 0) throw new Error(`Funnel docs browser check exited ${code}`);
} finally {
  preview.kill("SIGTERM");
}
