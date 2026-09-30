# Kind UI architecture principles and acceptance criteria

Status: design guidance. The [chart component API](../packages/kind-ui/README.md) has a focused React consumer; this document does not establish a cross-stack support matrix or runtime-generation protocol.

## Purpose

Kind UI should help people and coding agents discover, compose, and customize useful UI capabilities through predictable typed contracts. Performance, accessibility, extensibility, and a familiar developer experience are acceptance criteria for each capability, not existing guarantees.

## Public capability contracts

Each implemented capability should document its purpose, public exports, inputs and outputs, state ownership, errors, accessibility requirements, tested environment versions, and a runnable example. A versioned capability index should connect common tasks to these references without making consumers learn a universal UI language.

Use stable names and links so a consumer can retrieve one capability without loading an entire catalog. Keep types, documentation, and examples aligned with the same version. Document supported combinations and limits; do not advertise absent exports or unverified installation paths.

## Authoring and runtime boundaries

- **Source authoring:** a coding agent proposes ordinary application code using public documentation, types, and examples. The application developer remains responsible for reviewing dependencies, permissions, behavior, and tests before shipping.
- **Runtime model output:** UI data or intent produced by a model is untrusted input. A host-owned boundary must validate allowed components, props, values, URLs, and resource limits before rendering. Do not evaluate generated code or treat model text as trusted HTML. Rendering a proposed action does not authorize executing it; the host retains authentication, tool permissions, and required confirmations.

Coding-agent authoring is the initial concern. Any runtime-generation integration needs a separate threat model and validation design. This guidance introduces no agent runtime or universal UI schema.

## Logical responsibilities

1. **Behavior:** keep identity, validation, and state transitions explicit when a capability needs them. Start locally; extract shared responsibilities only after a real second consumer needs the same contract. A distinct-stack probe is required before portability claims.
2. **Integration:** connect behavior to the consumer's rendering, state, lifecycle, and extension conventions. Reuse established primitives for geometry, scales, focus, and interactions. Integration choices and package boundaries require evidence from actual consumers.
3. **Presentation:** compose maintained primitives into useful, editable examples. Keep styling and presentation replaceable and consumer-owned. Avoid duplicating internals or requiring a recipe installer to consume a runtime API.

These responsibilities guide implementation; they do not prescribe a package graph or supported framework list.

## Composition and state

- Prefer ordinary typed props and events. Explain who owns each state value and which actions can change it; avoid a second hidden state store.
- Preserve relevant DOM props, classes/styles, refs, handlers, semantic elements, and accessibility attributes through documented composition points.
- Where a feature has async work, define the relevant loading, partial, complete, error, cancellation, retry, and stale-result behavior. Do not impose states a feature does not need.
- Report invalid input and unsupported combinations with actionable errors. Do not silently change the meaning of consumer data.
- Keep extension points useful without blocking the consumer's underlying APIs. Any additional abstraction needs a concrete benefit and an explicit maintenance and compatibility cost.

## Acceptance criteria for a capability

Before proposing implementation, record its intended consumer task, tested stack and dependency versions, sample data, expected behavior, and measurable budgets.

1. Clean installation, build, typecheck, public-export, and packed-consumer checks pass.
2. Representative consumers can build and modify the documented example using public docs/types/examples without project-conversation context or maintainer coaching. Record discovery failures, invented APIs, retries, and manual interventions; small trials do not establish general agent reliability.
3. Automated interaction checks cover the chosen task's relevant keyboard/focus behavior, empty or missing data, invalid inputs, customization, and any cancellation, retry, or stale-result paths.
4. Semantic roles, accessible names, focus handling, and composition contracts are preserved. Include an appropriate assistive-technology check; passing one fixture does not establish WCAG conformance.
5. Production bundle and runtime measurements meet a predeclared budget under a repeatable environment and workload. Report absolute and incremental costs and explain regressions.
6. Each claimed stack has a tested consumer integration. Shared-core claims require a real second consumer; cross-stack portability claims also require a distinct framework/engine integration. Record what is shared and what must stay integration-specific; an empty adapter is not evidence.

Publish the results and unresolved limits with the capability. Implementation and compatibility claims require their own focused review and passing checks; this guidance alone establishes neither.
