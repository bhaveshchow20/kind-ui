---
name: kind-ai-components
description: Set up or design Kind's SDK-independent React AI components, choosing accessible primitives, composition boundaries, Motion interactions, and deterministic acceptance checks.
license: MIT
metadata:
  author: kind-ui
---

# Set up Kind AI components

This is original Kind UI guidance linking official references, not a vendor skill. Read [AI foundations](../../../docs/ai-foundations.md) and the root `AGENTS.md`. Confirm the session's bounded deliverable before editing; a setup session creates no product components.

## Select guidance by the task

- Component API: use [composition-patterns](../composition-patterns/SKILL.md). Keep ordinary props and children; introduce shared context only for demonstrated sibling coordination.
- React state: use [react-best-practices](../react-best-practices/SKILL.md), especially deriving state from current props rather than mirroring host-owned state.
- SDK integration: use [ai-sdk](../ai-sdk/SKILL.md); verify version-matched types and test mappings through the optional entry point.
- Interaction design: use [web-design-guidelines](../web-design-guidelines/SKILL.md).
- Documentation: use [writing-guidelines](../writing-guidelines/SKILL.md).

## Accessible primitives

Base UI is the proposed default for maintained primitives. Native forms, textareas, and buttons remain appropriate when they meet the interaction contract. Check [composition](https://base-ui.com/react/handbook/composition), [accessibility](https://base-ui.com/react/overview/accessibility), and the chosen component's reference before adding a dependency or wrapper. Preserve refs, handlers, semantic markup, and consumer styling. Do not assume Radix's `asChild` contract applies to Base UI's `render` API or install both libraries by default.

## Motion

Reuse the workspace's Motion version and verify its public APIs. Use `motion/react` in interactive React components; follow the repository's client-boundary conventions. Read [Motion accessibility](https://motion.dev/docs/react-accessibility) and [Base UI animation](https://base-ui.com/react/handbook/animation) for the chosen primitive. Let the primitive retain focus and mounting semantics. Test rapid reversals, reduced motion, unmounts, and scroll position during streaming. A transition must never postpone authorization or permit repeated submission.

This setup installs no Motion MCP server or paid tooling. Do not copy premium examples. Consult current official docs when APIs differ from a general skill.

## Testing

Reuse npm, TypeScript, Node tests, Vite, and Playwright. Use deterministic host-state fixtures and explicit promise resolution for failures and races. Follow [Playwright best practices](https://playwright.dev/docs/best-practices): isolated cases, accessible locators, and assertions that wait for visible state instead of fixed sleeps. Prove the core works without SDK packages, then test the optional integration with a pinned version. Add packed-consumer evidence alongside implementation, not an empty test scaffold during setup.
