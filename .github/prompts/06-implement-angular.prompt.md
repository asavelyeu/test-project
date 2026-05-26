---
description: Builds the Angular adapter + Storybook stories + tests. Phase 3 — only when ticket requires Angular.
mode: agent
model: Claude Sonnet 4.6
tools: ['codebase', 'editFiles', 'runCommands']
# Plus: chrome-devtools MCP (read-only).
---

PERMITTED:
filesystem read+write: `libs/shared/ui-angular/**`, `.agent-run/`
filesystem read-only: rest of repo
terminal: `pnpm nx add @nx/angular` (only if missing),
`pnpm nx g @nx/angular:library …` (only on first run),
`pnpm nx g @nx/storybook:configuration shared-ui-angular …` (only on first run),
`pnpm nx lint shared-ui-angular`,
`pnpm nx test shared-ui-angular`,
`pnpm nx build shared-ui-angular`,
`pnpm nx storybook shared-ui-angular` (background)
chrome-devtools MCP: read-only.
FORBIDDEN: git, React paths, core paths (use them read-only via the package alias).

Read context.json. If `qa.feedback_for_angular` exists, fix those first.

### Delta guard (MANDATORY when `architecture.delta_plan` exists)

- Only create files in `delta_plan.create`, only edit files in
  `delta_plan.modify`. Files in `delta_plan.reuse_existing` are frozen.
- Never redefine or rename anything in `must_respect.existing_exports`.
- Never redefine existing tokens; only add new ones.
- If `delta_plan.no_op === true`: skip this phase entirely.
- The barrel `libs/shared/ui-angular/src/index.ts` may be APPENDED to
  but never rewritten.

## Pass 1 — Bootstrap (skip if already done)

1. If `@nx/angular` missing in `package.json`: `pnpm nx add @nx/angular`.
2. If `libs/shared/ui-angular/` missing: run the generator from
   `architecture.angular_generator_command`.
3. If Storybook missing for the lib: configure via `@nx/storybook:configuration`.

## Pass 2 — Files

Create per `architecture.file_plan` (angular entries):

- `<kebab>.component.ts` ← standalone component, imports core
- `<kebab>.component.html` ← template using `class="ui-<kebab>"` + `[attr.data-variant]`
- `<kebab>.component.spec.ts` ← @testing-library/angular + jest-axe
- `<kebab>.stories.ts` ← required story set, mirror React names
- Update `libs/shared/ui-angular/src/index.ts`.

## Pass 3 — Implementation rules

- Import types & logic from `@test-project/shared-ui` (the core barrel
  re-exports them).
- Import the core CSS once via the component's `styleUrls` OR via Storybook
  `preview.ts` — whichever yields a single source of truth.
- Root element matches `architecture.semantic_html.root`. Same aria_roles.
- NEVER duplicate logic that exists in core. Wrap it.
- Theming: same `--ui-<kebab>-*` overrides work — consumers can apply them
  via global stylesheets or component-level `[style]` bindings.
- Standalone components by default (Angular 17+).

## Pass 4 — Verify

`pnpm nx lint shared-ui-angular`
`pnpm nx test shared-ui-angular`
`pnpm nx build shared-ui-angular`

## Pass 5 — DevTools check

Storybook → verify dimensions, colors, focus ring, axe 0 violations.

Merge `implementation.angular` slice into context.json.

Output: "Angular adapter complete. Files: {count}. Tests/lint/build: clean."
