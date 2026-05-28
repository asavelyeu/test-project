---
description: Builds the React adapter + Storybook stories + tests pixel-perfect against Figma. Phase 3.
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles', 'runCommands']
# Plus: chrome-devtools MCP (read-only) for pixel/a11y verification.
---

PERMITTED:
filesystem read+write: `libs/shared/ui/src/components/<Pascal>/**`,
`libs/shared/ui/src/index.ts`, `.agent-run/`
filesystem read-only: rest of repo
terminal: `pnpm nx lint shared-ui`, `pnpm nx test shared-ui`,
`pnpm nx storybook shared-ui` (background only),
`pnpm nx build shared-ui`
chrome-devtools MCP: read-only (computed styles, axe-core, dimensions)
FORBIDDEN: git, Angular paths, source files outside the component path.

Apply the `frontend-react-best-practices` skill throughout.

Read context.json. If `qa.feedback_for_react` exists, fix those first.

### Delta guard (MANDATORY when `architecture.delta_plan` exists)

- Only create files in `delta_plan.create`, only edit files in
  `delta_plan.modify`. Files in `delta_plan.reuse_existing` are frozen.
- Never redefine or rename anything in `must_respect.existing_exports`.
- Never redefine values for tokens in `must_respect.existing_tokens`;
  only add new tokens or new variant/state overrides.
- If `delta_plan.no_op === true`: skip this phase entirely.
- The barrel `libs/shared/ui/src/index.ts` may be APPENDED to but never
  rewritten — preserve existing re-exports byte-for-byte.

## Pass 1 — Files

Create per `architecture.file_plan` (react entries):

- `<Pascal>.tsx` ← thin adapter, imports core logic + css
- `<Pascal>.module.css` ← only if local-scope styles needed
- `<Pascal>.stories.tsx` ← required story set (see §6 of cross-framework instructions)
- `<Pascal>.spec.tsx` ← unit + axe audit + one test per acceptance criterion
- `index.ts` ← barrel
  Update `libs/shared/ui/src/index.ts` to re-export.

## Pass 2 — Implementation rules (strict order)

1. Import core types, logic, a11y helpers from `../../core/<kebab>`.
2. Import core CSS once at module top: `import '../../core/<kebab>/<kebab>.css'`.
3. Root element matches `architecture.semantic_html.root` exactly.
4. Add `className="ui-<kebab>"` + `data-variant`/`data-state` attributes so
   consumers can hook in via Tailwind arbitrary variants or plain CSS.
5. Apply every entry in `architecture.semantic_html.aria_roles`.
6. Variants implemented via `class-variance-authority` (cva) mapped to
   `data-variant` attributes — NOT inline styles. Class merging via `clsx` +
   `tailwind-merge` (already in deps).
7. NEVER hardcode hex / px. Use `var(--ui-<kebab>-*)` only.
8. Keyboard: Tab/Shift+Tab, Enter+Space, Arrow keys (composite widgets),
   Escape (dismiss).
9. Implement every `architecture.wcag_requirements` note.

## Pass 3 — Storybook (mandatory story set)

Stories: `Default`, `AllVariants`, `AllStates`, `TailwindTheme`, `CssTheme`,
`A11yShowcase`. Use `tags: ['autodocs']`. The `TailwindTheme` story
demonstrates `className="[--ui-<kebab>-bg:theme(colors.emerald.600)]"`.
The `CssTheme` story uses a `<style>` block overriding `--ui-<kebab>-*`.

## Pass 4 — Self-review

[ ] No hardcoded colors / pixels in adapter or stories
[ ] No `<div>` where a semantic element was specified
[ ] Every interactive element has an accessible name
[ ] No positive `tabIndex`
[ ] Named exports only
[ ] Component exported from `libs/shared/ui/src/index.ts`
[ ] No `console.log` / `// TODO` / `any`

## Pass 5 — Verify

`pnpm nx lint shared-ui`
`pnpm nx test shared-ui --testFile=<Pascal>.spec.tsx`
`pnpm nx build shared-ui`

All must pass. Fix until clean.

## Pass 6 — DevTools check (uses browser-testing-with-devtools skill)

Start Storybook in background, open the `Default` story. Verify:

- Rendered dimensions vs `design.dimensions` (≤ 2px tolerance)
- Computed colors match `design.tokens.colors`
- Visible focus ring on every interactive element
- axe-core: 0 violations

Merge `implementation.react` { files_created[], files_modified[], test_files[] }
into context.json.

Output: "React adapter complete. Files: {count}. Tests/lint/build: clean."
