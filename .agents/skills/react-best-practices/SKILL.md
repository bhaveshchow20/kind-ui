---
name: vercel-react-best-practices
description: Selected React rendering performance guidance for Kind UI. Use when authoring or reviewing library components, effects, or render behavior. This is a focused subset of Vercel's larger React and Next.js guide.
license: MIT
metadata:
  author: vercel
  version: '1.0.0'
---

# Selected React Performance Rules

This repository keeps three general React rules from Vercel's React Best Practices guide. Read only the rule relevant to the code under review:

- `rules/rerender-derived-state-no-effect.md` — derive values from current props/state instead of syncing duplicate state in an effect.
- `rules/rerender-lazy-state-init.md` — use lazy initialization for genuinely expensive initial values.
- `rules/rerender-no-inline-components.md` — avoid creating component types inside another component when that causes remounts.

These are review prompts, not automatic requirements. Check the current React and library APIs, actual render profile, and consumer contract before applying a rule. The subset is not a full replacement for Vercel's guide.
