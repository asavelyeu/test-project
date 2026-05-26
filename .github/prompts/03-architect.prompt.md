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

Read `.agent-run/{ticket_id}/context.json` (ticket, design, confluence,
and — if this subticket belongs to an epic — `must_respect`,
`previous_designs`, `spec_paths`).
Read `.github/copilot-instructions.md`, `AGENTS.md`,
`.github/instructions/cross-framework-ui.instructions.md`, and
`.github/instructions/wcag-aa.instructions.md`. All rules there are mandatory.

### Step 0 — Delta detection (MANDATORY when the subticket belongs to an epic)

This step exists because a single component (e.g. data-table) is often
built across multiple subtickets: NGI-12 ships the plain table, NGI-13
adds pagination, NGI-14 changes the header. We must implement ONLY the
delta — never re-create what already exists, never silently change a
shipped contract.

1. Load existing state:
   - `spec_paths.component_spec` (`spec/component.json`) → existing
     `exports`, `types`, `notes` shipped by earlier subtickets.
   - `spec_paths.tokens_css` (`spec/tokens.css`) → existing
     `--ui-<component>-*` tokens.
   - `must_respect.existing_files` → files already on disk for this
     component.
   - `previous_designs[]` → figma URLs/screenshots used by earlier
     subtickets (for visual context).
2. Compare the NEW `design` (from Phase 1b) against existing state. For
   every distinct piece of UI in the new design, classify it:
   - **reuse_existing** — already implemented; new design matches the
     shipped behaviour. Do nothing. List the file path(s).
   - **modify** — already implemented but the new design changes it
     (token value, layout tweak, new prop). List file path + a 1-sentence
     change summary. Renaming exports or removing props is forbidden
     unless the subticket explicitly says so — flag it as
     `breaking_change: true` and STOP for user confirmation.
   - **create** — net-new file the prior subtickets didn't ship.
3. Emit:

   ```jsonc
   architecture.delta_plan = {
     "reuse_existing": [
       { "path": "libs/shared/ui/src/components/DataTable/DataTable.tsx", "reason": "Default table body matches NGI-12; unchanged in this design." }
     ],
     "modify": [
       { "path": "libs/shared/ui/src/core/data-table/data-table.types.ts", "change": "Add optional `pagination?: PaginationConfig` to DataTableProps." },
       { "path": "libs/shared/ui/src/core/data-table/data-table.css", "change": "Add --ui-data-table-pagination-* token group." }
     ],
     "create": [
       { "path": "libs/shared/ui/src/components/DataTable/TablePagination.tsx", "purpose": "Pagination sub-component (Prev / page numbers / Next)." },
       { "path": "libs/shared/ui/src/components/DataTable/TablePagination.stories.tsx", "purpose": "Stories: Default, FirstPage, LastPage, ManyPages." },
       { "path": "libs/shared/ui/src/components/DataTable/TablePagination.spec.tsx", "purpose": "Unit + axe + keyboard tests." }
     ],
     "breaking_changes": []
   }
   ```

4. If `delta_plan.create` and `delta_plan.modify` are BOTH empty, output
   `"delta_plan.no_op: true"` and instruct the orchestrator to skip
   Phase 3 entirely — the existing implementation already satisfies the
   new design.

If the subticket has no parent epic, skip Step 0 entirely (all work is
`create`).

### Step 1 — Existence check (only when no epic, or epic spec is empty)

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

When `delta_plan` exists: only plan NEW tokens. Tokens already present
in `spec/tokens.css` must be reused as-is — never redefine values for
existing token names. If the new design changes a token value, that's a
breaking change → add an entry to `delta_plan.breaking_changes` and
STOP for user confirmation before proceeding.

### Step 5 — WCAG 2.1 AA requirements

If unsure about a criterion, fetch `https://www.w3.org/TR/WCAG21/#{anchor}` first.

Always cover: 1.1.1, 1.3.1, 1.3.2, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.1.2,
2.4.3, 2.4.7, 4.1.2, 4.1.3.

Store as `architecture.wcag_requirements`:
[{ criterion, level: "AA", implementation_note }]

### Step 6 — File plan

Per framework, emit `architecture.file_plan` listing every file to create or
modify with a 1-line purpose. Mark `tests`, `stories`, `core`, `adapter`.

When `delta_plan` exists, `file_plan` MUST be a strict subset of
`delta_plan.modify` ∪ `delta_plan.create`. Any file in
`delta_plan.reuse_existing` MUST NOT appear in `file_plan`. The
implementers in Phase 3 will refuse to touch any file not listed here.

### Step 7 — Write

Merge `architecture` slice into context.json. Do NOT write component files.

Output: "Architecture complete. Exists: {component_exists}. Frameworks: {frameworks}. WCAG criteria: {count}."
