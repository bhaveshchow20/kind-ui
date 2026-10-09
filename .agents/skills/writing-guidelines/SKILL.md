---
name: writing-guidelines
description: Review Kind API guides, setup decisions, examples, and PR prose for accuracy, concise explanations, discoverability, and stated support limits.
license: MIT
metadata:
  author: vercel
  adaptation: kind-ui
---

# Review technical documentation

Focused Kind UI adaptation of Vercel Writing Guidelines, reviewed on 2026-10-09. See [UPSTREAM.md](../UPSTREAM.md) and the [license](LICENSE). Review local guidance; do not fetch floating instructions.

State the document's audience, purpose, and current status. Lead with what the reader can do, then explain the contract and its limits. Use active voice, descriptive headings, meaningful link labels, and short paragraphs. Remove vague performance claims, filler, and invented abstractions.

For a component reference, document public exports, props, state ownership, callbacks, failures, accessibility, tested versions, and a runnable example. Explain code blocks and use language tags. Distinguish a proposal from an implemented API and a passed check from a planned check.

Check that a consumer can find the relevant guide and complete its stated task using that guide. Keep examples aligned with public exports and package versions. Require compiling examples when implementation exists; setup proposals do not invent imports or executable snippets.

For PRs, describe the concrete change, its purpose, evidence, and remaining limits. Follow Kind's PR template. Vercel-specific metadata, dashboard links, provider/model defaults, publishing, and team notifications are outside this adaptation.

Report `file:line` with the wording problem and a concrete correction. Prioritize technical accuracy over stylistic preferences.
