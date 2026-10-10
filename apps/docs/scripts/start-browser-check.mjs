import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

if (
  !existsSync("artifacts/registry-consumer/registry-results.json") ||
  !existsSync("artifacts/registry-consumer/dist/index.html")
) {
  throw new Error(
    "Run `npm run check:registry` before `npm run check:browser` to prepare the installed registry consumer.",
  );
}

const preview = spawn(process.execPath, ["scripts/serve.mjs"], {
  stdio: ["ignore", "pipe", "inherit"],
});
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Preview did not start in 15 seconds")),
      15000,
    );
    preview.once("error", reject);
    preview.once("exit", (code) =>
      reject(new Error(`Preview exited with ${code}; reserved port may be occupied`)),
    );
    preview.stdout.on("data", (data) => {
      if (data.toString().includes("Docs static preview")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  for (const script of [
    "check-browser.mjs",
    "check-distribution.mjs",
    "check-registry-browser.mjs",
  ]) {
    const code = await new Promise((resolve, reject) => {
      const check = spawn(process.execPath, [`scripts/${script}`], { stdio: "inherit" });
      check.once("error", reject);
      check.once("exit", resolve);
    });
    if (code !== 0) throw new Error(`Docs browser check exited with ${code}`);
  }
} finally {
  preview.kill("SIGTERM");
}
