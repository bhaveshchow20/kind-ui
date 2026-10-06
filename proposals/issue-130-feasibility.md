# Issue #130: optional Motion design decision (implementation incomplete)

Base: PR127 `feat/chart-loading-fresh`, exact shallow checkout HEAD
`6fdd49a00bc1a39237ccf84f28ded2edf9b733bb`.
Issue: https://github.com/bhaveshchow20/kind-ui/issues/130

## Finding

The current default ESM entry cannot render without package resolution of Motion.
`index.ts` reexports `animation.tsx`, area and other families. Sixteen source
modules directly import `motion/react`. The dependency is not limited to chart
entrance: active marks, controlled line visibility, moving tooltip frames,
rolling digits, loading masks/pulses/radar morphs, polar/scatter/Sankey values,
and heatmap imperative animation also use it. `LineAnimation` exposes Motion's
`Transition` through reveal easing and hover transition. Removing runtime imports
alone therefore does not establish declaration resolution without Motion.

The package emits individual ESM/declaration files with tsc (NodeNext), exports
only the default entry and stylesheet, and has a CSS-only sideEffects allowance.
The package gate explicitly installs Motion, asserts the removed `/motion`
subpath does not resolve, and tests static fixtures WITH the required peer.
Existing green gates do not prove the absent-package scenario.

## Compatibility constraint

A runtime animate prop is evaluated after ESM dependencies are resolved. It
cannot prevent a static import failure. `import('motion/react').catch(...)` avoids
an eager Node runtime failure, but its literal specifier remains a build-time
resolution dependency in bundlers. Nonliteral imports / ignore directives merely
move resolution into the browser, where a bare package specifier is not reliably
resolvable. No hidden CDN, global adapter, or custom animation engine is proposed.

There is no demonstrated portable mechanism here that simultaneously preserves
unchanged default imports, automatically selects Motion solely because it is
installed, and builds those imports when Motion is absent. Treat that combined
promise as unresolved, not as an implementation detail that metadata fixes.

## Options requiring a design decision

The following alternative would relax the compatibility requirement and is NOT approved for implementation: two explicitly selected public entry graphs within the SAME package:

1. A Motion-free default entry preserving exported component names/props. Static
   chart interactions, refs, native identity, geometry, and visibility remain
   consumer-owned. Requested animation is a no-op with a development warning.
2. An explicit `/motion` entry retaining today's Motion implementation and
   loading visuals. It requires the Motion peer and keeps current animation props,
   reduced-motion behavior, digit reels, interruption semantics, SSR shell, and
   hydration behavior. Consumers wanting today's animations change their imports.

This preserves API shapes but is an observable compatibility change: having
Motion installed alone would no longer turn default-import animation on. It also
reintroduces a subpath explicitly forbidden by today's package contract. Parent
approval is needed for exports/build/package-gate coordination and this tradeoff.
If unchanged import usage AND automatic installed-Motion behavior are mandatory,
stop implementation pending a different approved packaging contract; do not claim
this option satisfies that requirement.

A context-scoped opt-in provider is an alternative to dual imports, but adds public
API and requires careful native series recognition and hook/state boundaries.
It is not smaller for this repository and would still require an explicit
Motion-dependent entry. Do not introduce it solely to conceal the tradeoff.

## Additive `/static` entry: narrower option

An additive `@kind-ui/charts/static` entry could leave the default entry, its
existing automatic animations, and all current Motion consumer imports intact.
Only consumers deliberately choosing static charts would change their imports.
The new graph would export compatible static component names/props without any
runtime or declaration dependency on Motion. Requested animation would be a
no-op with a development warning. The default entry would still require Motion;
this must not be described as making today's main entry optional.

This could address a narrower static-chart use case but cannot satisfy all #130
acceptance criteria under unchanged main-entry imports. With the mandatory peer
metadata preserved, ordinary npm installation would still install Motion even
for `/static` users. A future optional peer change could avoid automatic install
for those users, but would leave main-entry imports failing without Motion. That
would require a separately approved contract and explicit documentation, after
actual packed-resolution proof. No such metadata change belongs in this draft.

A genuine static graph requires removing transitive reaches to `animation.tsx`,
loading Motion hooks, and tooltip digits as well as direct family imports.
Existing `line-chart.tsx` is not already a safe standalone static implementation:
it imports the Motion-dependent loading surface. Re-exporting that module is
therefore insufficient. This is a focused extraction decision, not a proven
one-file subpath change. Avoid duplicating an entire chart engine or changing
native Recharts registration; isolate presentation-only branches and keep
shared consumer-owned geometry, interaction, and configuration.

Tradeoffs requiring user review: whether static-only opt-in is useful despite
not completing #130, whether any absent-Motion behavior at the existing main
entry may change, and whether animation selection may become explicit. Until
those decisions are made, preserve the existing default implementation.

## Future implementation boundaries (not authorized by this draft)

Extract only shared static frame/interaction/config types and pure loading design
geometry as needed. Keep Motion implementation intact, including accepted PR127
illustrations, timing, masks, direction, and seed changes. Static loading must use
the SAME geometry and status semantics, fully visible frozen masks, deterministic
seed, and no hidden pulse/morph work; compare against existing reduced-motion
presentation. Digits render the original formatted value in the static entry,
including bidi and non-ASCII handling. Do not approximate springs or reels in CSS.

Public animation option types must be structurally compatible with existing
Motion Transition usage while resolving absent Motion. Assess the actual pinned
upstream declaration before deciding whether a narrow local public type is exact
enough; no type parity is proven yet. Preserve accepted consumer function easing
and transition options, or explicitly escalate any incompatibility.

Only after runtime AND declaration proof should optional peer metadata change.
Generated lock changes require coordination with the parent's lock policy;
no hand-edited lock or version bump. Add a unique patch changeset for a compatible
approved design, or a minor changeset if the selected import behavior is judged
breaking under repository policy.

## Required proof before a reviewable draft

Use an isolated packed consumer OUTSIDE the workspace with React/Recharts but no
Motion or transitively resolvable Motion family packages. Confirm module absence
before and after install. Import the public default ESM entry; strict NodeNext
and Bundler typecheck; build Vite production and pinned Next App Router SSR /
hydration consumers. Exercise animate=false AND requested-animation fallback,
all-family loading/completion/interruption, tooltips, controlled visibility,
keyboard/pointer interaction, refs, reduced motion, and formatter cases.

Use a second pinned Motion consumer to prove the explicit animation entry retains
PR127 loading visuals and current animation/digit/tooltip contracts. Inspect the
static production graph for Motion imports/chunks; run existing tree-shake and
package negative gates with their approved contract update. Run the required
aggregate check once a disk slot is granted. No broad CI/security changes.

## Evidence and limits

Read full issue (zero comments), AGENTS.md, CONTRIBUTING.md, README.md,
docs/development.md, composition-patterns skill and selected state-decoupling
rule. Inspected exact-head source, manifests, tsconfig and package checks.
Checkout is source-only: no installs/builds, no package-resolution experiment,
no tests, no metadata/code edits, no draft PR, and no CI polling. Bundler and type
compatibility conclusions above are architectural constraints, not a completed
consumer proof. This design-only draft needs no install slot. Await the user’s architectural
decision before implementation; dependency/build verification remains unrun.
Issue #130 remains open and implementation incomplete. No changeset is needed
for this repository-only design document under the documentation policy.
