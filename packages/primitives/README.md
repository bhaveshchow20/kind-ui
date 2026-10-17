# Kind primitives

Private shared React components for Kind's reusable interface layer. This review
candidate stays private at 0.0.0; it is not published or hosted in the public registry.
Application state, business actions and asynchronous requests remain consumer-owned.

Import individual families from `@kind-ui/primitives/button`, `/textarea`, `/avatar`,
`/tooltip`, `/popover`, `/menu`, `/collapsible`, `/badge`, `/status`, `/code-block`,
`/table`, `/dialog`, `/combobox` and `/hover-card`.
Import `@kind-ui/primitives/styles.css` after the application's stylesheet entry
and scan `@kind-ui/primitives/src` for component utilities.

Collapsible, Popover and Menu triggers compose the shared Button by default.
A custom `render` keeps control of the rendered element. `CollapsibleContent`
fully hides closed content; `CollapsiblePreviewContent` retains a single excerpt
with explicit `open` and `previewHeight` props. Clipped closed content is inert,
and `returnFocusRef` receives focus when clipping would hide the focused control.
Preview transitions respect reduced motion and leave expanded content at its
natural height as it grows. Native `height` and `maxHeight` style overrides remain
authoritative.

`CodeBlock` owns code layout, line numbers, wrapping, token presentation and
copy/download actions. Pass the original `code` string and optional `language`,
`filename`, `tokens`, `startLine`, `lineNumbers` and `wrap` props. Its default
composition includes `CodeBlockHeader`, `CodeBlockLanguage`, `CodeBlockActions`
and `CodeBlockContent`; compose these parts explicitly to customize the controls.
Actions use the original source, including whitespace. Clipboard and download
failures provide accessible feedback and optional error callbacks.
`CodeBlockContent` accepts `preStyle` for syntax-theme styles on the code surface;
its native `style` prop controls the surrounding scroll container.

`Table` and its header, body, footer, row, head, cell and caption parts preserve
native table props, refs and rich cell content. Compose them inside
`TableContainer` and `TableViewport` for bounded scrolling. Add `TableToolbar`,
`TableCopyMenu`, `TableDownloadMenu` and the `TableFullscreen` parts as needed.
Copy and download actions read the currently rendered cells, support Markdown,
CSV and TSV copying, and offer CSV and Markdown downloads. Fullscreen keeps
keyboard focus inside the dialog and returns it to its trigger on close.
Labels, filenames, callbacks and native styles remain consumer-controlled.

`Dialog` composes trigger, portal, backdrop, popup, title, description and close
parts. `DialogContent` provides the standard portal/backdrop/popup composition.
Pass a host element or ref as `themeSource` to retain a local theme across a
portal; explicit consumer styles and render props retain priority. Open state,
focus targets, dismissal callbacks and portal placement remain configurable.

`Combobox` owns searchable selection through independent input, list, item,
group, empty, status and indicator parts. Query and selected value can be
controlled separately. Inline and positioned popup compositions share generic
values, disabled items and cancellable selection. Model and command metadata
remain with their AI wrappers.

`HoverCard` provides supplementary link previews with root delays and independent
trigger, portal, positioner and popup parts. `HoverCardContent` combines the
positioning parts. Keep preview information available at the link destination;
use a dialog or popover for a surface requiring interactive keyboard controls.

Menu includes checkbox and radio item parts with checked-state semantics.
Shared `text-kind-*` roles own primitive typography; importing primitive styles
alone supplies their size and line-height. AI typography retains compatible
aliases. Table text exports read header and body cells, including body row
headers; captions, footers and merged-cell expansion are not part of that format.

Props and refs remain with their implementations. Trigger, content and item parts
compose independently; controlled state and event details pass through. Consumer
classes and styles override visual defaults. Normal focus uses a tonal treatment;
forced colors retain an explicit outline.

`packages/primitives/src` is the maintained source. `npm run build:primitives:registry`
generates an installable source item, catalog and rewritten source files under
ignored `artifacts/primitives/registry/`. These local outputs are not added to the
public Charts registry. The copied item includes the MIT license and exact runtime
dependencies; consumers supply React 19, React DOM 19 and Tailwind v4.

From the repository root, run `npm ci`, `npm run build:primitives`,
`npm run test:primitives`, `npm run check:primitives:package`, and
`npm run test:primitives:browser`. The package check installs an actual tarball in
an isolated consumer with pinned React 19.3.0, Motion 13.4.6 and Tailwind 4.3.3,
repeats the public runtime tests, and compiles positive/negative consumer types
with NodeNext and Bundler resolution. It also compiles the copied registry source.
The browser fixture is a small regression harness, not a product showcase.

Base UI 1.4.1 supplies behavior, focus and portal semantics instead of a custom
interaction engine; Motion uses the existing workspace version for feedback.
`clsx` and `tailwind-merge` preserve conditional classes and consumer overrides.
Geist is bundled locally by its font package; no remote font request is made.
These dependencies belong only to this private package; Charts is unchanged.
No Changeset is required for the private candidate, and this PR does not change
the published Charts API or version.

Keyboard and Chromium checks are focused evidence. Physical touch, VoiceOver,
Firefox/WebKit and a Next production consumer are not verified by these checks.
The normal Textarea focus treatment is intentionally tonal; forced colors get an
explicit outline. Applications may strengthen focus with their own classes.
