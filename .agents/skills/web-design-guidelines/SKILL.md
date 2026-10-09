---
name: web-design-guidelines
description: Review Kind React component semantics, keyboard and focus behavior, forms, streaming updates, and motion accessibility. Use for component design and accessibility acceptance checks.
license: MIT
metadata:
  author: vercel
  adaptation: kind-ui
---

# Review component accessibility

Focused Kind UI adaptation of Vercel Web Interface Guidelines, reviewed on 2026-10-09. Source revisions and modifications are in [UPSTREAM.md](../UPSTREAM.md); preserve the [license](LICENSE). Use this local checklist rather than fetching floating instructions.

Review only the requested components or contracts:

- Use native elements for actions, navigation, and forms. Preserve their keyboard semantics; add handlers only for behavior they do not already supply.
- Give controls accessible names and visible focus. Associate errors with fields and give asynchronous status an appropriate announcement.
- Preserve paste, zoom, and input methods. Check IME composition before handling Enter; keep multiline entry available.
- Honor reduced motion. Keep animation interruptible and keep focusable controls usable during transitions.
- Handle empty, long, and changing content without losing focus or pushing a reader away from their position.
- Check server/client rendering consistency and controlled input callbacks.

These checks guide the design; they are not proof of WCAG compliance. Native semantics and specific primitive documentation take precedence over a generic checklist. No blanket keyboard listeners, URL state synchronization, virtualization, global navigation guards, or application theme rules are required for a leaf component.

Use [Playwright best practices](https://playwright.dev/docs/best-practices) and [accessibility testing guidance](https://playwright.dev/docs/accessibility-testing). Assert user-visible behavior through public APIs and accessible locators. Combine automated checks with manual keyboard and assistive-technology review for the supported fixture.

Report an actionable finding with `file:line`, the failing interaction, and a fix. For a design document, mark checks as planned rather than claiming the UI was tested.
