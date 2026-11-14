# Context and research primitive audit

This extraction preserves the six existing modules from the immutable local snapshot
(source branch `feat/chatbot-collection`, HEAD `3ea7f30`). The primitive comparison
uses remote main `d14ec03` (including #245 and #246), verified before extraction.
No component behavior, motion, style, accessibility contract, or primitive changes
are part of this section.

| Component | Existing integration and evidence | Later recommendation |
| --- | --- | --- |
| Attachments | `attachments.tsx:4–12` uses public Button and HoverCard parts; `:159` uses Base UI `useRender` for consumer markup/ref composition. `:299`/`:311` are native image/video previews; the remaining div/span slots own layout and text. | Keep native media and layout. No missing Button/HoverCard capability found. |
| Attachment progress | `attachments.tsx:475–509` owns an SVG progressbar, finite/clamped progress, an indeterminate spinner, and reduced-motion styling. No Progress primitive exists on main. | Consider a separately reviewed determinate/indeterminate radial Progress primitive preserving SVG refs, accessible names, consumer props and reduced motion. This is a missing reusable capability, not a bypass of a shipped primitive. |
| Uploader | `uploader.tsx:462` uses the native file input; `:488–505` composes public Button through `useRender`. `:533–592` keeps the documented div/group/ref contract with drop/paste and Enter/Space alternatives. The transport `:727–812` is opt-in; request identity, abort and stale completion protection remain component logic (`:203–267`). | No file-input/dropzone primitive exists. Keep the native input and transport in AI; consider a shared dropzone only after another consumer establishes demand. Generic Button cannot replace a composer-wrapping drop target. |
| Sources | `sources.tsx:15/:30/:66` uses public Collapsible parts. `:107–120` uses `useRender` for a safe native anchor or authored non-link card. | Keep native navigation and polymorphic composition. No missing Collapsible capability found. |
| Inline Citation | `inline-citation.tsx:54/:78/:131–152` uses public Popover parts; navigation `:449–466` defaults to public Button through `useRender`. Base UI Popover at `:3` is a type-only import. | No runtime Popover bypass. Prefer exported Kind Popover types in a later API cleanup, after verifying compatibility; do not change this extraction. |
| Citation carousel | `inline-citation.tsx:196–203` integrates Embla 8.6.0; `:232–270` preserves/restores slide accessibility attributes and `:301–332` supplies keyboard alternatives. No Carousel primitive exists on main. | A later narrow Embla-backed Carousel could share orientation, API, visibility cleanup and reduced-motion handling if another consumer needs it. Preserve existing citation API and refs. |
| Context | `context.tsx:130/:146/:214–235` uses public Popover parts and `:416` uses public reduced-motion handling. Popover import `:4` is type-only. `:165–187` is decorative SVG hidden from assistive technology; trigger text/name exposes usage. | No runtime Popover bypass or need for a decorative-ring primitive. Consider public Kind Popover type aliases later. |
| Usage Meter | `context.tsx:477–506` composes Base UI Meter Root/Track/Indicator directly, with finite-range normalization and unknown/threshold states at `:466–475`. No Meter primitive exists on main. UsageMeter/UsageStat div/span slots (`:356–400`) are layout, not a second ARIA meter. | Consider public Meter parts with styling/ref/render/locale/format preservation. Keep capacity measurement distinct from upload progress. Direct Base UI composition is justified until that reviewed capability exists. |
| Selection | `selection.tsx:241/:313–347` uses public Popover parts and its supported virtual anchor. `:332/:370/:403` composes Base UI Toolbar Root/Button/Separator; Toolbar.Button renders the public Kind Button (`:375`). No Toolbar primitive exists on main. `:267` uses `useRender` for the selectable content/ref contract. | Consider styled Toolbar parts retaining roving keyboard behavior, orientation, refs and render composition. Do not replace toolbar navigation with independent buttons or a decorative separator. |

`useRender` is a Base UI composition utility, not an omitted visual primitive;
its direct uses preserve consumer markup, refs and handlers. Type-only Base UI
Popover references introduce no parallel runtime implementation. Raw text/layout,
anchors, blockquotes, media, and hidden native file controls are intentional.

All local imports in this section target shared `utils.ts`; no other section is
required. Existing foundation dependencies cover React, Motion, Base UI, Kind
primitives, clsx and Lucide. This section adds only `embla-carousel-react@8.6.0`
(and its two 8.6.0 MIT dependencies) for the preserved citation carousel. It needs
no additional shared CSS beyond the foundation's typography and primitive tokens.
