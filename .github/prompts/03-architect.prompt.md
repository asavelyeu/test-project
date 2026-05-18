---
description: Plans file structure, semantic HTML, ARIA, WCAG 2.1 AA, and cross-framework split. Phase 2.
mode: agent
model: Claude Opus 4.6
tools: ['codebase', 'editFiles', 'runCommands', 'fetch']
# Plus: nx MCP (read-only), w3.org fetch allowed.
---

PERMITTED: filesystem read (full repo), Nx MCP (read-only: list projects,
show graph, list generators), `fetch` to `https://www.w3.org/*`,
filesystem write to `.agent-run/` only.
FORBIDDEN: git, Jira, Figma, source file writes.

Invoke the `nx-workspace` skill to inspect projects and tags before planning.

Read `.agent-run/{ticket_id}/context.json` (ticket, design, confluence).
Read `.github/copilot-instructions.md`, `AGENTS.md`,
`.github/instructions/cross-framework-ui.instructions.md`, and
`.github/instructions/wcag-aa.instructions.md`. All rules there are mandatory.

### Step 1 — Existence check

Scan `libs/shared/ui/src/core/<kebab>/`, `libs/shared/ui/src/components/<Pascal>/`,
and `libs/shared/ui/src/lib/` for an existing component matching
`design.component_name` (exact, then fuzzy).

If EXISTS:
component_exists: true
existing_paths: [...]
Plan only the diff — do NOT plan a recreate.

If NOT EXISTS:
component_exists: false
Plan the canonical structure (see cross-framework-ui.instructions.md §1).

### Step 2 — Frameworks & libraries

From `ticket.frameworks`:

react: existing lib `@test-project/shared-ui`, no generator needed.

angular (if requested): - Check `package.json` for `@nx/angular`. - If missing: planned action `pnpm nx add @nx/angular`. - If `libs/shared/ui-angular/` does not exist: planned generator:
`pnpm nx g @nx/angular:library shared-ui-angular \
        --publishable --importPath=@test-project/shared-ui-angular \
        --directory=libs/shared/ui-angular --no-interactive` - Tags: `["scope:shared", "type:ui", "framework:angular"]`. - Note in `architecture.storybook_recommendation`: now that two UI libs
exist, evaluate consolidating Storybook into `apps/storybook/` (see
`agent-pipeline-meta-prompt.md` §3).

### Step 3 — Semantic HTML root

Data grid → `<table>` + `<thead>`/`<tbody>` + `<th scope>`
Navigation → `<nav>` + `<ul>`
Form → `<form>` + `<fieldset>` + `<legend>`
Disclosure → `<details>` + `<summary>`
Tabs → `role="tablist"` + `role="tab"` + `role="tabpanel"`
Modal → `<dialog>`
Card / list item → `<article>` or `<li>` with button inside
Button → `<button type="button">`

Set `architecture.semantic_html` { root, rationale, aria_roles{} }.

### Step 4 — Theming tokens (`--ui-*`)

From `design.tokens`, plan the full set of `--ui-<component>-*` custom
properties (defaults + variant/state overrides). Document the override
surface consumers will use (Tailwind arbitrary values + plain CSS).

### Step 5 — WCAG 2.1 AA requirements

If unsure about a criterion, fetch `https://www.w3.org/TR/WCAG21/#{anchor}` first.

Always cover: 1.1.1, 1.3.1, 1.3.2, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.1.2,
2.4.3, 2.4.7, 4.1.2, 4.1.3.

Store as `architecture.wcag_requirements`:
[{ criterion, level: "AA", implementation_note }]

### Step 6 — File plan

Per framework, emit `architecture.file_plan` listing every file to create or
modify with a 1-line purpose. Mark `tests`, `stories`, `core`, `adapter`.

### Step 7 — Write

Merge `architecture` slice into context.json. Do NOT write component files.

Output: "Architecture complete. Exists: {component_exists}. Frameworks: {frameworks}. WCAG criteria: {count}."
