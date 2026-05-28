---
applyTo: 'libs/shared/ui/**,libs/shared/ui-angular/**'
---

# Cross-framework UI component rules

These rules apply to all components that ship to both React and Angular consumers.
They are layered on top of `.github/instructions/wcag-aa.instructions.md`
(WCAG 2.1 AA is non-negotiable).

## 1. Three-layer architecture

| Layer           | Path                                             | Contains                                                                | Forbidden                            |
| --------------- | ------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------ |
| Core            | `libs/shared/ui/src/core/<kebab>/`               | TS types, pure logic, a11y helpers, `--ui-*` CSS tokens                 | React, Angular, JSX, decorators      |
| React adapter   | `libs/shared/ui/src/components/<Pascal>/`        | `.tsx`, optional `.module.css`, `.stories.tsx`, `.spec.tsx`             | Direct DOM manipulation outside refs |
| Angular adapter | `libs/shared/ui-angular/src/components/<kebab>/` | `.component.ts`, `.component.html`, `.component.spec.ts`, `.stories.ts` | Re-implementing logic from core      |

## 2. Theming contract (`--ui-*` custom properties)

- Every visual value (color, spacing, radius, font-size, line-height, shadow,
  z-index) MUST be expressed as a CSS custom property in the core CSS file.
- Naming: `--ui-<component>-<role>[-<state>]`.
  Examples: `--ui-button-bg`, `--ui-button-bg-hover`, `--ui-table-row-bg-selected`.
- The core CSS file provides **sensible defaults** but never absolute brand colors.
  Defaults reference shared tokens where possible:
  `--ui-button-bg: var(--color-surface-action, #2563eb);`
- Consumers override per-project via either of the following — both MUST work
  without modifying the library:

  **Tailwind (v4 arbitrary value):**

  ```html
  <button class="[--ui-button-bg:theme(colors.emerald.600)] [--ui-button-bg-hover:theme(colors.emerald.700)]">Save</button>
  ```

  **Vanilla CSS:**

  ```css
  .checkout-page .ui-button {
    --ui-button-bg: #059669;
    --ui-button-bg-hover: #047857;
  }
  ```

- The React adapter MAY use Tailwind utilities for layout (`flex`, `gap-2`,
  `px-4`) but never for component-defining colors or sizes — those are tokens.

## 3. Naming & exports

- Core files use kebab-case (`data-table.logic.ts`).
- React components use PascalCase (`DataTable.tsx`, named export only).
- Angular components use kebab-case files + PascalCase class
  (`data-table.component.ts` → `class DataTableComponent`).
- Every component re-exports through its parent `index.ts` barrel.
- Public API surface is documented in `libs/shared/ui/src/index.ts`.

## 4. Storybook stories — required per component

Minimum story set (mirror across React and Angular when both adapters exist):

| Story           | Purpose                                                      |
| --------------- | ------------------------------------------------------------ |
| `Default`       | Baseline render                                              |
| `AllVariants`   | One render per `variant` prop value                          |
| `AllStates`     | hover / focus / disabled / loading / error                   |
| `TailwindTheme` | Demonstrates overriding tokens via Tailwind arbitrary values |
| `CssTheme`      | Demonstrates overriding tokens via a `<style>` block         |
| `A11yShowcase`  | Keyboard nav + screen-reader notes in docs                   |

Use `tags: ['autodocs']` and meaningful `argTypes`.

## 5. Tests — required per component

- Unit test file co-located.
- Must include an axe-core audit (`jest-axe` / `@axe-core/react`) — 0 violations.
- One test per acceptance criterion from the ticket.
- Use `@testing-library/user-event` for interactions — never `.click()`.

## 6. Permitted runtime dependencies

Already in repo (use these, don't add alternatives):

- `clsx` + `tailwind-merge` (React class merging)
- `class-variance-authority` (variant prop → class mapping)
- `@tanstack/*` (table core / adapters)

Adding any new runtime dep requires the Architect agent to record a
justification in `architecture.dependency_additions[]`.
