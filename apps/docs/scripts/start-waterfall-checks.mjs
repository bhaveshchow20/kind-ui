import { spawn } from "node:child_process";

const preview = spawn(process.execPath, ["scripts/serve.mjs"], {
  stdio: ["ignore", "pipe", "inherit"],
});
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Preview did not start")), 15000);
    preview.once("error", reject);
    preview.once("exit", (code) => reject(new Error(`Preview exited: ${code}`)));
    preview.stdout.on("data", (data) => {
      if (data.toString().includes("Docs static preview")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  for (const script of ["check-waterfall-browser.mjs"]) {
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [`scripts/${script}`], { stdio: "inherit" });
      child.once("error", reject);
      child.once("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`)),
      );
    });
  }
} finally {
  preview.kill("SIGTERM");
}
