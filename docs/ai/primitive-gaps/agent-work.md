# Agent work primitive audit

Extraction only: Tool, Confirmation, Reasoning, Chain Of Thought, Action, Agent
Run, Plan, Task, Queue/Todo and Checkpoint retain their existing implementations,
public props, motion and accessibility. No primitive changes are included.

Compared against merged primitives at `d14ec03bbfb48e3ccfad1461be34cd7cb96498b5`
(main verified through GitHub), including #245 and #246. File/line references below
identify the extracted source; primitive references identify that merged version.

| Component | Existing primitive integration | Assessment |
| --- | --- | --- |
| Tool | `tool.tsx:3-8,78,105,173,255` uses Badge and Collapsible parts. | Lifecycle labels and icons are domain presentation. Badge permits the required content; Status's fixed indicator and six-state vocabulary are not a direct replacement for the detailed tool lifecycle. |
| Confirmation | `confirmation.tsx:3-4,359-376` composes Base UI Button with Kind Button as its default `render`. | Direct Base UI composition, not an unstyled native button. Kind Button already exposes render, class callbacks, disabled and native event props. The only identified public prop difference is `focusableWhenDisabled`: Kind omits it (`button.tsx:37`) and owns it internally (`:226`). Existing Confirmation does not set this prop itself, so this is a consumer-contract review item, not evidence that a new primitive is required. |
| Reasoning | `reasoning.tsx:3-8,174,220,280` uses Collapsible with native change details. | Stream timing, reading/focus checks and optional Markdown are component logic; no missing disclosure capability identified. |
| Chain Of Thought | `chain-of-thought.tsx:2-7,14,83,143,169,221` uses nested Collapsible parts and Badge. | Static steps, decorative icons and the image/caption wrapper are justified presentation. No new timeline primitive needed for extraction. |
| Action | `action.tsx:2-6,13,28,82` uses Collapsible parts. | Icon/label spans retain native props and consumer content. No gap identified. |
| Agent Run | `agent-run.tsx:2-6,16,35,85` uses Collapsible parts. | Host-owned execution states and decorative step markers are domain presentation. No gap identified. |
| Plan | `plan.tsx:2-6,17,102,130` uses Collapsible parts. | Streaming title/description compose Answers' Shimmer; native heading/paragraph/footer markup retains its existing contract. No gap identified. |
| Task | `task.tsx:2-6,13,29,71` uses Collapsible parts. | File and label wrappers are display content, not controls. No gap identified. |
| Queue / Todo | `queue.tsx:2-7,208,243,256,308,313,329,345` uses Button and Collapsible parts. | Native lists/items and lazy images (`:94,127,223,353`) preserve semantics. Indicators (`:137-167,370-397`) display host state and are not interactive checkboxes. File chips (`:72-92`) could later share Badge styling, but do not demonstrate a missing primitive. |
| Checkpoint | `checkpoint.tsx:2-3,67,86-99` uses Button and Tooltip shorthand with a provider. | Native wrapper, decorative divider and customizable SVG preserve their existing public DOM contracts. No gap identified. |

## Follow-ups for a separate change

| Before | Recommended later review | Why |
| --- | --- | --- |
| Confirmation exposes Base UI Button props and defaults its render to Kind Button (`confirmation.tsx:359-390`). | Test consumer-supplied render, refs, class callbacks and disabled focus, then decide whether Kind Button's focusability policy should be configurable or this composition should stay. | Avoid silently narrowing Confirmation's public API or changing its focus behavior during extraction. No primitive edit is justified by extraction alone. |
| ToolBlock owns a focusable native `pre` (`tool.tsx:281-294`); arguments use native `dl/dt/dd` (`:397-415`). | If another consumer needs the same bare code surface, consider a narrowly composable code-surface API. Keep these elements for now. | Merged CodeBlock's root props/ref target a `div` (`code-block.tsx:16`), with owned pre/code structure and string/token inputs. Replacing ToolBlock would change markup/ref/children contracts; definition lists are appropriate for argument names and values. |

## Extraction boundary and validation

The ten section modules are copied from the immutable source snapshot without
implementation changes. All use the pinned shared utilities and styles.
Reasoning requires Answers' Markdown/MarkdownProps and ThinkingDots; Plan requires
Answers' Loader/Shimmer. Confirmation's ToolState import stays inside this section.
The only added runtime dependency is the existing `partial-json@0.1.7`, used to
display incomplete streamed arguments. No AI SDK, execution runtime, app or new
primitive is introduced.

Focused validation covers public root/subpath exports, tool lifecycle labels and
falsy/partial/error values, disclosure composition, approval presentation,
Queue/Todo state, safe attachment URLs, native DOM props, and positive/negative
consumer types. The same runtime/type consumers are exercised against packed
tarballs. These checks do not claim browser interaction, async race, visual,
assistive technology or full aggregate coverage; actual check results belong in
the PR report.
