import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// An allowlist makes new/unknown paths run browsers by default. The Docs
// workflow still validates apps/docs; packed README contracts always run.
/** @param {string[]} paths */
export function needsBrowsers(paths) {
  return (
    paths.length === 0 ||
    paths.some(
      (path) =>
        !(
          /^[^/]+\.md$/.test(path) ||
          path.startsWith("docs/") ||
          path.startsWith("apps/docs/") ||
          /^packages\/charts\/[^/]+\.md$/.test(path)
        ),
    )
  );
}

/** @param {string | undefined} base @param {string | undefined} head */
export function changedPaths(base, head) {
  if (
    !/^[a-f0-9]{40}$/.test(base ?? "") ||
    /^0+$/.test(base ?? "") ||
    !/^[a-f0-9]{40}$/.test(head ?? "")
  )
    return null;
  if (!base || !head) return null;
  // Do not detect renames: moving code into docs must still test the deletion.
  return execFileSync("git", ["diff", "--no-renames", "--name-only", "-z", base, head], {
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let paths;
  try {
    paths = changedPaths(process.env.DIFF_BASE, process.env.DIFF_HEAD);
  } catch (error) {
    console.warn(
      `Cannot compare changes; running browsers: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const browsers = paths ? needsBrowsers(paths) : true;
  if (!process.env.GITHUB_OUTPUT) throw new Error("GITHUB_OUTPUT is required");
  appendFileSync(process.env.GITHUB_OUTPUT, `browsers=${browsers}\n`);
  console.log(`Browser suite required: ${browsers}`);
}
