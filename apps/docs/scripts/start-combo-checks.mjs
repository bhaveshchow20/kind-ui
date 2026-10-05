import { spawn } from "node:child_process";

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
  const code = await new Promise((resolve, reject) => {
    const check = spawn(process.execPath, ["scripts/check-combo-browser.mjs"], {
      stdio: "inherit",
    });
    check.once("error", reject);
    check.once("exit", resolve);
  });
  if (code !== 0) throw new Error(`Combo browser checks exited with ${code}`);
} finally {
  preview.kill("SIGTERM");
}
