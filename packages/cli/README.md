# @kind-ui/cli

Private, experimental local recipe CLI for React 19 + TypeScript applications. The package belongs to Kind UI and exposes the `kind-ui` binary. Nothing is published, and npm scope ownership is unverified. Requires Node 22.12+.

The CLI copies optional application compositions over maintained runtime libraries. It is not required to use `@kind-ui/charts`, and it does not generate a whole application.

## Run the local build

From the workspace root:

```sh
npm ci
npm run build:packages
node packages/cli/dist/bin.js --help
node packages/cli/dist/bin.js init --cwd /absolute/path/to/your-react-project --dry-run
node packages/cli/dist/bin.js init --cwd /absolute/path/to/your-react-project
node packages/cli/dist/bin.js add charts/line --cwd /absolute/path/to/your-react-project --dry-run
node packages/cli/dist/bin.js add charts/line --cwd /absolute/path/to/your-react-project
```

Replace the example path with an existing React 19 + TypeScript project containing `package.json`. The CLI does not detect a framework or verify/install its dependencies. Its output explicitly warns that compatibility is unchecked; review the existing React version before installing the runtime. The suggested command does not install or upgrade React. With a local packed CLI installed, the equivalent binary is `kind-ui`:

```text
kind-ui init [--cwd <dir>] [--dry-run]
kind-ui add charts/line [--cwd <dir>] [--dry-run]
```

Without `--cwd`, the current working directory is used. `--dry-run` validates and prints a write plan without creating files or directories. Errors exit nonzero. `--help` and `-h` show usage. There are no interactive prompts, overwrite flag, `update`, app generator, framework detection, or remote registry commands.

## Configuration and output

`init` creates this `kind-ui.json`:

```json
{
  "schemaVersion": 1,
  "framework": "react",
  "recipesDir": "src/components/ui"
}
```

An existing valid configuration is left unchanged. Unknown fields and unsupported schemas/frameworks are rejected. Before adding the recipe, you may change `recipesDir` to a safe, slash-separated relative source path. Absolute paths, traversal, backslashes, and unsupported path characters are rejected; `node_modules` and `dist` destinations are not allowed. There are no alias or stylesheet fields.

`add charts/line` requires the configuration and creates two files:

- `src/components/ui/charts/line-chart-demo.tsx` by default: the editable `LineChartDemo` composition, with linked `LineChart` and `DataTable` selection over `@kind-ui/charts`
- `kind-ui/recipes/charts-line.json`: a receipt with schema version, recipe ID/version, runtime requirement, generated source path, and original SHA-256 hash

The bundled recipe is version `0.0.0`, requires `@kind-ui/charts@0.0.0` and React `^19.0.0`, and verifies its bundled source against the manifest hash before planning. Its `"use client"` directive marks the interactive composition; this alone is not a claim that Next.js integration has been tested. Import and render `LineChartDemo` from its copied path in your application.

## Existing files and edits

- Nothing is overwritten. An existing valid config remains unchanged
- Identical recipe source is left unchanged; a missing matching receipt can be added
- When the receipt matches, edited recipe source is preserved and reported as `preserve`
- A differing untracked source file is refused instead of replacing or adopting it
- A deleted recipe source file can be recreated when its receipt still matches
- A changed configured destination or recipe version that disagrees with the receipt is refused. Moves and upgrades are not implemented

Keep the receipt with the generated file. It records the original baseline, not the current contents of consumer edits, and is not a dependency lockfile. Re-running the CLI does not merge a future version into your edited source.

Planning is read-only. Apply rechecks the plan against the current project, rejects changed state, and uses exclusive creation for new files. Existing symlinks in project file paths are refused, including symlinks pointing within the project. These safeguards protect ordinary local usage; this is not a transaction system or a sandbox against a hostile process concurrently changing the filesystem.

## Dependencies and ownership

The generated composition belongs to the consumer to edit. Chart semantics, geometry, SVG rendering, and exact-value table behavior stay in maintained packages. Consumers choose and test runtime dependency updates separately from edits to copied source.

The CLI never contacts a network service, runs an installer, changes `package.json`, or upgrades dependencies. It prints the recipe's dependency requirement for review. A displayed `npm install @kind-ui/charts@0.0.0 ...` command is informational only: this project has not published these private packages, and npm scope ownership is unverified. Use local tarballs to test this scaffold.

For this scaffold, after `npm run build:packages`, `npm run package:check` at the workspace root runs `scripts/check-packages.mjs`: it packs all three packages into `artifacts/`, installs their local tarballs in a temporary consumer, exercises the packed CLI, compiles the generated recipe, and server-renders it against the packed runtime. That check can use npm to obtain third-party dependencies; the CLI itself has no install or network behavior. The temporary consumer is removed after the check.

The manifest is versioned, but the installer deliberately supports only the bundled `charts/line@0.0.0` recipe and its exact runtime contract. Adding another recipe or changing that contract requires installer changes and tests; there is no generic recipe/plugin protocol yet.

No third-party registry, executable hook, telemetry, whole-app generator, automatic migration, or source-merge engine is included. Original implementation is MIT © 2026 Bhavesh Chowdhury.
