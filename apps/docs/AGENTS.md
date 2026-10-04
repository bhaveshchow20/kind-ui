# Docs app working guide

Read repository AGENTS.md and CONTRIBUTING.md first. This application is independently installed, with its own pinned npm lockfile; do not turn it into a second chart package or change library APIs while writing docs.

Use public @kind-ui/charts exports and pinned peers in examples. This PR publishes only Line. Maintain its five complete consumers and keep curve/material choices synchronized with Code and Copy prompt. Other component pages belong in separate reviewed PRs. Generated files are outputs; edit source examples, MDX or public type aliases instead.

Read actual declarations before writing generated reference aliases. Clearly distinguish built-in, explicit composition and unsupported behavior. Materials are family-specific. Automatic paint emphasis is narrower than tooltip inspection. Glass stays paused.

Keep the clean example-first Preview/Usage/Code flow, accessible navigation and restrained brand cues. Fumadocs supplies infrastructure; avoid a handwritten docs engine. Keep API/Markdown generation and syntax highlighting on the build/server side; lazy-load chart demos and search. Measure route behavior and transferred JS before claiming performance.

Required docs checks: prepare validated artifact, app typecheck/build, copied consumers, contract/export checks and the local browser script. Use only reserved port 6373 (or explicitly assigned 6374–6379). Root aggregate browser fleets require coordination with other sessions. Report exact passed, failed and unrun checks.

The Sites checkout is generated static output from the pushed GitHub docs source, not another editable app. Only the selected docs owner may register/deploy the new private docs project; never edit the existing showcase. Do not publish npm, merge main, change audience, create credentials or enable future releases.
