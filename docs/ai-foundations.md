# Set up Kind AI foundations

This setup records the decisions and review gates for Kind's next React component product. It is for contributors starting a focused implementation session. No AI package, public API, component, backend, or demo ships in this change. The goal is to implement components with explicit host ownership and verifiable integration boundaries.

## Repository baseline

The setup branch starts at main commit `fbb13e2` (2026-10-09). The workspace publishes `@kind-ui/charts`; `packages/charts` is the only runtime library. The docs and showcase applications have separate manifests. Charts, its APIs, and production applications remain unchanged.

Reuse these conventions:

- npm 11.9 and the root lockfile; Node 22.12 or newer
- Strict TypeScript with NodeNext modules, explicit `.js` imports, and explicit public reexports
- Props beside implementations; shared context only where components coordinate
- Scoped static CSS with consumer classes, styles, refs, and handlers preserved
- Motion for interaction animation and explicit client boundaries
- Public-export behavior tests, isolated packed consumers, and browser checks using Vite and Playwright

The current build, style-copy, prepack, package gate, and release scripts target Charts by path and name. Do not assume a new workspace is automatically built or checked. Add a narrow AI build and package gate when a real AI package exists. Keep Charts release automation independent; avoid generalizing it during setup.

The executor has Node `24.19.0` and npm `11.9.0`. Setup checks here do not replace the repository's Node 22 CI evidence.

## Keep builds and agent context scoped

Keeping AI and Charts in this repository does not require coupling their shipped packages. Before adding the AI package, define these gates in its foundation session:

- **Package commands:** provide package-scoped build, typecheck, test, and packed-consumer commands. Contributors can check one product without building every product. Keep root aggregate commands for repository-wide verification.
- **CI selection:** check each changed package and its dependent examples or applications. Shared tooling, dependency, and lockfile changes must expand the affected checks where needed. Review change detection against the dependency graph; preserve existing required checks until a replacement is verified. This setup adds no CI automation.
- **Dependency and export isolation:** keep Charts and AI manifests and public exports independent. Charts must not depend on AI, its SDK adapter, or AI-only primitives. Prove that installing and importing the packed Charts package does not pull in AI dependencies, and that each package resolves its declarations independently. A shared workspace lockfile or contributor install is not evidence of consumer isolation.
- **Shared documentation:** a combined docs site may still build pages and examples for both products, so its build time can grow. Measure that cost separately from package builds; propose scoped docs checks or caching only when justified. Package isolation alone does not make the shared site build independent.
- **Agent context:** add a package-local `AGENTS.md` when the AI package exists, with its commands, ownership contracts, and links to the relevant skills. Keep root instructions as a routing map. Read the touched package and its dependents; load skill rules on demand. Reference shared guides instead of duplicating them, and avoid loading the full repository or component catalog for one package task.

These are future verification gates. This follow-up changes documentation only; it creates no package scaffolding, agent files, build commands, or workflow changes.

## Installed skills and their use

The inventory, source pins, licenses, adaptations, and installation review are in [skill sources](../.agents/skills/UPSTREAM.md). [The Kind guide](../.agents/skills/kind-ai-components/SKILL.md) routes future sessions to the relevant skill. These are reviewed Markdown files, not executable installers or a new runtime dependency.

| Guide | Selection | Applied in this setup |
| --- | --- | --- |
| Vercel composition patterns | Reuse existing pinned skill | Ordinary props and children; context only for sibling coordination |
| Selected Vercel React performance rules | Reuse existing pinned subset | Derive display state from current host props; do not mirror conversation state |
| AI SDK | Install scoped Vercel adaptation | Inspect version-matched tool parts and actions; separate SDK mapping from core |
| Web design guidelines | Install focused Vercel adaptation | Define keyboard, focus, IME, reduced-motion, and streaming acceptance checks |
| Writing guidelines | Install focused Vercel adaptation | Distinguish proposed APIs from implemented behavior; document checks and limits |
| Kind AI components | Install original local routing guide | Connect Base UI, Motion, and Playwright official references to this repository |

The selection omits agent runtimes, deployment, provider setup, and application-specific styling rules. It also avoids duplicating the existing React skills. The skills guide implementation and review; they do not establish accessibility, performance, or SDK compatibility guarantees.

## Proposed package and integration boundary

Create `packages/ai`, provisionally named `@kind-ui/ai`, only in the next package-focused session. Keep it private at `0.0.0` while the component contracts are reviewed. Confirm naming and peer ranges in that session; this document reserves no npm name and authorizes no publication.

The proposed exports are the core entry point, a stylesheet, and an optional `./ai-sdk` entry point. Keep adapter exports out of the core barrel. Core components receive ordinary props, children, and callbacks; they import no SDK runtime or SDK types. A consumer without AI SDK must typecheck and run the core package.

The AI SDK entry point maps supported message parts and host actions. SDK-specific types may appear there. Prove declaration resolution and runtime isolation in a packed consumer with no SDK installed, then test the adapter in a separate consumer with a pinned SDK. Use optional peer metadata if the selected adapter contract requires the SDK; verify npm installation behavior rather than relying on metadata alone.

This boundary is justified by two concrete consumers: a plain React host and an AI SDK host using the same components. It does not require separate core/adapter packages, a universal schema, a store, or a plugin engine. Full chat interfaces and blocks come later.

### Accessible primitives and styling

Base UI is the proposed default primitive foundation. Its [composition guide](https://base-ui.com/react/handbook/composition) documents `render` composition and ref/prop forwarding. Native forms, buttons, and textareas remain valid when they satisfy the contract. Add `@base-ui/react` only when the selected interaction needs its behavior; record the specific primitive and dependency cost. Do not add Radix alongside it without a concrete unmet need.

Kind owns visual design and public composition. Keep styling in an AI-scoped stylesheet; do not import Charts internals or add global application CSS. Check how consumer handlers can cancel behavior, how refs compose, and which underlying DOM props remain available.

Reuse Motion through `motion/react`. [Base UI animation guidance](https://base-ui.com/react/handbook/animation) explains how mounting and exit behavior interact with Motion; test the chosen component rather than assuming one portal recipe works everywhere. [Motion accessibility guidance](https://motion.dev/docs/react-accessibility) describes reduced-motion controls. Avoid remounting active inputs or changing scroll position merely to animate a streaming update.

## State and action ownership

These are behavioral contracts to review before selecting exact prop names:

| Concern | Owner | Component responsibility |
| --- | --- | --- |
| Messages, order, IDs, conversation status | Host/SDK | Render supplied state using stable keys |
| Transport, retries, cancellation, persistence | Host/SDK | Invoke only supplied capabilities; display explicit outcomes |
| Tool input, execution, output, and permissions | Host/SDK | Distinguish partial input, readiness, running, and terminal results |
| Approval request and accepted decision | Host/server | Submit an identified decision and display authoritative state |
| Draft text | Local or controlled host | Preserve edits on failure and while earlier submissions settle |
| Disclosure and presentation | Local or controlled host | Keep semantic keyboard/focus behavior and consumer control |
| Pending UI action and inline failure | Component or host, per documented callback | Prevent duplicate activation and ignore obsolete completions |

Do not duplicate the host conversation store. Keep SDK-derived presentation state computed from current props. A component's pending UI action does not authorize execution or prove persistence.

### Composer contract

Compose an actual form with an accessible textarea and explicit action slots. Choose controlled and uncontrolled draft contracts without allowing both simultaneously. Native Enter inserts a newline by default; any send shortcut must be documented, preserve multiline input, and respect IME composition and consumer event cancellation.

Snapshot the submitted draft and prevent duplicate in-flight activation. A failed or rejected submission preserves the draft. A successful acknowledgement clears only that submitted snapshot, never newer edits. Define the acknowledgement in the host callback contract: an SDK promise settling may indicate completion of an SDK action, not durable acceptance. Do not clear a draft merely because a transport wrapper resolves after reporting an error elsewhere.

Render stop, retry, or submit controls only when the host supplies the capability. The component does not create transport or silently retry. Specify what happens on unmount or conversation changes and keep pending/error UI announced without moving focus unnecessarily.

### Tool call and result contract

Preserve `messageId` and `toolCallId` across updates. Tool disclosure may be local; tool lifecycle is always supplied. Keep streaming arguments, ready input, execution, approval, and terminal outcomes distinguishable. Show partial input as partial, not a completed request.

Treat `0`, `false`, `""`, and `null` as valid output. Determine output presence from the explicit state or tagged payload, not truthiness. Keep output errors, denial, and host-confirmed cancellation separate. A chat-level interruption alone does not prove every pending tool was cancelled.

Concurrent calls update independently by identity. Changing one tool must not reset another tool's disclosure or pending interaction. Do not render model output as trusted HTML or evaluate generated code.

### Approval contract

Preserve the message, tool-call, and approval IDs. Bind each interaction to a specific request generation; the host validates whether it is still actionable before accepting a response. Do not transfer a late response to a replacement request, even if it occupies the same visual position.

Distinguish requested, locally submitting, submission failed, response recorded, denied, and resulting execution state. Disable duplicate activation synchronously while a response is in flight. On failure, leave a still-current request retryable; ignore stale success/failure after replacement, unmount, or authoritative resolution. Document when pending locks release and how the host reports acceptance.

Only show approve/deny choices the host supplies. Automatic decisions are status, not manual approval controls. An “always allow” preference would be host policy, not a built-in permission system. The server remains responsible for authorization, validation, and persistence.

## AI SDK mapping strategy

The [installed AI SDK guide](../.agents/skills/ai-sdk/SKILL.md) requires version-matched documentation and source. During this audit, temporary local `ai@7.0.136` docs and source were inspected; dependency edits were reverted. No SDK version is supported by this setup alone.

The observed UI tool union distinguishes these states; the implementation session must recheck them for its chosen version. See [official tool usage](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage) and [UI message reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message).

| Observed SDK state | Proposed display meaning | Boundary rule |
| --- | --- | --- |
| `input-streaming` | Arguments arriving | Preserve partial input and tool ID |
| `input-available` | Input ready | Do not invent execution acknowledgement |
| `approval-requested` | Decision required or automatic decision pending | Preserve approval ID; expose manual controls only if actionable |
| `approval-responded` | Response recorded | Preserve decision; do not label execution complete |
| `output-available` | Output supplied | Preserve falsy output; check preliminary-result metadata |
| `output-error` | Tool error | Preserve error detail and any available input |
| `output-denied` | Execution denied | Keep denial separate from failure |

Execution progress and cancellation may need additional host information; the mapper must not guess absent states. Include static and dynamic tools and preserve opaque approval metadata without treating it as authorization. Keep action binding narrow: the host provides message submission, stopping, tool output, and approval response capabilities as needed. It also owns automatic continuation configuration.

Test both compile-time assignability against actual SDK types and runtime mapping with fixtures. Verify SDK error reporting and action acknowledgement semantics before wiring Composer or Approval. Do not add a model provider or make paid requests for these tests.

## Tests and documentation gates

Use the current TypeScript, Node, Vite, and Playwright infrastructure. Follow [Playwright best practices](https://playwright.dev/docs/best-practices) for isolated fixtures and accessible locators. Resolve deferred promises explicitly to exercise races; avoid timing-dependent sleeps and live services.

| Slice | Required deterministic evidence |
| --- | --- |
| Package foundation | Explicit exports, CSS packing, clean build, NodeNext/Bundler declarations, core consumer without SDK, no Charts dependency |
| Composer | Failed submit keeps draft; edits during pending survive; double clicks invoke once; native keyboard, IME, focus, controlled draft, unmount |
| Tool call/result | Falsy outputs; streaming versus ready/running; denied/error/cancelled; concurrent IDs update independently; disclosure remains stable |
| Approval | Failure stays retryable; stale completion ignored; replacement IDs/generations; duplicate decisions; host-resolved and automatic requests show no manual actions |
| SDK boundary | Pinned actual types; static/dynamic tools; approval IDs; all supported states; explicit unsupported cases; transport errors and interruption |
| Presentation | Reduced motion, rapid transition reversal, focused elements, reader scroll position, long/empty content, ref/handler/style composition |

Run the affected package checks during each implementation session, then the applicable aggregate checks before proposing its draft PR. Add behavior tests and packed-consumer coverage together. A planned test matrix is not passing evidence.

Each shipped component gets one reference covering exports, inputs, state ownership, callbacks, errors, keyboard behavior, tested versions, and a runnable local example. Start with a plain React host; add an SDK example only when its mapping is tested. Preserve discoverability for agents through explicit links, not an invented catalog or generated API claims.

Budget and measure the first representative packed consumer's incremental bundle cost and streaming update behavior before claiming performance. Accessibility automation must be supplemented by manual keyboard and assistive-technology review of the fixture; see [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing). Record browser/framework coverage instead of advertising untested support.

## Focused next sessions

Keep each session and draft PR reviewable as one decision:

1. **Package and test foundation:** confirm `@kind-ui/ai`, peers, export isolation, scoped CSS, build/prepack gate, and plain React packed consumer. Add no empty framework or agent runtime.
2. **Composer:** settle draft/acknowledgement semantics, implement composition, and prove submission, keyboard, IME, and focus contracts with a minimal fixture.
3. **Tool call/result:** implement controlled lifecycle presentation and disclosure; prove falsy output, concurrent identity updates, and interruption behavior.
4. **Approval:** implement host-bound response controls; prove failure, staleness, double-click, focus, and automatic-decision behavior.
5. **AI SDK integration:** pin the tested SDK, map real types and actions, and add deterministic transport wiring for the existing components.
6. **First-slice review:** refine original Kind visual design and Motion interactions, validate package/consumer/accessibility/performance evidence, and review component references. Interfaces, blocks, and remaining component families require later milestones.

beUI remains the main interaction reference; build original Kind implementations. SDK independence, composition, and animation are not unique claims. Do not copy unlicensed nauvalazhar/ai implementations or beUI Pro assets. Preserve notices for any future licensed code reuse.

Review the provisional package name and peer policy, draft acknowledgement behavior, approval request-generation contract, first browser/framework support, and bundle/runtime budgets in their respective sessions. None of these choices requires expanding this setup into product code.

## Setup verification

On this branch, `npm run lint` passed with 48 warnings in unchanged files, and `npm run typecheck` passed. The new guides passed frontmatter, local-link, file-mode, and SHA-256 checks. The root manifest and lockfile match the main baseline, and no AI SDK package remains installed at the workspace root.

No runtime code, package manifest, production site, or Charts source changed. Full `npm run check`, packed-consumer tests, browser tests, and visual screenshots were not run for this documentation-and-skills setup. Those gates remain required for the later component implementations; this setup claims no new runtime compatibility.
