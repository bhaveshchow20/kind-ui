---
name: ai-sdk
description: Verify version-matched AI SDK message, tool, approval, and action contracts when designing or testing Kind's optional SDK integration. Core React components remain SDK independent.
license: Apache-2.0
metadata:
  author: vercel
  adaptation: kind-ui
---

# Verify the AI SDK boundary

Kind UI adaptation of Vercel's `skills/use-ai-sdk/SKILL.md`, reviewed on 2026-10-09. See [provenance](../UPSTREAM.md), [license](LICENSE), and [notice](NOTICE). Modified to limit work to SDK integration and deterministic verification.

## Verify before designing

Treat remembered SDK APIs as unverified. Check the consuming package's manifest and lockfile first. Read the installed version's `ai/docs/` and `ai/src/`; check framework documentation in `@ai-sdk/react` when applicable. Search the [official docs](https://ai-sdk.dev/docs) only when the matching local reference is unavailable. Documentation pages also offer Markdown views.

Check actual types for message parts, tool identities, tool states, approval responses, submission actions, and transport. Record the tested version and unsupported cases. Typecheck representative consumers after integration changes.

## Kind's scope

- During setup, inspect documentation and record proposals. Do not install runtime dependencies to read a guide.
- During implementation, select and pin dependencies in the package that needs them using npm and the existing lockfile. Verify peer ranges with actual consumers.
- Keep SDK types and imports inside an optional adapter entry point. Core props, children, and callbacks must remain usable without `ai` or `@ai-sdk/react`.
- Preserve message, tool-call, and approval IDs. Do not infer execution or cancellation solely from chat-level status.
- Model a submitted approval separately from its accepted decision and the resulting tool execution. Verify manual versus automatic approval behavior for the tested SDK version.
- Use fixtures or mock transport for checks. Model selection, provider installation, gateway authentication, credentials, and DevTools belong to separately requested application work.

Apply [Kind AI setup](../../../docs/ai-foundations.md) and the host-ownership contract. This guide does not authorize SDK upgrades, backend development, or model calls.
