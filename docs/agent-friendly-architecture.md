# Agent-friendly architecture and first experiment

Status: proposed experiment, not an implemented architecture or a compatibility promise. The package entry point is still empty. This note adds no component, dependency, fixture, registry, or runtime protocol.

## Goal

Help coding agents discover and compose a broad set of useful UI capabilities through familiar ecosystem APIs. Performance, accessibility, extensibility, and predictable behavior matter more than a new vocabulary. An extensive capability map should make existing building blocks easier to find and combine, not require every application to adopt a Kind UI DSL.

## Two different trust boundaries

- **A coding agent authors application code.** It finds versioned documentation, types, and examples, chooses public APIs, and proposes ordinary source changes. The application developer still reviews dependencies, permissions, behavior, and tests before shipping.
- **A running application receives model-produced UI data or intent.** That output is untrusted input. A host-owned boundary must validate allowed components, props, values, URLs, and resource limits before rendering. Do not evaluate generated code or treat model text as trusted HTML. Rendering a proposed action does not authorize executing it; the host retains tool permissions, authentication, and any required confirmation.

The first experiment targets coding-agent authoring. Runtime generation would need a separate threat model and validation design; this proposal does not introduce an agent runtime, model provider dependency, or universal UI schema.

## Logical responsibilities, not a package diagram

1. **Potential shared behavior:** only semantics that a concrete capability needs, such as stable identity, explicit state transitions, and validation. Start locally. Extract a shared module only when a real second consumer needs the same responsibility; verify a distinct framework/engine stack before claiming a portable core.
2. **Framework and engine integration:** connect that behavior to an existing renderer, state/lifecycle conventions, and public extension points. Reuse established primitives for geometry, scales, focus, and interactions instead of creating a new engine. No renderer, Recharts dependency, React-only policy, or adapter matrix is selected here.
3. **Styled compositions and recipes:** compose maintained primitives into useful, editable examples with familiar styling. Keep presentation replaceable and consumer-owned; do not duplicate engine internals or require a recipe installer to use a runtime API.

[TanStack Table](https://tanstack.com/table/latest/docs/overview) illustrates separating framework-independent behavior, adapters, and consumer-owned markup. [shadcn charts](https://ui.shadcn.com/docs/components/radix/chart) illustrate composing existing Recharts components alongside optional UI pieces. These are patterns to evaluate, not choices or support claims for Kind UI.

## Familiar contracts and composition

- Name capabilities by the task they solve. A future catalog can map data display, input, navigation, feedback, and actions to existing primitives, integration points, and examples. A category is a discovery aid, not a commitment to implement another primitive library.
- Prefer explicit typed public APIs, ordinary props/events, and host state conventions. Document who owns state and what changes it. Where async work exists, define loading, partial, complete, error, cancellation, retry, and stale-result behavior only as needed by that feature.
- Expose useful slots or equivalent host-library composition points. Preserve relevant DOM props, classes/styles, refs, handlers, semantic elements, and accessibility attributes. [Radix composition](https://www.radix-ui.com/primitives/docs/guides/composition) shows why prop/ref forwarding and accessible rendered elements matter.
- Make invalid input and unsupported combinations produce actionable errors. Avoid silent fallback that changes meaning, a second hidden state store, or an abstraction that blocks the underlying library's useful APIs.
- Each proposed wrapper must explain what a direct existing-library composition cannot already provide, plus dependency, bundle, runtime, maintenance, and accessibility costs.

## Discovery channels, introduced only when useful

Start with a small versioned capability index, public types, and executable examples that agree with one another. Record inputs, outputs, state ownership, supported combinations, limitations, and common modifications. Use stable names and links so an agent can retrieve one capability without loading an entire catalog; never advertise absent exports or an unverified install command.

Future channels could expose compatible recipes through the existing [shadcn registry/MCP workflow](https://ui.shadcn.com/docs/mcp), which already supports discovery and installation, or documentation through [Fumadocs Markdown and llms indexes](https://www.fumadocs.dev/docs/integrations/llms). Evaluate these channels before building custom infrastructure. No registry, MCP server, documentation site, or installation tool is created or promised here. Installing an external integration still requires the host's normal permissions.

## First experiment and acceptance criteria

Choose one concrete authoring task and one modification that represent an unmet consumer need. Record the stack and dependency versions, sample data, expected behavior, and acceptance checks before implementation.

1. **Establish the baseline:** implement the task directly with suitable existing libraries. Then compare the smallest proposed Kind UI addition against the same task, stack, data, and behavior. Keep a direct escape path to the underlying library.
2. **Test discoverability:** two fresh coding agents independently build and modify both variants using the prospective public docs/types/examples, without project-conversation context or maintainer coaching. Keep the task and tool budget comparable and counterbalance variant order where practical. Record discovery failures, invented APIs, retries, human interventions, and results; two runs are an exploratory check, not a general reliability claim.
3. **Check deterministic correctness:** clean install, build, typecheck, and public-consumer checks must pass. Add automated interaction checks for the selected task, including keyboard/focus behavior and relevant empty, missing, or invalid input. Exercise documented customization points and any cancellation, retry, or stale-result paths introduced by the task. Do not replace these checks with an agent's visual opinion.
4. **Check accessibility and composition:** preserve semantic roles, accessible names, focus behavior, and host props/refs/handlers. Include an appropriate assistive-technology check for the selected interaction; passing one fixture is not a WCAG conformance claim.
5. **Measure incremental cost:** compare production bundle size and relevant runtime measurements against the direct-library baseline using the same build, environment, and workload. Set an acceptable overhead budget before measuring, report absolute and incremental costs, and explain any regression rather than assuming tree-shaking makes it free.
6. **Probe a real second stack:** before extracting or advertising framework-independent behavior, try the same relevant contract in a distinct framework/engine integration. Record what remains shared, what must stay adapter-specific, and whether the second consumer actually needs it. Do not add an empty adapter to claim portability.

Proceed only if the experiment shows a concrete authoring or composition benefit while meeting its predeclared correctness, accessibility, and cost criteria. If direct composition is already sufficient, improve the documentation or keep the baseline rather than inventing a layer. Report failures and unresolved decisions before proposing a public API or support matrix.

## Decisions intentionally left open

The first capability, engine and framework choices, package boundaries, supported stacks, recipe distribution, documentation host, and runtime-generation protocol remain undecided. Any implementation follows in a separate, small proposal and PR; this note is the reviewable experiment plan, not authorization to build its entire outline.
