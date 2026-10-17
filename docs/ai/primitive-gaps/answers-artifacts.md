# Answers & artifacts primitive audit

Compared with merged main `d14ec03bbfb48e3ccfad1461be34cd7cb96498b5`.
All implementation files are byte-identical to the preserved source snapshot at
`3ea7f30e6654ede08c2b8523f44b155d33f3717c` plus its untracked AI source.
This extraction changes packaging and validation only. Recommendations below are
future work, not changes implemented here. Paths are relative to the repository root.

| Component | Before: existing implementation and evidence | After: recommendation for later | Classification / reason |
| --- | --- | --- | --- |
| Question | `packages/ai/src/question.tsx:172` native fieldset; `:211` labeled native radio/checkbox; `:244` shared Textarea; `:284` shared Button | Consider narrow Checkbox and RadioGroup primitives if shared consumers require them; preserve native form behavior | Missing standalone choice primitives. Menu radio/checkbox items have menu semantics and cannot replace form inputs. Native form/fieldset/label are justified. |
| Prompt | `packages/ai/src/question.tsx:544` native fieldset, `:663` native radio, `:709` radio and `:721` write-in input; `:787` composes shared Button through useRender | Evaluate shared text Input and form-choice styling, retaining sequencing, write-in focus and consumer cancellation | Missing Input/RadioGroup primitives. Existing Combobox and Textarea do not implement these contracts. Legends and kbd at `:768` remain native semantics. |
| Markdown | `packages/ai/src/markdown.tsx:64` composes fence/table adapters and consumer overrides; `:130` Streamdown | Keep parser/plugin ownership in this adapter | No bypass of an existing Markdown primitive. Native prose, inline code and links belong to parsed content. |
| Markdown code | `packages/ai/src/markdown-code-block.tsx:177` shared CodeBlock and `:185` header/actions/content; `:59` custom consumer code, `:65` plugin renderers | Retain custom code/pre/language renderer precedence | Shared code behavior is used. Custom renderers and Mermaid are intentional extension points, not duplicated CodeBlock behavior. |
| Markdown table | `packages/ai/src/markdown-table.tsx:83` shared container, toolbar, copy/download/fullscreen; `:113` shared native table adapters | Keep rich cells, alignment and consumer overrides | Existing Table capability is used throughout; no duplicate table/menu/dialog implementation. |
| Generated Image | `packages/ai/src/generated-image.tsx:447` and `:489` Base UI Button default to shared Button via render; `:378` native progress; `:424` native img | Consider a narrow Progress primitive. Review whether Kind Button should expose Base UI focusableWhenDisabled before consolidating the outer BaseButton wrapper | Direct Base UI composition, not an unstyled native action bypass. Public props currently include full BaseButton props; Kind Button deliberately omits focusableWhenDisabled (`packages/primitives/src/button.tsx:37`). Removing the wrapper would change that contract. Native img preserves explicit alt/URL policy; no image primitive is required. |
| Document | `packages/ai/src/document.tsx:67` shared Collapsible, `:157` shared CollapsibleTrigger with Button renderer, `:222` shared CollapsiblePreviewContent | Retain preview clipping/inertness/focus ownership in the primitive | No disclosure bypass. Header/title/action wrappers and decorative fade at `:241` are component presentation. |
| Transcript | `packages/ai/src/transcript.tsx:200` useRender viewport; `:290` local scrolling; `:432` timestamp uses shared Button renderer | Consider an optional ScrollArea integration only if another consumer needs custom viewport chrome | Native scrolling is justified and already accepts a custom rendered viewport (`:268`). Timing, word ranges and seek ownership are domain logic, not missing generic primitives. |
| Feedback Bar | `packages/ai/src/feedback-bar.tsx:30` useRender layout; `:98` shared Button renderer for dismiss | Keep local controlled visibility and consumer render ownership | No existing primitive is bypassed; action/content wrappers are layout. |
| Callout | `packages/ai/src/callout.tsx:11` useRender with alert/note role, `:23` decorative icon | Consider a shared Alert/Callout recipe only with repeated non-AI demand | Missing informational-message primitive, rather than a misuse of Badge or Status. Plain content containers are justified. |
| Loader / Shimmer | `packages/ai/src/loader.tsx:24` status span, `:59` Shimmer, `packages/ai/src/thinking-dots.tsx:10` existing Motion controls and cleanup; `packages/ai/src/styles.css:18` shimmer keyframes/reduced-motion handling | Consider shared activity/shimmer recipes if reused outside AI; keep host-owned loading state | No generic Loader/Skeleton primitive exists. Button's internal spinner is private and tied to button pending semantics. Existing motion and stylesheet are preserved. |
| Status | `packages/ai/src/status.tsx:3` imports primitive Status; `:5` reexports types, `:6` variants, `:9` aliases the exact function | Retain this compatibility module | No new Status primitive. Tests assert function and variant identity. |
| Shared utilities | `packages/ai/src/utils.ts:2` buttonVariants and `:3` shared cn; `:30` derives action styling | Keep shared styling functions; do not add a universal component core | Uses documented primitive exports. Domain URL checks and controllable-state helper remain existing implementation. |

No confirmed ordinary action bypass was found in this section. Base UI useRender
preserves consumer markup/refs and is a composition helper, not a competing primitive.
The concrete missing candidates are Input, form choices and Progress; Callout,
activity styling and ScrollArea need demonstrated reuse before adding package APIs.

Validation: scoped primitives/AI build, 15 public-export Node tests, strict positive
and negative consumer expressions, owned-file Biome, and actual private tarball
runtime/import/declaration checks in NodeNext and Bundler. Consumer checks retain
the repository's `skipLibCheck: true` baseline; strict dependency declaration bodies
remain unproven (Streamdown/Shiki/Mermaid transitive declarations). Browser
interaction, visual, accessibility and full aggregate suites were not run in this
section session, per the coordinated resource limit. SSR tests do not prove async
interruption, focus, layout, reduced-motion or browser behavior.
