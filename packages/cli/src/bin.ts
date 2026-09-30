#!/usr/bin/env node
import { applyPlan, createPlan, type Request } from "./index.js";

const help = `Kind UI · kind-ui (private scaffold, React 19 + TypeScript)

Usage:
  kind-ui init [--cwd <directory>] [--dry-run]
  kind-ui add charts/line [--cwd <directory>] [--dry-run]

Plans local bundled files before writing. Never overwrites files or installs dependencies.
No remote registries, framework detection, upgrade command, or prompts are implemented.`;

async function main(args: string[]) {
  if (args.length === 0 || (args.length === 1 && ["--help", "-h"].includes(args[0] ?? ""))) {
    console.log(help);
    return;
  }
  let cwd = process.cwd();
  let dryRun = false;
  let cwdSeen = false;
  const positional: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run" && !dryRun) dryRun = true;
    else if (arg === "--cwd" && !cwdSeen) {
      const next = args[index + 1];
      if (!next || next.startsWith("--")) throw new Error("--cwd needs a directory");
      cwd = next;
      cwdSeen = true;
      index += 1;
    } else if (arg?.startsWith("-")) throw new Error(`Unknown or duplicate option: ${arg}`);
    else if (arg) positional.push(arg);
  }
  let request: Request;
  if (positional.length === 1 && positional[0] === "init") request = { command: "init" };
  else if (positional.length === 2 && positional[0] === "add" && positional[1]) {
    request = { command: "add", recipe: positional[1] };
  } else throw new Error(`Invalid command.\n${help}`);
  const plan = await createPlan(cwd, request);
  console.log(`${dryRun ? "Dry run" : "Plan"}: ${plan.root}`);
  for (const file of plan.files) console.log(`  ${file.action}: ${file.path}`);
  if (!dryRun) {
    await applyPlan(plan);
    console.log("Done. Existing files were not overwritten.");
  }
  for (const note of plan.notes) console.log(note);
  if (plan.installCommands.length) {
    console.log("Dependency command (run yourself once packages are available):");
    for (const command of plan.installCommands) console.log(`  ${command}`);
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
