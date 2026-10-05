import assert from "node:assert/strict";

export function assertPublicCopy(body, label) {
  assert.doesNotMatch(
    body,
    /unpublished|pre-release|release candidate|validated, integrated|registry installation (?:is |remains )?(?:not yet verified|unverified|has not been verified)|package-provenance\.json|examples\/package\/|Package snapshot:|Vendor SHA-256:|Documentation consumer of package source|shadcn@latest add @kindui/i,
    `Stale public copy in ${label}`,
  );
}
