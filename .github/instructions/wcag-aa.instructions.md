---
applyTo: 'libs/**/ui/**,libs/**/table/**'
---

# Copilot Instructions — WCAG 2.1 AA Compliance (Shared)

> **Scope**: These rules apply to ALL UI component libraries in this workspace.
> They are the baseline accessibility requirements. Component-specific rules
> (e.g. table, modal) are defined in their own instruction files and extend
> these shared rules.
>
> Every component Copilot generates or edits MUST comply with WCAG 2.1 AA.
> Accessibility is a hard requirement, not an enhancement.

---

## 1. Semantic HTML

- Always use the correct HTML element for its intended purpose.
- Never replace semantic elements with `<div>` + ARIA roles when a native
  element exists (e.g. `<button>` instead of `<div role="button">`).
- Use landmark elements (`<nav>`, `<main>`, `<header>`, `<footer>`, `<aside>`,
  `<section>`) where appropriate.
- Every `<img>` must have an `alt` attribute (empty `alt=""` for decorative images).
- Use `<ul>`, `<ol>`, `<dl>` for list content — never fake lists with divs.

---

## 2. Keyboard navigation

### All interactive elements must be keyboard accessible

- [ ] Reachable via Tab / Shift+Tab in logical DOM order
- [ ] Activatable with Enter and/or Space (whichever is standard for the element)
- [ ] Never use `tabindex` > 0 — only `0` (add to tab order) or `-1` (programmatic focus)
- [ ] Custom keyboard patterns (arrow keys, Escape, etc.) follow WAI-ARIA
      Authoring Practices 1.2

### Focus management

- [ ] Focus is never lost (e.g. after an element is removed from DOM, move
      focus to a sensible target)
- [ ] Focus traps are used only in modal contexts and always allow Escape to exit
- [ ] When dynamically adding content, decide if focus should move to it or
      announce it via live region — never silently add interactive content

### Focus indicators

- [ ] All interactive elements have a visible focus ring
- [ ] Focus ring has ≥ 3:1 contrast ratio against adjacent colors (WCAG 2.4.11)
- [ ] Use CSS `outline` or `box-shadow` — never `outline: none` without a
      visible replacement
- [ ] Standardize focus ring: `box-shadow: 0 0 0 3px var(--focus-ring-color)`
      or equivalent CSS custom property

---

## 3. Color and contrast

### Text contrast (WCAG 1.4.3)

- [ ] Normal text (< 18px or < 14px bold): ≥ 4.5:1 contrast ratio
- [ ] Large text (≥ 18px or ≥ 14px bold): ≥ 3:1 contrast ratio

### Non-text contrast (WCAG 1.4.11)

- [ ] UI components (buttons, inputs, checkboxes, borders): ≥ 3:1 against
      adjacent colors
- [ ] Graphical objects (icons, charts): ≥ 3:1 for parts needed to understand content

### Color is not the sole indicator (WCAG 1.4.1)

- [ ] Status, state changes, and errors use text/icon/pattern IN ADDITION to color
- [ ] Hover/selected states are distinguishable without relying on color alone
      (use outline, border, box-shadow, underline, or icon change)
- [ ] Never convey information through color alone in error messages, badges,
      or validation states

---

## 4. ARIA usage rules

### General principles

- First rule of ARIA: don't use ARIA if a native HTML element works
- If ARIA is required, use it correctly (valid roles, states, and properties)
- Never use `aria-label` or `aria-labelledby` on non-interactive, non-landmark
  elements where visible text suffices

### Required attributes by pattern

| Pattern                | Required ARIA                                                      |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------ | -------------- |
| Sortable column        | `aria-sort="ascending                                              | descending                     | none"`on`<th>` |
| Selected item          | `aria-selected="true"` on the item                                 |
| Expanded/collapsed     | `aria-expanded="true                                               | false"` on the trigger         |
| Modal dialog           | `role="dialog"` + `aria-modal="true"` + `aria-labelledby`          |
| Tab panel              | `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` |
| Loading state          | `aria-busy="true"` on the loading container                        |
| Live update            | `aria-live="polite                                                 | assertive"`+`aria-atomic="true | false"`        |
| Disabled (interactive) | Native `disabled` attribute (not `aria-disabled` alone)            |

### Forbidden patterns

- Never use `aria-disabled="true"` as the sole method of disabling a control —
  always use the native `disabled` attribute too
- Never use `role="presentation"` or `role="none"` on elements that have
  interactive children
- Never override the implicit role of a landmark element

---

## 5. Forms and inputs

- [ ] Every `<input>`, `<select>`, `<textarea>` has an associated `<label>`
      (via `htmlFor`/`for` or wrapping)
- [ ] Required fields: use `aria-required="true"` or native `required` attribute
- [ ] Error messages: use `aria-describedby` pointing to the error text element
- [ ] Error text includes specific guidance (not just "Invalid")
- [ ] Group related inputs with `<fieldset>` + `<legend>`
- [ ] Autocomplete attributes used where applicable (`autocomplete="email"`, etc.)

---

## 6. Dynamic content and live regions

- [ ] Status messages use `aria-live="polite"` (non-urgent) or
      `aria-live="assertive"` (urgent, e.g. errors)
- [ ] Live regions are present in the DOM BEFORE content is injected
- [ ] Loading states: parent container uses `aria-busy="true"`, skeleton/spinner
      content is `aria-hidden="true"`
- [ ] After async operations complete, announce results via live region or
      move focus to the result

---

## 7. Images, icons, and media

- Decorative icons: `aria-hidden="true"` + no `alt` text
- Meaningful icons: `aria-label` on the button/link wrapping them, or
  `role="img"` + `aria-label` on the SVG
- Icon-only buttons: MUST have `aria-label` (e.g. `aria-label="Close"`)
- Never rely on `title` attribute as the sole accessible name

---

## 8. Motion and animation

- [ ] Respect `prefers-reduced-motion` — disable or reduce animations
- [ ] No content that flashes more than 3 times per second (WCAG 2.3.1)
- [ ] Auto-playing content has a pause/stop mechanism

---

## 9. Responsive and zoom

- [ ] Content reflows properly at 320px width (WCAG 1.4.10)
- [ ] Text can be resized to 200% without loss of functionality (WCAG 1.4.4)
- [ ] No horizontal scrolling at default viewport sizes for vertical content
- [ ] Touch targets ≥ 44×44 CSS pixels (WCAG 2.5.8 — AAA but recommended)

---

## 10. Testing requirements

### Automated a11y testing (mandatory)

Every component test file MUST include an axe-core accessibility audit:

```typescript
// React (Vitest + Testing Library)
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('passes axe accessibility audit', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

```typescript
// Angular (Jest + Testing Library Angular)
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('passes axe accessibility audit', async () => {
  const { container } = await render(MyComponent, { ... });
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual checks (document in component README)

- Screen reader announcement order matches visual order
- Focus order matches visual layout
- All functionality available via keyboard only
- Zoom to 200% — verify no content is cut off or overlapping

---

## 11. CSS conventions for accessibility

### Visually hidden utility (screen-reader-only)

Every library must include this utility class:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Focus ring via CSS custom property

```css
:root {
  --focus-ring-color: #93c5fd;
  --focus-ring: 0 0 0 3px var(--focus-ring-color);
}

:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

### No hardcoded colors

All visual values must go through CSS custom properties so consumers can
ensure their theme meets contrast requirements.

---

## 12. What Copilot must NEVER do (accessibility)

- Never generate `outline: none` or `outline: 0` without a visible focus replacement
- Never use `tabindex` values greater than 0
- Never omit `alt` from `<img>` elements
- Never use `<div>` or `<span>` as a clickable element without `role="button"`
  and keyboard handling — prefer native `<button>` instead
- Never hide content from screen readers that is needed to understand the UI
  (`aria-hidden="true"` only on truly decorative content)
- Never generate content that relies solely on color to convey meaning
- Never use `placeholder` as a replacement for `<label>`
- Never skip the axe accessibility audit in test files
- Never use `user-select: none` on content that users may need to copy
- Never set `autocomplete="off"` on login/account forms

---

## 13. Forced-colors mode (Windows High Contrast)

Components MUST remain usable when `forced-colors: active`:

- Every interactive element draws a visible `border` OR `outline` using
  a system color (`CanvasText`, `Highlight`, `ButtonText`), or declares
  `forced-color-adjust: auto`.
- Never use `background-color` as the SOLE indicator of state — pair
  it with a border-style change or icon swap.
- Provide an explicit `@media (forced-colors: active) { … }` block in
  the component CSS for every state token that relies on colour.
- The wcag-auditor (Phase 4 Check 1) verifies this at runtime via
  chrome-devtools MCP `emulate.forcedColors = "active"`.

## 14. Reduced motion (WCAG 2.3.3)

- All non-essential transitions and animations MUST be wrapped in
  `@media (prefers-reduced-motion: no-preference) { … }`.
- The default styles (outside that media query) MUST resolve to
  `transition: none` / `animation: none` for the same properties.
- The wcag-auditor (Phase 4 Check 2) enforces this by emulating
  `reducedMotion: "reduce"` and asserting computed transition /
  animation duration ≤ 0.01s.

## 15. Text spacing (WCAG 1.4.12)

When the user overrides line-height ≥ 1.5, letter-spacing ≥ 0.12em,
word-spacing ≥ 0.16em, paragraph-spacing ≥ 2em:

- No content is clipped (no `overflow: hidden` on text-bearing surfaces).
- No horizontal scrollbars appear.
- No text overlaps adjacent content.

Implementation rules:

- Never set fixed `height` on containers that hold flowing text — use
  `min-height` or leave it auto.
- Use `overflow: auto` or `overflow: visible` on text containers,
  never `overflow: hidden`.
- Verified by Phase 4 Check 3.

## 16. 400% reflow (WCAG 1.4.10)

At a 320×256 CSS-px viewport (= 1280×1024 zoomed to 400%):

- Content reflows with NO two-dimensional scrolling (no horizontal scroll).
- Exception: data tables are exempt per SC 1.4.10. The table wrapper
  MUST still expose `overflow-x: auto` and a visible scrollbar.

Implementation rules:

- Prefer `max-width: 100%` over `min-width: <fixed-px>`.
- Use `flex-wrap: wrap` on flex rows that may overflow.
- Never set `min-width` on a top-level component greater than 320px.
- Verified by Phase 4 Check 4.

## 17. Contrast tokens — unit-tested

Every component library MUST ship `<component>.contrast.spec.ts`. It
imports `auditPairs` from `tools/scripts/contrast-check.mjs` and asserts
every documented `--ui-<comp>-*-fg` / `--ui-<comp>-*-bg` pair meets
WCAG AA at its documented usage (`normal_text` / `large_text` / `ui`).
The wcag-auditor re-runs the same check from rendered Storybook
stylesheets in Phase 4 Check 5 as defense in depth, and
`pnpm nx test-storybook shared-ui` blocks the PR on any axe `wcag2aa`
contrast violation in a rendered story.
