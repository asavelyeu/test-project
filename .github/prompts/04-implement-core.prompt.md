---
description: Builds the framework-agnostic core slice (types, logic, --ui-* CSS tokens). Phase 3 (always runs first).
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles', 'runCommands']
---

PERMITTED:
filesystem read+write: `libs/shared/ui/src/core/<kebab>/**` + `.agent-run/`
filesystem read-only: rest of repo
terminal: `pnpm nx lint shared-ui`, `pnpm nx test shared-ui` (scoped)
FORBIDDEN: writing anything under `components/`, Angular paths, or git.

Read context.json (ticket, design, architecture). If `qa.feedback_for_core`
exists, fix every listed issue first.

### Delta guard (MANDATORY when `architecture.delta_plan` exists)

- You MUST only create files listed in `architecture.delta_plan.create`
  and edit files listed in `architecture.delta_plan.modify`.
- You MUST NOT touch any file in `architecture.delta_plan.reuse_existing`
  — these are shipped and frozen for this subticket.
- You MUST NOT redefine, rename, or remove any symbol in
  `must_respect.existing_exports` or any token in
  `must_respect.existing_tokens`. Extend instead.
- If `architecture.delta_plan.no_op === true`: output
  "Core: no-op (delta is empty)." and exit without writing any files.
- If you discover the plan is wrong (e.g. a 'modify' is actually a
  breaking change), STOP and report to the orchestrator — do not
  improvise.

Invoke the `nx-generate` skill if a generator is needed for file scaffolding.

Create per `architecture.file_plan` (core entries):

- `<kebab>.types.ts` ← all public types & prop contracts
- `<kebab>.logic.ts` ← pure functions, state reducers, formatters
- `<kebab>.a11y.ts` ← keyboard maps, ARIA computation helpers
- `<kebab>.css` ← full `--ui-<component>-*` token surface
  with sensible defaults referencing shared tokens
- `index.ts` ← barrel

Rules:

- NO `import React`, NO `@angular/*`, NO JSX, NO decorators.
- Every visual value is a CSS custom property in `<kebab>.css`. Defaults
  use `var(--color-*, <fallback>)` form so consumers can override at any level.
- Provide variant + state token overrides:
  `.ui-<kebab>[data-variant="primary"] { --ui-<kebab>-bg: ...; }`
  `.ui-<kebab>:hover { --ui-<kebab>-bg: var(--ui-<kebab>-bg-hover); }`

Run `pnpm nx lint shared-ui` and `pnpm nx test shared-ui` (filter to core
files). All green before completing.

Merge `implementation.core` { files_created[], files_modified[] } into context.json.

Output: "Core complete. Files: {count}. Tokens: {token_count}. Lint/tests: clean."
